package com.tripyfull.service;

import com.tripyfull.model.Place;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Google Places API (New, v1) provider — used for place search, geocoding and
 * enrichment when {@code google.maps.api-key} is configured; the free OSM stack
 * stays as fallback. Field masks are kept at the Pro tier for searches; the
 * one-off enrichment call requests Enterprise fields (photos, editorial summary).
 */
@Service
public class GooglePlacesService {

    private static final Logger log = LoggerFactory.getLogger(GooglePlacesService.class);
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};

    private static final String SEARCH_FIELDS =
            "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.addressComponents";
    private static final String DETAILS_FIELDS = "id,displayName,editorialSummary,photos,rating,userRatingCount";

    private final String apiKey;
    private final RestClient restClient;

    public GooglePlacesService(@Value("${google.maps.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .defaultHeader("Accept-Language", "en")
                .build();
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** Free-text place search (Text Search). Same result shape as the Photon-backed search. */
    @SuppressWarnings("unchecked")
    public List<GeoSearchService.PlaceResult> searchText(String query, String regionCode, int limit) {
        Map<String, Object> body = restClient.post()
                .uri("https://places.googleapis.com/v1/places:searchText")
                .header("X-Goog-Api-Key", apiKey)
                .header("X-Goog-FieldMask", SEARCH_FIELDS)
                .header("Content-Type", "application/json")
                .body(regionCode != null && !regionCode.isBlank()
                        ? Map.of("textQuery", query, "languageCode", "en", "pageSize", limit,
                                 "regionCode", regionCode.toUpperCase(Locale.ROOT))
                        : Map.of("textQuery", query, "languageCode", "en", "pageSize", limit))
                .retrieve()
                .body(MAP_TYPE);
        List<Map<String, Object>> places = body != null ? (List<Map<String, Object>>) body.get("places") : null;
        if (places == null) return List.of();
        List<GeoSearchService.PlaceResult> results = new ArrayList<>();
        for (Map<String, Object> p : places) {
            GeoSearchService.PlaceResult r = toPlaceResult(p);
            if (r != null) results.add(r);
        }
        return results;
    }

    /** Best single match as a geocode result, or null. Дедуп по osmId получает ключ "g:{placeId}". */
    @SuppressWarnings("unchecked")
    public GeocodingService.GeocodeResult geocode(String text, String country) {
        try {
            List<Map<String, Object>> places = rawSearch(text, country, 3);
            if (places.isEmpty()) return null;
            Map<String, Object> p = places.get(0);
            double[] latLng = location(p);
            if (latLng == null) return null;
            Map<String, String> addr = addressComponents(p);
            String types = p.get("types") instanceof List<?> t ? String.join(",", t.stream().map(Object::toString).toList()) : null;
            return new GeocodingService.GeocodeResult(
                    BigDecimal.valueOf(latLng[0]), BigDecimal.valueOf(latLng[1]),
                    str(p.get("formattedAddress")),
                    p.get("id") != null ? "g:" + p.get("id") : null,
                    addr.get("country"), addr.get("city"),
                    displayName(p), types);
        } catch (Exception e) {
            log.warn("Google geocode failed for '{}': {}", text, e.getMessage());
            return null;
        }
    }

    /**
     * Fills an empty description and/or photos via Place Details (photos resolved to
     * stable googleusercontent URLs so no API key leaks to the frontend).
     * Existing user data is never overwritten.
     */
    @SuppressWarnings("unchecked")
    public void enrich(Place place) {
        if (!isEnabled() || place == null || place.getName() == null) return;
        boolean needsDescription = place.getDescription() == null || place.getDescription().isBlank();
        boolean needsPhoto = place.getPhotos() == null || place.getPhotos().isEmpty();
        if (!needsDescription && !needsPhoto) return;

        try {
            String placeId = resolvePlaceId(place);
            if (placeId == null) return;
            Map<String, Object> details = restClient.get()
                    .uri("https://places.googleapis.com/v1/places/{id}", placeId)
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", DETAILS_FIELDS)
                    .retrieve()
                    .body(MAP_TYPE);
            if (details == null) return;

            if (needsDescription && details.get("editorialSummary") instanceof Map<?, ?> s
                    && s.get("text") != null) {
                place.setDescription(s.get("text").toString());
            }
            if (needsPhoto && details.get("photos") instanceof List<?> photos && !photos.isEmpty()) {
                List<String> urls = new ArrayList<>();
                for (Object o : photos.subList(0, Math.min(3, photos.size()))) {
                    if (o instanceof Map<?, ?> photo && photo.get("name") != null) {
                        String url = resolvePhotoUrl(photo.get("name").toString());
                        if (url != null) urls.add(url);
                    }
                }
                if (!urls.isEmpty()) place.setPhotos(urls);
            }
        } catch (Exception e) {
            log.warn("Google enrichment failed for '{}': {}", place.getName(), e.getMessage());
        }
    }

    /* ---- internals ---- */

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> rawSearch(String text, String regionCode, int limit) {
        Map<String, Object> body = restClient.post()
                .uri("https://places.googleapis.com/v1/places:searchText")
                .header("X-Goog-Api-Key", apiKey)
                .header("X-Goog-FieldMask", SEARCH_FIELDS)
                .header("Content-Type", "application/json")
                .body(regionCode != null && !regionCode.isBlank()
                        ? Map.of("textQuery", text, "languageCode", "en", "pageSize", limit,
                                 "regionCode", regionCode.toUpperCase(Locale.ROOT))
                        : Map.of("textQuery", text, "languageCode", "en", "pageSize", limit))
                .retrieve()
                .body(MAP_TYPE);
        List<Map<String, Object>> places = body != null ? (List<Map<String, Object>>) body.get("places") : null;
        return places != null ? places : List.of();
    }

    private String resolvePlaceId(Place place) {
        // Places created through Google search carry "g:{placeId}" in osmId.
        if (place.getOsmId() != null && place.getOsmId().startsWith("g:")) {
            return place.getOsmId().substring(2);
        }
        String query = place.getCity() != null && !place.getCity().isBlank()
                ? place.getName() + ", " + place.getCity() : place.getName();
        List<Map<String, Object>> found = rawSearch(query, place.getCountry(), 1);
        return found.isEmpty() ? null : str(found.get(0).get("id"));
    }

    /** Follows the photo media endpoint without redirect to get a key-free googleusercontent URL. */
    @SuppressWarnings("unchecked")
    private String resolvePhotoUrl(String photoName) {
        try {
            // Raw URI: photoName is a resource path ("places/…/photos/…") whose slashes
            // must not be template-encoded.
            Map<String, Object> media = restClient.get()
                    .uri(java.net.URI.create("https://places.googleapis.com/v1/" + photoName
                            + "/media?maxWidthPx=1200&skipHttpRedirect=true&key=" + apiKey))
                    .retrieve()
                    .body(MAP_TYPE);
            return media != null ? str(media.get("photoUri")) : null;
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private GeoSearchService.PlaceResult toPlaceResult(Map<String, Object> p) {
        double[] latLng = location(p);
        String name = displayName(p);
        if (latLng == null || name == null) return null;
        Map<String, String> addr = addressComponents(p);
        String formatted = str(p.get("formattedAddress"));
        String display = formatted != null && !formatted.startsWith(name) ? name + ", " + formatted : name;
        return new GeoSearchService.PlaceResult(name, display, latLng[0], latLng[1],
                googleType(p), addr.getOrDefault("city", ""), addr.getOrDefault("countryName", ""));
    }

    private double[] location(Map<String, Object> p) {
        if (p.get("location") instanceof Map<?, ?> loc
                && loc.get("latitude") instanceof Number lat && loc.get("longitude") instanceof Number lng) {
            return new double[]{lat.doubleValue(), lng.doubleValue()};
        }
        return null;
    }

    private String displayName(Map<String, Object> p) {
        return p.get("displayName") instanceof Map<?, ?> d && d.get("text") != null ? d.get("text").toString() : null;
    }

    /** country → ISO code, countryName → readable name, city → locality. */
    @SuppressWarnings("unchecked")
    private Map<String, String> addressComponents(Map<String, Object> p) {
        Map<String, String> out = new java.util.HashMap<>();
        if (!(p.get("addressComponents") instanceof List<?> comps)) return out;
        for (Object o : comps) {
            if (!(o instanceof Map<?, ?> c) || !(c.get("types") instanceof List<?> types)) continue;
            String text = c.get("longText") != null ? c.get("longText").toString() : null;
            if (types.contains("country")) {
                out.put("countryName", text);
                if (c.get("shortText") != null) out.put("country", c.get("shortText").toString().toUpperCase(Locale.ROOT));
            } else if (types.contains("locality") || types.contains("postal_town")) {
                out.put("city", text);
            }
        }
        return out;
    }

    private String googleType(Map<String, Object> p) {
        if (!(p.get("types") instanceof List<?> types)) return "place";
        List<String> t = types.stream().map(Object::toString).toList();
        if (t.contains("airport")) return "airport";
        if (t.contains("lodging")) return "hotel";
        if (t.contains("restaurant") || t.contains("cafe") || t.contains("bar") || t.contains("food")) return "food";
        if (t.contains("tourist_attraction") || t.contains("museum") || t.contains("place_of_worship")
                || t.contains("park") || t.contains("natural_feature")) return "tourism";
        if (t.contains("locality") || t.contains("administrative_area_level_1")) return "city";
        if (t.contains("train_station") || t.contains("transit_station")) return "station";
        return "place";
    }

    private String str(Object o) { return o != null ? o.toString() : null; }
}
