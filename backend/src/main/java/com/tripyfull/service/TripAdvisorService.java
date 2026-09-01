package com.tripyfull.service;

import com.tripyfull.model.Place;
import com.tripyfull.model.PlaceVisibility;
import com.tripyfull.model.User;
import com.tripyfull.repository.PlaceRepository;
import com.tripyfull.security.OwnershipGuard;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tripadvisor ratings + reviews via the Terra API (terra.tripadvisor.com).
 * Fetched on demand and cached in memory — nothing is persisted, per Tripadvisor
 * display terms (always show attribution next to this data in the UI).
 */
@Service
public class TripAdvisorService {

    private static final Logger log = LoggerFactory.getLogger(TripAdvisorService.class);
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};

    private static final String BASE = "https://terra.tripadvisor.com/api";
    private static final long CACHE_TTL_MS = 6 * 3600_000L;
    private static final int CACHE_MAX_ENTRIES = 500;
    /** A search hit further than this from the place's own pin is considered a mismatch. */
    private static final double MAX_MATCH_DISTANCE_KM = 2.0;

    public record TaReview(String title, String text, int rating, String publishedDate,
                           String username, String url) {}

    public record TaSummary(long locationId, double rating, int reviewCount,
                            String ratingIconUrl, String url, List<TaReview> reviews) {}

    private record Cached(TaSummary summary, long timestamp) {}

    private final String apiKey;
    private final PlaceRepository placeRepository;
    private final OwnershipGuard guard;
    private final RestClient restClient;
    private final Map<UUID, Cached> cache = new ConcurrentHashMap<>();

    public TripAdvisorService(@Value("${tripadvisor.api-key:}") String apiKey,
                              PlaceRepository placeRepository, OwnershipGuard guard) {
        this.apiKey = apiKey;
        this.placeRepository = placeRepository;
        this.guard = guard;
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader("X-API-Key", apiKey)
                .build();
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Rating + top reviews for a place the user can see, or null when TA has no match. */
    public TaSummary summaryForPlace(UUID placeId, String username) {
        if (!isEnabled()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tripadvisor is not configured");
        }
        User user = guard.requireUser(username);
        Place place = placeRepository.findById(placeId)
                .filter(p -> p.getOwner().getId().equals(user.getId())
                        || p.getVisibility() == PlaceVisibility.PUBLIC)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));

        Cached cached = cache.get(placeId);
        if (cached != null && System.currentTimeMillis() - cached.timestamp < CACHE_TTL_MS) {
            return cached.summary;
        }
        TaSummary summary = fetchSummary(place);
        if (cache.size() >= CACHE_MAX_ENTRIES) cache.clear();
        cache.put(placeId, new Cached(summary, System.currentTimeMillis()));
        return summary;
    }

    /* ---- Terra calls ---- */

    @SuppressWarnings("unchecked")
    private TaSummary fetchSummary(Place place) {
        try {
            Long locationId = matchLocation(place);
            if (locationId == null) return null;

            Map<String, Object> details = restClient.get()
                    .uri(BASE + "/locations/{id}?language=en", locationId)
                    .retrieve()
                    .body(MAP_TYPE);
            if (details == null) return null;

            double rating = 0;
            int count = 0;
            String iconUrl = null;
            if (details.get("traveler_ratings") instanceof Map<?, ?> tr
                    && tr.get("overall") instanceof Map<?, ?> overall) {
                rating = toDouble(overall.get("rating"));
                count = (int) toDouble(overall.get("count"));
                iconUrl = str(overall.get("icon_url"));
            }
            String url = null;
            if (details.get("urls") instanceof Map<?, ?> urls
                    && urls.get("tripadvisor") instanceof Map<?, ?> ta) {
                url = str(ta.get("main"));
            }
            if (rating == 0 && count == 0) return null;
            return new TaSummary(locationId, rating, count, iconUrl, url, fetchReviews(locationId));
        } catch (Exception e) {
            log.warn("Tripadvisor lookup failed for '{}': {}", place.getName(), e.getMessage());
            return null;
        }
    }

    /** Search by name (+country); with coordinates present, require a hit within 2 km. */
    @SuppressWarnings("unchecked")
    private Long matchLocation(Place place) {
        String uri = BASE + "/locations/search?query={q}&size=5"
                + (place.getCountry() != null && !place.getCountry().isBlank() ? "&country_code={cc}" : "");
        Map<String, Object> body = place.getCountry() != null && !place.getCountry().isBlank()
                ? restClient.get().uri(uri, place.getName(), place.getCountry()).retrieve().body(MAP_TYPE)
                : restClient.get().uri(uri, place.getName()).retrieve().body(MAP_TYPE);
        List<Map<String, Object>> data = body != null ? (List<Map<String, Object>>) body.get("data") : null;
        if (data == null || data.isEmpty()) return null;

        record Hit(long id, double distanceKm) {}
        List<Hit> hits = new ArrayList<>();
        for (Map<String, Object> item : data) {
            if (!(item.get("location") instanceof Map<?, ?> loc) || loc.get("id") == null) continue;
            long id = (long) toDouble(loc.get("id"));
            double distance = 0;
            if (place.getLatitude() != null && place.getLongitude() != null
                    && loc.get("coordinates") instanceof Map<?, ?> c) {
                distance = TripPlanningService.haversine(
                        place.getLatitude().doubleValue(), place.getLongitude().doubleValue(),
                        toDouble(c.get("latitude")), toDouble(c.get("longitude")));
            }
            hits.add(new Hit(id, distance));
        }
        return hits.stream()
                .filter(h -> place.getLatitude() == null || h.distanceKm <= MAX_MATCH_DISTANCE_KM)
                .min(Comparator.comparingDouble(Hit::distanceKm))
                .map(Hit::id)
                .orElse(null);
    }

    @SuppressWarnings("unchecked")
    private List<TaReview> fetchReviews(long locationId) {
        try {
            Map<String, Object> body = restClient.get()
                    .uri(BASE + "/locations/{id}/reviews?language=en&size=3&sort_by=MOST_RECENT", locationId)
                    .retrieve()
                    .body(MAP_TYPE);
            List<Map<String, Object>> data = body != null ? (List<Map<String, Object>>) body.get("data") : null;
            if (data == null) return List.of();
            List<TaReview> reviews = new ArrayList<>();
            for (Map<String, Object> r : data) {
                String username = r.get("user") instanceof Map<?, ?> u ? str(u.get("username")) : null;
                String publishTs = str(r.get("publish_ts"));
                reviews.add(new TaReview(
                        localized(r.get("title")),
                        localized(r.get("text")),
                        (int) toDouble(r.get("rating")),
                        publishTs != null && publishTs.length() >= 10 ? publishTs.substring(0, 10) : publishTs,
                        username,
                        str(r.get("url"))));
            }
            return reviews;
        } catch (Exception e) {
            log.warn("Tripadvisor reviews fetch failed for {}: {}", locationId, e.getMessage());
            return List.of();
        }
    }

    /** Terra returns localized fields as [{language, value, primary}] arrays. */
    private String localized(Object field) {
        if (!(field instanceof List<?> list)) return null;
        for (Object o : list) {
            if (o instanceof Map<?, ?> m && "en".equals(m.get("language"))) return str(m.get("value"));
        }
        return list.isEmpty() || !(list.get(0) instanceof Map<?, ?> first) ? null : str(first.get("value"));
    }

    private double toDouble(Object o) { return o instanceof Number n ? n.doubleValue() : 0; }
    private String str(Object o) { return o != null ? o.toString() : null; }
}
