package com.tripyfull.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Google Routes API v2 provider. Returns the same {@link RoutingService.RouteResult}
 * shape as OSRM so the caching and the frontend stay unchanged.
 */
@Service
public class GoogleRoutesService {

    private static final Logger log = LoggerFactory.getLogger(GoogleRoutesService.class);
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};

    private static final Map<String, String> TRAVEL_MODES = Map.of(
            "foot", "WALK",
            "car", "DRIVE");

    /** Our bus / train legs → the transit vehicles Google may use for them. */
    public static final Map<String, List<String>> TRANSIT_MODES = Map.of(
            "bus", List.of("BUS"),
            "train", List.of("TRAIN", "SUBWAY", "LIGHT_RAIL", "RAIL"));

    private final String apiKey;
    private final RestClient restClient;

    public GoogleRoutesService(@Value("${google.maps.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(12));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** points are [lat, lon]; returns null on failure so the caller can fall back to OSRM. */
    @SuppressWarnings("unchecked")
    public RoutingService.RouteResult route(List<double[]> points, String mode) {
        String travelMode = TRAVEL_MODES.get(mode);
        if (travelMode == null || points == null || points.size() < 2) return null;
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("origin", latLng(points.get(0)));
            request.put("destination", latLng(points.get(points.size() - 1)));
            if (points.size() > 2) {
                List<Map<String, Object>> intermediates = new ArrayList<>();
                for (int i = 1; i < points.size() - 1; i++) intermediates.add(latLng(points.get(i)));
                request.put("intermediates", intermediates);
            }
            request.put("travelMode", travelMode);

            Map<String, Object> body = restClient.post()
                    .uri("https://routes.googleapis.com/directions/v2:computeRoutes")
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask",
                            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,"
                                    + "routes.legs.duration,routes.legs.distanceMeters")
                    .header("Content-Type", "application/json")
                    .body(request)
                    .retrieve()
                    .body(MAP_TYPE);
            List<Map<String, Object>> routes = body != null ? (List<Map<String, Object>>) body.get("routes") : null;
            if (routes == null || routes.isEmpty()) return RoutingService.NO_ROUTE;
            Map<String, Object> route = routes.get(0);

            List<RoutingService.RouteLeg> legs = new ArrayList<>();
            if (route.get("legs") instanceof List<?> rawLegs) {
                for (Object o : rawLegs) {
                    if (o instanceof Map<?, ?> leg) {
                        legs.add(new RoutingService.RouteLeg(
                                seconds(leg.get("duration")), toDouble(leg.get("distanceMeters"))));
                    }
                }
            }
            List<List<Double>> geometry = List.of();
            if (route.get("polyline") instanceof Map<?, ?> poly && poly.get("encodedPolyline") != null) {
                geometry = decodePolyline(poly.get("encodedPolyline").toString());
            }
            return new RoutingService.RouteResult(mode,
                    seconds(route.get("duration")), toDouble(route.get("distanceMeters")), legs, geometry);
        } catch (Exception e) {
            log.warn("Google route failed ({} points, {}): {}", points.size(), mode, e.getMessage());
            return null;
        }
    }

    /**
     * A bus or train leg by timetable: the first service leaving at or after
     * {@code departAt}. Returns NO_ROUTE when Google lists no such service
     * between the two points (or would only have you walk), null on failure.
     */
    @SuppressWarnings("unchecked")
    public RoutingService.RouteResult transit(List<double[]> points, String mode, Instant departAt) {
        List<String> vehicles = TRANSIT_MODES.get(mode);
        if (vehicles == null || points == null || points.size() < 2) return null;
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("origin", latLng(points.get(0)));
            request.put("destination", latLng(points.get(points.size() - 1)));
            request.put("travelMode", "TRANSIT");
            request.put("departureTime", DateTimeFormatter.ISO_INSTANT.format(departAt));
            request.put("computeAlternativeRoutes", false);
            request.put("transitPreferences", Map.of("allowedTravelModes", vehicles));

            Map<String, Object> body = restClient.post()
                    .uri("https://routes.googleapis.com/directions/v2:computeRoutes")
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask",
                            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,"
                                    + "routes.legs.steps.travelMode,"
                                    + "routes.legs.steps.transitDetails.transitLine.nameShort,"
                                    + "routes.legs.steps.transitDetails.transitLine.name")
                    .header("Content-Type", "application/json")
                    .body(request)
                    .retrieve()
                    .body(MAP_TYPE);
            List<Map<String, Object>> routes = body != null ? (List<Map<String, Object>>) body.get("routes") : null;
            if (routes == null || routes.isEmpty()) return RoutingService.NO_ROUTE;
            Map<String, Object> route = routes.get(0);

            // The lines ridden, in order, once each: "Limobus → BTS Sukhumvit".
            List<String> lines = new ArrayList<>();
            if (route.get("legs") instanceof List<?> rawLegs) {
                for (Object lo : rawLegs) {
                    if (!(lo instanceof Map<?, ?> leg) || !(leg.get("steps") instanceof List<?> steps)) continue;
                    for (Object so : steps) {
                        if (!(so instanceof Map<?, ?> step) || !(step.get("transitDetails") instanceof Map<?, ?> td)
                                || !(td.get("transitLine") instanceof Map<?, ?> line)) continue;
                        Object name = line.get("nameShort") != null ? line.get("nameShort") : line.get("name");
                        if (name != null && !lines.contains(name.toString())) lines.add(name.toString());
                    }
                }
            }
            if (lines.isEmpty()) return RoutingService.NO_ROUTE; // a walk is not a bus

            List<List<Double>> geometry = List.of();
            if (route.get("polyline") instanceof Map<?, ?> poly && poly.get("encodedPolyline") != null) {
                geometry = decodePolyline(poly.get("encodedPolyline").toString());
            }
            String note = String.join(" → ", lines);
            if (note.length() > 150) note = note.substring(0, 147) + "…";
            return new RoutingService.RouteResult(mode,
                    seconds(route.get("duration")), toDouble(route.get("distanceMeters")), List.of(), geometry,
                    false, note);
        } catch (Exception e) {
            log.warn("Google transit failed ({}): {}", mode, e.getMessage());
            return null;
        }
    }

    private Map<String, Object> latLng(double[] p) {
        return Map.of("location", Map.of("latLng", Map.of("latitude", p[0], "longitude", p[1])));
    }

    /** Routes durations come as "1234s" strings. */
    private double seconds(Object duration) {
        if (duration == null) return 0;
        String s = duration.toString();
        try { return Double.parseDouble(s.endsWith("s") ? s.substring(0, s.length() - 1) : s); }
        catch (NumberFormatException e) { return 0; }
    }

    private double toDouble(Object o) {
        return o instanceof Number n ? n.doubleValue() : 0;
    }

    /** Standard Google encoded-polyline decoding into [lat, lon] pairs (Leaflet order). */
    static List<List<Double>> decodePolyline(String encoded) {
        List<List<Double>> points = new ArrayList<>();
        int index = 0, lat = 0, lng = 0;
        while (index < encoded.length()) {
            int b, shift = 0, result = 0;
            do { b = encoded.charAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
            lat += (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
            shift = 0; result = 0;
            do { b = encoded.charAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
            lng += (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
            points.add(List.of(lat / 1e5, lng / 1e5));
        }
        return points;
    }
}
