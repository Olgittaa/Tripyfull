package com.tripyfull.service;

import com.tripyfull.model.Place;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Optional attraction enrichment via OpenTripMap (https://dev.opentripmap.org):
 * 10M+ tourist POIs with Wikipedia descriptions and photos. Free non-commercial
 * tier — 5000 requests/day, 10 rps, no credit card; key goes into
 * OPENTRIPMAP_API_KEY. Fully best-effort: no key / no match / API down → no-op,
 * the place is saved exactly as the geocoder returned it.
 */
@Service
public class OpenTripMapService {

    private static final Logger log = LoggerFactory.getLogger(OpenTripMapService.class);
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_MAP_TYPE = new ParameterizedTypeReference<>() {};
    private static final int MATCH_RADIUS_METERS = 300;
    private static final int DESCRIPTION_LIMIT = 2000;   // Place.description column size
    private static final int PHOTO_URL_LIMIT = 255;      // place_photos element column size

    private final RestClient restClient = RestClient.builder()
            .defaultHeader("User-Agent", "Tripyfull/1.0 (travel planner app)")
            .build();

    @Value("${opentripmap.api-key:}")
    private String apiKey;

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Fills an empty description (Wikipedia extract) and/or first photo on a place
     * that has coordinates. Existing user data is never overwritten.
     */
    public void enrich(Place place) {
        if (!isEnabled() || place == null) return;
        if (place.getLatitude() == null || place.getLongitude() == null) return;
        boolean needsDescription = place.getDescription() == null || place.getDescription().isBlank();
        boolean needsPhoto = place.getPhotos() == null || place.getPhotos().isEmpty();
        if (!needsDescription && !needsPhoto) return;

        try {
            String xid = findXid(place);
            if (xid == null) return;
            Map<String, Object> details = restClient.get()
                    .uri("https://api.opentripmap.com/0.1/en/places/xid/{xid}?apikey={key}", xid, apiKey)
                    .retrieve()
                    .body(MAP_TYPE);
            if (details == null) return;

            if (needsDescription) {
                String text = extractDescription(details);
                if (text != null && !text.isBlank()) {
                    place.setDescription(text.length() > DESCRIPTION_LIMIT
                            ? text.substring(0, DESCRIPTION_LIMIT - 1) + "…"
                            : text);
                }
            }
            if (needsPhoto) {
                String img = extractImage(details);
                if (img != null && !img.isBlank() && img.length() <= PHOTO_URL_LIMIT) {
                    place.getPhotos().add(img);
                }
            }
        } catch (Exception e) {
            log.debug("OpenTripMap enrichment skipped for '{}': {}", place.getName(), e.getMessage());
        }
    }

    /** Nearest OpenTripMap object around the place whose name matches it. */
    private String findXid(Place place) {
        List<Map<String, Object>> items = restClient.get()
                .uri("https://api.opentripmap.com/0.1/en/places/radius?radius={r}&lon={lon}&lat={lat}&format=json&limit=25&apikey={key}",
                        MATCH_RADIUS_METERS, place.getLongitude(), place.getLatitude(), apiKey)
                .retrieve()
                .body(LIST_MAP_TYPE);
        if (items == null) return null;

        String wanted = normalize(place.getName());
        if (wanted.isBlank()) return null;
        for (Map<String, Object> item : items) {
            String name = normalize(item.get("name") != null ? item.get("name").toString() : null);
            if (name.isBlank()) continue;
            if (name.contains(wanted) || wanted.contains(name)) {
                Object xid = item.get("xid");
                if (xid != null) return xid.toString();
            }
        }
        return null;
    }

    private String extractDescription(Map<String, Object> details) {
        if (details.get("wikipedia_extracts") instanceof Map<?, ?> we && we.get("text") != null) {
            return we.get("text").toString();
        }
        if (details.get("info") instanceof Map<?, ?> info && info.get("descr") != null) {
            return info.get("descr").toString();
        }
        return null;
    }

    private String extractImage(Map<String, Object> details) {
        if (details.get("preview") instanceof Map<?, ?> preview && preview.get("source") != null) {
            return preview.get("source").toString();
        }
        return details.get("image") != null ? details.get("image").toString() : null;
    }

    private String normalize(String s) {
        return s == null ? "" : s.toLowerCase().trim();
    }
}
