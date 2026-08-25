package com.tripyfull.service;

import com.tripyfull.model.City;
import com.tripyfull.model.Country;
import com.tripyfull.repository.CityRepository;
import com.tripyfull.repository.CountryRepository;
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
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE = new ParameterizedTypeReference<>() {};
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

        // 2. If not enough results, search Photon (OSM)
        if (results.size() < MIN_LOCAL_RESULTS) {
            try {
                List<CityResult> external = searchPhotonCities(query, countryFilter);
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
                log.warn("Photon city search failed for '{}': {}", query, e.getMessage());
            }
        }

        return results.stream().limit(20).toList();
    }

    private static final Set<String> CITY_VALUES = Set.of("city", "town", "village", "municipality", "hamlet");

    @SuppressWarnings("unchecked")
    private List<CityResult> searchPhotonCities(String query, String countryFilter) {
        // osm_tag=place narrows Photon to settlements; exact kinds are filtered below.
        Map<String, Object> body = restClient.get()
                .uri("https://photon.komoot.io/api?q={q}&limit=10&lang=en&osm_tag=place", query)
                .retrieve()
                .body(MAP_TYPE);
        List<Map<String, Object>> features = body != null ? (List<Map<String, Object>>) body.get("features") : null;
        if (features == null) return List.of();

        List<CityResult> results = new ArrayList<>();
        for (Map<String, Object> feature : features) {
            Map<String, Object> props = (Map<String, Object>) feature.get("properties");
            if (props == null) continue;
            Object osmValue = props.get("osm_value");
            if (osmValue == null || !CITY_VALUES.contains(osmValue.toString())) continue;

            String name = props.get("name") != null ? props.get("name").toString() : null;
            if (name == null || name.isBlank()) continue;

            String countryCode = props.get("countrycode") != null
                    ? props.get("countrycode").toString().toUpperCase() : "";
            if (countryFilter != null && !countryFilter.isBlank()
                    && !countryFilter.equalsIgnoreCase(countryCode)) continue;
            String countryName = props.get("country") != null ? props.get("country").toString() : "";

            double lat = 0, lng = 0;
            if (feature.get("geometry") instanceof Map<?, ?> g
                    && g.get("coordinates") instanceof List<?> coords && coords.size() >= 2) {
                lng = parseDouble(coords.get(0));   // GeoJSON order: [lon, lat]
                lat = parseDouble(coords.get(1));
            }

            results.add(new CityResult(null, name, countryName, countryCode, lat, lng));
        }

        return results;
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

    @SuppressWarnings("unchecked")
    public List<PlaceResult> searchPlaces(String query) {
        if (query == null || query.length() < 2) return List.of();
        try {
            Map<String, Object> body = restClient.get()
                    .uri("https://photon.komoot.io/api?q={q}&limit=8&lang=en", query)
                    .retrieve()
                    .body(MAP_TYPE);
            List<Map<String, Object>> features = body != null ? (List<Map<String, Object>>) body.get("features") : null;
            if (features == null) return List.of();
            return features.stream()
                    .map(this::toPlaceResult)
                    .filter(Objects::nonNull)
                    .filter(p -> p.lat() != 0 || p.lon() != 0)
                    .limit(8)
                    .toList();
        } catch (Exception e) {
            log.warn("Photon places search failed for '{}': {}", query, e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private PlaceResult toPlaceResult(Map<String, Object> feature) {
        Map<String, Object> props = (Map<String, Object>) feature.get("properties");
        if (props == null) return null;

        double lat = 0, lon = 0;
        if (feature.get("geometry") instanceof Map<?, ?> g
                && g.get("coordinates") instanceof List<?> coords && coords.size() >= 2) {
            lon = parseDouble(coords.get(0));   // GeoJSON order: [lon, lat]
            lat = parseDouble(coords.get(1));
        }

        String city = extractProp(props, "city", "district", "locality");
        String state = extractProp(props, "state");
        String country = extractProp(props, "country");
        String street = extractProp(props, "street");
        String name = extractProp(props, "name");
        if (name == null || name.isBlank()) name = street != null ? street : city;
        if (name == null || name.isBlank()) return null;

        // Photon has no preformatted display name — compose "name, street, city, state, country".
        List<String> parts = new ArrayList<>();
        for (String p : new String[]{name, street, city, state, country}) {
            if (p != null && !p.isBlank() && (parts.isEmpty() || !parts.get(parts.size() - 1).equalsIgnoreCase(p))) {
                parts.add(p);
            }
        }
        String displayName = String.join(", ", parts);

        // osm_key/osm_value use the same OSM class:type taxonomy Nominatim exposed.
        String placeType = determinePlaceType(extractProp(props, "osm_key"), extractProp(props, "osm_value"));
        return new PlaceResult(name, displayName, lat, lon, placeType, city != null ? city : "", country != null ? country : "");
    }

    private String extractProp(Map<String, Object> props, String... keys) {
        for (String k : keys) {
            Object v = props.get(k);
            if (v != null && !v.toString().isBlank()) return v.toString();
        }
        return null;
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

}
