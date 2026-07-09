package com.example.demo.config;

import com.example.demo.model.City;
import com.example.demo.model.Country;
import com.example.demo.repository.CityRepository;
import com.example.demo.repository.CountryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Seeds countries and cities from CSV files on first run.
 */
@Component
public class GeoDataSeeder implements CommandLineRunner {

    private final CountryRepository countryRepository;
    private final CityRepository cityRepository;

    public GeoDataSeeder(CountryRepository countryRepository, CityRepository cityRepository) {
        this.countryRepository = countryRepository;
        this.cityRepository = cityRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (countryRepository.count() > 0) return; // already seeded

        seedCountries();
        seedCities();
    }

    private void seedCountries() throws IOException {
        try (var reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("geo/countries.csv").getInputStream(), StandardCharsets.UTF_8))) {
            reader.readLine(); // skip header
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",", 3);
                if (parts.length < 2) continue;
                Country c = new Country();
                c.setCode(parts[0].trim().toUpperCase());
                c.setName(parts[1].trim());
                if (parts.length > 2) c.setRegion(parts[2].trim());
                countryRepository.save(c);
            }
        }
    }

    private void seedCities() throws IOException {
        Map<String, Country> countries = new HashMap<>();
        countryRepository.findAll().forEach(c -> countries.put(c.getCode(), c));

        try (var reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("geo/cities.csv").getInputStream(), StandardCharsets.UTF_8))) {
            reader.readLine(); // skip header
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",", 5);
                if (parts.length < 2) continue;
                String name = parts[0].trim();
                String countryCode = parts[1].trim().toUpperCase();
                Country country = countries.get(countryCode);
                if (country == null) continue;

                City city = new City();
                city.setName(name);
                city.setCountry(country);
                if (parts.length > 2 && !parts[2].isBlank()) city.setLatitude(Double.parseDouble(parts[2].trim()));
                if (parts.length > 3 && !parts[3].isBlank()) city.setLongitude(Double.parseDouble(parts[3].trim()));
                city.setPopular(parts.length > 4 && "1".equals(parts[4].trim()));
                cityRepository.save(city);
            }
        }
    }
}
