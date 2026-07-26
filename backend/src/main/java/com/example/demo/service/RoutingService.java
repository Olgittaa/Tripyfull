package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Road routing between ordered waypoints via the public FOSSGIS OSRM instance
 * (routing.openstreetmap.de — the router behind openstreetmap.org). Free, no
 * API key; its fair-use policy asks for light traffic, so successful results
 * are cached in memory and the portal only requests one route per day view.
 */
@Service
public class RoutingService {

    private static final Logger log = LoggerFactory.getLogger(RoutingService.class);

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};

    /** travel mode -> OSRM profile path segment on routing.openstreetmap.de */
    private static final Map<String, String> PROFILES = Map.of(
            "foot", "routed-foot",
            "car", "routed-car",
            "bike", "routed-bike");

    private final RestClient restClient = buildClient();

    private static RestClient buildClient() {
        // Explicit timeouts — a hung upstream must not park a servlet thread forever.
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(12));
        return RestClient.builder()
                .requestFactory(factory)
                .defaultHeader("User-Agent", "Tripyfull/1.0 (travel planner app)")
                // routing.openstreetmap.de mislabels gzip bodies as "deflate", which breaks
                // the client's automatic decompression — ask for plain responses instead.
                .defaultHeader("Accept-Encoding", "identity")
                .build();
    }

    private final Map<String, CachedRoute> cache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 6 * 3600_000L;
    private static final int CACHE_MAX_ENTRIES = 500;
    /** Day-route feature, not intercontinental planning — keeps responses/cache small. */
    private static final double MAX_DISTANCE_M = 1_500_000;
    /** Geometry above this is downsampled (memory + payload bound; plenty for display). */
    private static final int MAX_GEOMETRY_POINTS = 2_000;

    public record RouteLeg(double durationSec, double distanceM) {}

    /** {@code geometry} is [lat, lon] pairs (already flipped from GeoJSON), ready for Leaflet. */
    public record RouteResult(String mode, double durationSec, double distanceM,
                              List<RouteLeg> legs, List<List<Double>> geometry) {}

    /** Waypoints are valid but unroutable (or beyond {@link #MAX_DISTANCE_M}). Cached like a hit. */
    public static final RouteResult NO_ROUTE = new RouteResult("none", 0, 0, List.of(), List.of());

    public boolean supportsMode(String mode) {
        return mode != null && PROFILES.containsKey(mode);
    }

    /** points are [lat, lon]; returns null when the route can't be computed. */
    public RouteResult route(List<double[]> points, String mode) {
        String profile = PROFILES.get(mode);
        if (profile == null || points == null || points.size() < 2) return null;

        // OSRM wants lon,lat; 6 decimals (~0.1 m) keeps cache keys stable
        String coords = points.stream()
                .map(p -> fmt(p[1]) + "," + fmt(p[0]))
                .collect(Collectors.joining(";"));

        String key = mode + "|" + coords;
        CachedRoute cached = cache.get(key);
        if (cached != null && System.currentTimeMillis() - cached.timestamp < CACHE_TTL_MS) {
            return cached.route;
        }

        RouteResult result = fetchFromOsrm(profile, coords, mode, points.size());
        if (result != null) {
            if (cache.size() >= CACHE_MAX_ENTRIES) cache.clear(); // crude, but keeps memory bounded
            cache.put(key, new CachedRoute(result, System.currentTimeMillis()));
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private RouteResult fetchFromOsrm(String profile, String coords, String mode, int pointCount) {
        // Built as a raw URI: the ';' waypoint separator must not be template-encoded.
        // The "driving" path segment is required by the API shape but ignored by the
        // single-profile instances — the profile is chosen by the routed-* host path.
        String url = "https://routing.openstreetmap.de/" + profile + "/route/v1/driving/" + coords
                + "?overview=full&geometries=geojson&steps=false";
        try {
            Map<String, Object> body = restClient.get()
                    .uri(URI.create(url))
                    .retrieve()
                    .body(MAP_TYPE);
            if (body == null || !"Ok".equals(body.get("code"))) return null;

            List<Map<String, Object>> routes = (List<Map<String, Object>>) body.get("routes");
            if (routes == null || routes.isEmpty()) return null;
            Map<String, Object> route = routes.get(0);

            double distance = parseDouble(route.get("distance"));
            if (distance > MAX_DISTANCE_M) {
                log.debug("OSRM route too long ({} km), treating as unroutable", Math.round(distance / 1000));
                return NO_ROUTE;
            }

            List<RouteLeg> legs = new ArrayList<>();
            if (route.get("legs") instanceof List<?> rawLegs) {
                for (Object o : rawLegs) {
                    if (o instanceof Map<?, ?> leg) {
                        legs.add(new RouteLeg(parseDouble(leg.get("duration")), parseDouble(leg.get("distance"))));
                    }
                }
            }

            List<List<Double>> geometry = new ArrayList<>();
            if (route.get("geometry") instanceof Map<?, ?> g && g.get("coordinates") instanceof List<?> pts) {
                // keep at most MAX_GEOMETRY_POINTS, evenly sampled, endpoints always included
                int total = pts.size();
                int step = Math.max(1, (int) Math.ceil(total / (double) MAX_GEOMETRY_POINTS));
                for (int i = 0; i < total; i += step) {
                    if (pts.get(i) instanceof List<?> pt && pt.size() >= 2) {
                        // GeoJSON is [lon, lat] — flip to [lat, lon] for Leaflet
                        geometry.add(List.of(parseDouble(pt.get(1)), parseDouble(pt.get(0))));
                    }
                }
                if (step > 1 && total > 0 && pts.get(total - 1) instanceof List<?> last && last.size() >= 2) {
                    geometry.add(List.of(parseDouble(last.get(1)), parseDouble(last.get(0))));
                }
            }

            return new RouteResult(mode, parseDouble(route.get("duration")), distance, legs, geometry);
        } catch (RestClientResponseException e) {
            // OSRM answers 400 with {"code":"NoRoute"} when the points can't be connected —
            // a property of the input, not an outage; cacheable like a normal result.
            String responseBody = e.getResponseBodyAsString();
            if (e.getStatusCode().is4xxClientError()
                    && (responseBody.contains("\"NoRoute\"") || responseBody.contains("\"InvalidQuery\""))) {
                return NO_ROUTE;
            }
            log.warn("OSRM route failed ({} points, mode {}): HTTP {} {}", pointCount, mode,
                    e.getStatusCode().value(), responseBody);
            return null;
        } catch (Exception e) {
            log.warn("OSRM route failed ({} points, mode {}): {}", pointCount, mode, e.getMessage());
            return null;
        }
    }

    private static String fmt(double v) {
        return String.format(Locale.ROOT, "%.6f", v);
    }

    private static double parseDouble(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        try {
            return o != null ? Double.parseDouble(o.toString()) : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private record CachedRoute(RouteResult route, long timestamp) {}
}
