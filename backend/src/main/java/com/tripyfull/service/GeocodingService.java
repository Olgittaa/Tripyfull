package com.tripyfull.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Forward/reverse geocoding for the Places library. Photon by komoot is primary —
 * free, no API key, OSM data, built for search (https://photon.komoot.io, fair use).
 * Nominatim/OSM remains a last-resort fallback (no key, throttled, requires User-Agent).
 * All calls happen server-side — no keys ever reach the frontend.
 */
@Service
public class GeocodingService {

    private static final Logger log = LoggerFactory.getLogger(GeocodingService.class);
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_MAP_TYPE = new ParameterizedTypeReference<>() {};

    private final RestClient restClient = RestClient.builder()
            .defaultHeader("User-Agent", "Tripyfull/1.0 (travel planner app)")
            .defaultHeader("Accept-Language", "en")   // ask the geocoders for Latin/English names
            .build();

    private final GooglePlacesService googlePlaces;

    public GeocodingService(GooglePlacesService googlePlaces) {
        this.googlePlaces = googlePlaces;
    }

    public record GeocodeResult(BigDecimal latitude, BigDecimal longitude, String address,
                                String osmId, String country, String city, String name, String category) {}

    /** Best single match for free text, optionally constrained to an ISO country code. */
    public GeocodeResult geocode(String text, String country) {
        if (text == null || text.isBlank()) return null;
        // Google first when configured; OSM geocoders stay as the free fallback.
        if (googlePlaces.isEnabled()) {
            GeocodeResult g = googlePlaces.geocode(text, country);
            if (g != null) return g;
        }
        GeocodeResult r = photon(text, country);
        if (r != null) return r;
        return nominatim(text, country);
    }

    /** Reverse geocoding: coordinates -> address/country/city/osmId. */
    public GeocodeResult reverseGeocode(BigDecimal lat, BigDecimal lon) {
        if (lat == null || lon == null) return null;
        GeocodeResult r = photonReverse(lat, lon);
        if (r != null) return r;
        return nominatimReverse(lat, lon);
    }

    /* ---- Photon (primary) ---- */

    private GeocodeResult photon(String text, String country) {
        try {
            // Photon has no server-side country filter — fetch a few and filter here.
            List<Map<String, Object>> features = photonFeatures(
                    "https://photon.komoot.io/api?q={q}&limit=5&lang=en", text);
            if (features == null) return null;
            for (Map<String, Object> feature : features) {
                GeocodeResult r = fromPhotonFeature(feature);
                if (r == null) continue;
                if (country != null && !country.isBlank()
                        && r.country() != null && !country.equalsIgnoreCase(r.country())) continue;
                return r;
            }
            return null;
        } catch (Exception e) {
            log.warn("Photon geocode failed for '{}': {}", text, e.getMessage());
            return null;
        }
    }

    private GeocodeResult photonReverse(BigDecimal lat, BigDecimal lon) {
        try {
            List<Map<String, Object>> features = photonFeatures(
                    "https://photon.komoot.io/reverse?lon={lon}&lat={lat}&lang=en", lon, lat);
            if (features == null || features.isEmpty()) return null;
            return fromPhotonFeature(features.get(0));
        } catch (Exception e) {
            log.warn("Photon reverse failed for {},{}: {}", lat, lon, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> photonFeatures(String url, Object... vars) {
        Map<String, Object> body = restClient.get().uri(url, vars).retrieve().body(MAP_TYPE);
        if (body == null) return null;
        return (List<Map<String, Object>>) body.get("features");
    }

    @SuppressWarnings("unchecked")
    private GeocodeResult fromPhotonFeature(Map<String, Object> feature) {
        if (feature == null) return null;
        Map<String, Object> props = (Map<String, Object>) feature.get("properties");
        if (props == null) return null;

        BigDecimal lat = null, lon = null;
        if (feature.get("geometry") instanceof Map<?, ?> g
                && g.get("coordinates") instanceof List<?> coords && coords.size() >= 2) {
            lon = num(coords.get(0));   // GeoJSON order: [lon, lat]
            lat = num(coords.get(1));
        }
        if (lat == null || lon == null) return null;

        String name = str(props.get("name"));
        String city = firstNonBlank(str(props.get("city")), str(props.get("district")), str(props.get("locality")));
        // Photon has no preformatted address — compose one from its parts.
        String street = joinNonBlank(" ", str(props.get("street")), str(props.get("housenumber")));
        String address = joinNonBlank(", ", name, street, city, str(props.get("state")), str(props.get("country")));
        // Same OSM class:type taxonomy Nominatim used — keeps inferType() working.
        String osmKey = str(props.get("osm_key"));
        String osmValue = str(props.get("osm_value"));
        String category = (osmKey != null || osmValue != null)
                ? (osmKey != null ? osmKey : "") + ":" + (osmValue != null ? osmValue : "")
                : null;
        return new GeocodeResult(
                lat, lon, address,
                osmId(str(props.get("osm_type")), props.get("osm_id")),
                upper(str(props.get("countrycode"))),
                city, name, category
        );
    }

    /* ---- Nominatim (fallback) ---- */

    private GeocodeResult nominatim(String text, String country) {
        try {
            String url = "https://nominatim.openstreetmap.org/search?q={q}&format=json&addressdetails=1&limit=1";
            if (country != null && !country.isBlank()) {
                url += "&countrycodes=" + country.toLowerCase();
            }
            List<Map<String, Object>> body = restClient.get().uri(url, text).retrieve().body(LIST_MAP_TYPE);
            if (body == null || body.isEmpty()) return null;
            return fromNominatimItem(body.get(0));
        } catch (Exception e) {
            log.warn("Nominatim geocode failed for '{}': {}", text, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private GeocodeResult fromNominatimItem(Map<String, Object> item) {
        if (item == null) return null;
        Map<String, Object> addr = (Map<String, Object>) item.get("address");
        String city = null, countryCode = null;
        if (addr != null) {
            for (String k : List.of("city", "town", "village", "municipality", "hamlet")) {
                if (addr.get(k) != null) { city = addr.get(k).toString(); break; }
            }
            if (addr.get("country_code") != null) countryCode = addr.get("country_code").toString().toUpperCase();
        }
        String displayName = str(item.get("display_name"));
        String name = str(item.get("name"));
        if (name == null || name.isBlank()) {
            name = (displayName != null && displayName.contains(",")) ? displayName.substring(0, displayName.indexOf(",")).trim() : displayName;
        }
        String cls = str(item.get("class"));
        if (cls == null) cls = str(item.get("category"));
        String typ = str(item.get("type"));
        String category = (cls != null || typ != null) ? (cls != null ? cls : "") + ":" + (typ != null ? typ : "") : null;
        return new GeocodeResult(
                num(item.get("lat")), num(item.get("lon")),
                displayName, osmId(str(item.get("osm_type")), item.get("osm_id")),
                countryCode, city, name, category
        );
    }

    private GeocodeResult nominatimReverse(BigDecimal lat, BigDecimal lon) {
        try {
            String url = "https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&addressdetails=1";
            Map<String, Object> item = restClient.get().uri(url, lat, lon).retrieve().body(MAP_TYPE);
            return fromNominatimItem(item);
        } catch (Exception e) {
            log.warn("Nominatim reverse failed for {},{}: {}", lat, lon, e.getMessage());
            return null;
        }
    }

    /* ---- helpers ---- */

    /**
     * Combines OSM type + id into a compact key, e.g. node 123 -> "N123".
     * Accepts both Nominatim's long form ("node") and Photon's letter form ("N"),
     * so places deduped by (owner, osmId) survive the provider switch.
     */
    private String osmId(String osmType, Object osmId) {
        if (osmId == null) return null;
        String prefix = osmType == null ? "" : switch (osmType.toLowerCase()) {
            case "node", "n" -> "N";
            case "way", "w" -> "W";
            case "relation", "r" -> "R";
            default -> "";
        };
        return prefix + osmId;
    }

    private String firstNonBlank(String... vals) {
        for (String v : vals) if (v != null && !v.isBlank()) return v;
        return null;
    }

    private String joinNonBlank(String sep, String... parts) {
        List<String> out = new ArrayList<>();
        for (String p : parts) {
            if (p == null || p.isBlank()) continue;
            if (!out.isEmpty() && out.get(out.size() - 1).equalsIgnoreCase(p)) continue; // skip duplicates like name==city
            out.add(p);
        }
        return out.isEmpty() ? null : String.join(sep, out);
    }

    private BigDecimal num(Object o) {
        if (o == null) return null;
        try { return new BigDecimal(o.toString()); } catch (NumberFormatException e) { return null; }
    }

    private String str(Object o) { return o != null ? o.toString() : null; }
    private String upper(String s) { return s != null ? s.toUpperCase() : null; }
}
