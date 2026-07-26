package com.example.demo.controller;

import com.example.demo.model.Country;
import com.example.demo.repository.CountryRepository;
import com.example.demo.service.GeoSearchService;
import com.example.demo.service.RoutingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/geo")
public class GeoController {

    private final CountryRepository countryRepository;
    private final GeoSearchService geoSearchService;
    private final RoutingService routingService;

    public GeoController(CountryRepository countryRepository, GeoSearchService geoSearchService,
                         RoutingService routingService) {
        this.countryRepository = countryRepository;
        this.geoSearchService = geoSearchService;
        this.routingService = routingService;
    }

    @GetMapping("/countries")
    public List<Map<String, String>> searchCountries(@RequestParam(defaultValue = "") String q) {
        List<Country> results = q.isBlank()
                ? countryRepository.findAll()
                : countryRepository.search(q);
        return results.stream()
                .limit(q.isBlank() ? 300 : 30)
                .map(c -> Map.of("code", c.getCode(), "name", c.getName(), "region", c.getRegion() != null ? c.getRegion() : ""))
                .toList();
    }

    @GetMapping("/cities")
    public List<Map<String, Object>> searchCities(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(required = false) String country) {
        return geoSearchService.search(q, country).stream()
                .map(c -> Map.of(
                        "id", (Object) (c.id() != null ? c.id() : 0L),
                        "name", c.name(),
                        "country", c.country(),
                        "countryCode", c.countryCode(),
                        "lat", c.lat(),
                        "lng", c.lng()
                ))
                .toList();
    }

    /**
     * Road route through ordered waypoints. {@code points} is "lat,lon;lat,lon;…",
     * {@code mode} is foot | car | bike. Returns total + per-leg durations/distances
     * and the route geometry as [lat, lon] pairs.
     */
    @GetMapping("/route")
    public ResponseEntity<Map<String, Object>> route(
            @RequestParam String points,
            @RequestParam(defaultValue = "foot") String mode) {
        if (!routingService.supportsMode(mode)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unknown mode: " + mode));
        }
        List<double[]> parsed = parsePoints(points);
        if (parsed == null || parsed.size() < 2 || parsed.size() > 25) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "points must be 2–25 'lat,lon' pairs separated by ';'"));
        }
        RoutingService.RouteResult r = routingService.route(parsed, mode);
        if (r == null) {
            return ResponseEntity.status(502).body(Map.of("error", "Routing service unavailable"));
        }
        if (r == RoutingService.NO_ROUTE) {
            return ResponseEntity.status(404).body(Map.of("error", "No route found between these points"));
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("mode", r.mode());
        out.put("durationSec", r.durationSec());
        out.put("distanceM", r.distanceM());
        out.put("legs", r.legs().stream()
                .map(l -> Map.of("durationSec", l.durationSec(), "distanceM", l.distanceM()))
                .toList());
        out.put("geometry", r.geometry());
        return ResponseEntity.ok(out);
    }

    private static List<double[]> parsePoints(String points) {
        try {
            List<double[]> out = new ArrayList<>();
            for (String pair : points.split(";")) {
                String[] parts = pair.split(",");
                if (parts.length != 2) return null;
                double lat = Double.parseDouble(parts[0].trim());
                double lon = Double.parseDouble(parts[1].trim());
                // isFinite also rejects NaN, which passes every </> comparison
                if (!Double.isFinite(lat) || !Double.isFinite(lon)) return null;
                if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
                out.add(new double[] { lat, lon });
            }
            return out;
        } catch (Exception e) {
            return null;
        }
    }

    @GetMapping("/places")
    public List<Map<String, Object>> searchPlaces(@RequestParam(defaultValue = "") String q) {
        if (q.length() < 2) return List.of();
        return geoSearchService.searchPlaces(q).stream()
                .map(p -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("name", p.name());
                    m.put("displayName", p.displayName());
                    m.put("lat", p.lat());
                    m.put("lon", p.lon());
                    m.put("placeType", p.placeType());
                    m.put("city", p.city());
                    m.put("country", p.country());
                    return m;
                })
                .toList();
    }
}
