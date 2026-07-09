package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Forward geocoding for the Places library. Geoapify is primary (needs a free key in
 * GEOAPIFY_API_KEY); falls back to Nominatim/OSM (no key, throttled, requires User-Agent).
 * All calls happen server-side — no keys ever reach the frontend.
 */
@Service
public class GeocodingService {

    private static final Logger log = LoggerFactory.getLogger(GeocodingService.class);
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};
    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_MAP_TYPE = new ParameterizedTypeReference<>() {};

    private final RestClient restClient = RestClient.builder()
            .defaultHeader("User-Agent", "Tripyfull/1.0 (travel planner app)")
            .defaultHeader("Accept-Language", "en")   // ask Nominatim for Latin/English names
            .build();

    @Value("${geoapify.api-key:}")
    private String geoapifyKey;

    public record GeocodeResult(BigDecimal latitude, BigDecimal longitude, String address,
                                String osmId, String country, String city, String name, String category) {}

    /** Best single match for free text, optionally constrained to an ISO country code. */
    public GeocodeResult geocode(String text, String country) {
        if (text == null || text.isBlank()) return null;
        if (geoapifyKey != null && !geoapifyKey.isBlank()) {
            GeocodeResult r = geoapify(text, country);
            if (r != null) return r;
        }
        return nominatim(text, country);
    }

    @SuppressWarnings("unchecked")
    private GeocodeResult geoapify(String text, String country) {
        try {
            String url = "https://api.geoapify.com/v1/geocode/search?text={text}&limit=1&lang=en&format=geojson&apiKey={key}";
            if (country != null && !country.isBlank()) {
                url += "&filter=countrycode:" + country.toLowerCase();
            }
            Map<String, Object> body = restClient.get().uri(url, text, geoapifyKey).retrieve().body(MAP_TYPE);
            if (body == null) return null;
            List<Map<String, Object>> features = (List<Map<String, Object>>) body.get("features");
            if (features == null || features.isEmpty()) return null;
            Map<String, Object> props = (Map<String, Object>) features.get(0).get("properties");
            return fromGeoapifyProps(props);
        } catch (Exception e) {
            log.warn("Geoapify geocode failed for '{}': {}", text, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private GeocodeResult fromGeoapifyProps(Map<String, Object> props) {
        if (props == null) return null;
        String osmId = null;
        Object ds = props.get("datasource");
        if (ds instanceof Map<?, ?> dsMap && dsMap.get("raw") instanceof Map<?, ?> raw) {
            osmId = osmId(str(raw.get("osm_type")), raw.get("osm_id"));
        }
        String category = null;
        Object cats = props.get("categories");
        if (cats instanceof List<?> list && !list.isEmpty()) category = str(list.get(0));
        if (category == null) category = str(props.get("result_type"));
        return new GeocodeResult(
                num(props.get("lat")), num(props.get("lon")),
                str(props.get("formatted")),
                osmId,
                upper(str(props.get("country_code"))),
                str(props.get("city")),
                str(props.get("name")),
                category
        );
    }

    @SuppressWarnings("unchecked")
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

    /** Reverse geocoding: coordinates -> address/country/city/osmId. */
    public GeocodeResult reverseGeocode(BigDecimal lat, BigDecimal lon) {
        if (lat == null || lon == null) return null;
        if (geoapifyKey != null && !geoapifyKey.isBlank()) {
            GeocodeResult r = geoapifyReverse(lat, lon);
            if (r != null) return r;
        }
        return nominatimReverse(lat, lon);
    }

    @SuppressWarnings("unchecked")
    private GeocodeResult geoapifyReverse(BigDecimal lat, BigDecimal lon) {
        try {
            String url = "https://api.geoapify.com/v1/geocode/reverse?lat={lat}&lon={lon}&lang=en&format=geojson&apiKey={key}";
            Map<String, Object> body = restClient.get().uri(url, lat, lon, geoapifyKey).retrieve().body(MAP_TYPE);
            if (body == null) return null;
            List<Map<String, Object>> features = (List<Map<String, Object>>) body.get("features");
            if (features == null || features.isEmpty()) return null;
            return fromGeoapifyProps((Map<String, Object>) features.get(0).get("properties"));
        } catch (Exception e) {
            log.warn("Geoapify reverse failed for {},{}: {}", lat, lon, e.getMessage());
            return null;
        }
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

    /** Combines OSM type + id into a compact key, e.g. node 123 -> "N123". */
    private String osmId(String osmType, Object osmId) {
        if (osmId == null) return null;
        String prefix = osmType == null ? "" : switch (osmType.toLowerCase()) {
            case "node" -> "N";
            case "way" -> "W";
            case "relation" -> "R";
            default -> "";
        };
        return prefix + osmId;
    }

    private BigDecimal num(Object o) {
        if (o == null) return null;
        try { return new BigDecimal(o.toString()); } catch (NumberFormatException e) { return null; }
    }

    private String str(Object o) { return o != null ? o.toString() : null; }
    private String upper(String s) { return s != null ? s.toUpperCase() : null; }
}
