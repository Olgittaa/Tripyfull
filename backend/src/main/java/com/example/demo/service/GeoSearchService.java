package com.example.demo.service;

import com.example.demo.model.City;
import com.example.demo.model.Country;
import com.example.demo.repository.CityRepository;
import com.example.demo.repository.CountryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GeoSearchService {

    private static final Logger log = LoggerFactory.getLogger(GeoSearchService.class);
    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_MAP_TYPE = new ParameterizedTypeReference<>() {};
    private static final int MIN_LOCAL_RESULTS = 3;

    private final CityRepository cityRepository;
    private final CountryRepository countryRepository;
    private final RestClient restClient;

    public GeoSearchService(CityRepository cityRepository, CountryRepository countryRepository) {
        this.cityRepository = cityRepository;
        this.countryRepository = countryRepository;
        this.restClient = RestClient.builder()
                .defaultHeader("User-Agent", "Tripyfull/1.0 (travel planner app)")
                .defaultHeader("Accept-Language", "en")   // return Latin/English place names
                .build();
    }

    public record CityResult(Long id, String name, String country, String countryCode, double lat, double lng) {}

    public List<CityResult> search(String query, String countryFilter) {
        if (query == null || query.length() < 2) return List.of();

        // 1. Search local DB
        List<City> local;
        if (countryFilter != null && !countryFilter.isBlank()) {
            local = cityRepository.searchByCountry(query, countryFilter.toUpperCase());
        } else {
            local = cityRepository.search(query);
        }

        List<CityResult> results = local.stream()
                .limit(15)
                .map(c -> new CityResult(c.getId(), c.getName(), c.getCountry().getName(),
                        c.getCountry().getCode(), c.getLatitude() != null ? c.getLatitude() : 0, c.getLongitude() != null ? c.getLongitude() : 0))
                .collect(Collectors.toCollection(ArrayList::new));

        // 2. If not enough results, search Nominatim
        if (results.size() < MIN_LOCAL_RESULTS) {
            try {
                List<CityResult> external = searchNominatim(query, countryFilter);
                // Deduplicate by name+country
                Set<String> existing = results.stream().map(r -> (r.name + r.countryCode).toLowerCase()).collect(Collectors.toSet());
                for (CityResult ext : external) {
                    String key = (ext.name + ext.countryCode).toLowerCase();
                    if (!existing.contains(key)) {
                        results.add(ext);
                        existing.add(key);
                        // Cache in local DB
                        cacheCity(ext);
                    }
                }
            } catch (Exception e) {
                log.warn("Nominatim search failed for '{}': {}", query, e.getMessage());
            }
        }

        return results.stream().limit(20).toList();
    }

    @SuppressWarnings("unchecked")
    private List<CityResult> searchNominatim(String query, String countryFilter) {
        String url = "https://nominatim.openstreetmap.org/search?q={q}&format=json&addressdetails=1&limit=10&featuretype=city";
        if (countryFilter != null && !countryFilter.isBlank()) {
            url += "&countrycodes=" + countryFilter.toLowerCase();
        }

        List<Map<String, Object>> body = restClient.get()
                .uri(url, query)
                .retrieve()
                .body(LIST_MAP_TYPE);

        if (body == null) return List.of();

        List<CityResult> results = new ArrayList<>();
        for (Map<String, Object> item : body) {
            String type = (String) item.get("type");
            String classType = (String) item.get("class");
            // Only accept places that are cities/towns/villages
            if (!"place".equals(classType) && !"boundary".equals(classType)) continue;

            Map<String, Object> address = (Map<String, Object>) item.get("address");
            if (address == null) continue;

            String name = extractCityName(item, address);
            if (name == null || name.isBlank()) continue;

            String countryCode = address.get("country_code") != null
                    ? address.get("country_code").toString().toUpperCase() : "";
            String countryName = address.get("country") != null
                    ? address.get("country").toString() : "";

            double lat = parseDouble(item.get("lat"));
            double lng = parseDouble(item.get("lon"));

            results.add(new CityResult(null, name, countryName, countryCode, lat, lng));
        }

        return results;
    }

    private String extractCityName(Map<String, Object> item, Map<String, Object> address) {
        // Try city, town, village, municipality from address
        for (String key : List.of("city", "town", "village", "municipality", "hamlet")) {
            if (address.containsKey(key)) return address.get(key).toString();
        }
        // Fallback to display name first part
        String display = (String) item.get("display_name");
        if (display != null && display.contains(",")) {
            return display.substring(0, display.indexOf(",")).trim();
        }
        return display;
    }

    private void cacheCity(CityResult result) {
        try {
            if (result.countryCode == null || result.countryCode.isBlank()) return;
            Country country = countryRepository.findById(result.countryCode).orElse(null);
            if (country == null) {
                // Create country stub
                country = new Country();
                country.setCode(result.countryCode);
                country.setName(result.country);
                countryRepository.save(country);
            }
            City city = new City();
            city.setName(result.name);
            city.setCountry(country);
            city.setLatitude(result.lat);
            city.setLongitude(result.lng);
            city.setPopular(false);
            cityRepository.save(city);
        } catch (Exception e) {
            // Duplicate or other issue — ignore
            log.debug("Failed to cache city {}: {}", result.name, e.getMessage());
        }
    }

    private double parseDouble(Object val) {
        if (val == null) return 0;
        try { return Double.parseDouble(val.toString()); } catch (Exception e) { return 0; }
    }

    public record PlaceResult(String name, String displayName, double lat, double lon, String placeType, String city, String country) {}

    /** Best single geocoding match for a free-text query (e.g. "Hotel X, Kyoto"), or null. */
    public PlaceResult geocodeOne(String query) {
        List<PlaceResult> results = searchPlaces(query);
        return results.isEmpty() ? null : results.get(0);
    }

    public List<PlaceResult> searchPlaces(String query) {
        if (query == null || query.length() < 2) return List.of();
        try {
            List<Map<String, Object>> body = restClient.get()
                    .uri("https://nominatim.openstreetmap.org/search?q={q}&format=json&addressdetails=1&limit=8", query)
                    .retrieve()
                    .body(LIST_MAP_TYPE);
            if (body == null) return List.of();
            return body.stream()
                    .map(item -> {
                        String displayName = (String) item.get("display_name");
                        Object nameObj = item.get("name");
                        String name = nameObj != null && !nameObj.toString().isBlank()
                                ? nameObj.toString()
                                : (displayName != null && displayName.contains(",")
                                        ? displayName.substring(0, displayName.indexOf(",")).trim()
                                        : displayName);
                        double lat = parseDouble(item.get("lat"));
                        double lon = parseDouble(item.get("lon"));
                        String cls = (String) item.get("class");
                        String type = (String) item.get("type");
                        String placeType = determinePlaceType(cls, type);
                        @SuppressWarnings("unchecked")
                        Map<String, Object> addr = (Map<String, Object>) item.get("address");
                        String city = extractAddrField(addr, "city", "town", "village", "municipality");
                        String country = addr != null && addr.get("country") != null ? addr.get("country").toString() : "";
                        return new PlaceResult(name != null ? name : "", displayName != null ? displayName : "", lat, lon, placeType, city, country);
                    })
                    .filter(p -> p.lat() != 0 || p.lon() != 0)
                    .limit(8)
                    .toList();
        } catch (Exception e) {
            log.warn("Nominatim places search failed for '{}': {}", query, e.getMessage());
            return List.of();
        }
    }

    private String determinePlaceType(String cls, String type) {
        if ("aeroway".equals(cls)) return "airport";
        if ("tourism".equals(cls) && List.of("hotel","hostel","guest_house","motel","resort","apartment").contains(type)) return "hotel";
        if ("tourism".equals(cls)) return "tourism";
        if ("place".equals(cls)) return "city";
        if ("amenity".equals(cls) && List.of("restaurant","bar","cafe","fast_food").contains(type)) return "food";
        if ("amenity".equals(cls)) return "amenity";
        if ("railway".equals(cls) && "station".equals(type)) return "station";
        return "place";
    }

    private String extractAddrField(Map<String, Object> addr, String... keys) {
        if (addr == null) return "";
        for (String k : keys) {
            if (addr.containsKey(k)) return addr.get(k).toString();
        }
        return "";
    }
}
