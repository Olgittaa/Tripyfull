package com.example.demo.controller;

import com.example.demo.model.Country;
import com.example.demo.repository.CountryRepository;
import com.example.demo.service.GeoSearchService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/geo")
public class GeoController {

    private final CountryRepository countryRepository;
    private final GeoSearchService geoSearchService;

    public GeoController(CountryRepository countryRepository, GeoSearchService geoSearchService) {
        this.countryRepository = countryRepository;
        this.geoSearchService = geoSearchService;
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
