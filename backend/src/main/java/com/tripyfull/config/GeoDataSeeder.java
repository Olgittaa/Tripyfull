package com.tripyfull.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.zip.GZIPInputStream;

/**
 * Seeds reference geo data from GeoNames extracts bundled as resources:
 * geo/countries.tsv (full ISO 3166 list) and geo/cities.tsv.gz (every settlement
 * with population ≥ 500, ~235k rows). Databases seeded from older, smaller
 * datasets are detected by row count and reseeded in place.
 */
@Component
public class GeoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(GeoDataSeeder.class);

    private static final int MIN_COUNTRIES = 200;
    private static final int MIN_CITIES = 200_000;
    private static final long POPULAR_MIN_POPULATION = 1_000_000;
    private static final int BATCH_SIZE = 1_000;

    private final JdbcTemplate jdbc;

    public GeoDataSeeder(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        Integer countries = jdbc.queryForObject("SELECT count(*) FROM countries", Integer.class);
        Integer cities = jdbc.queryForObject("SELECT count(*) FROM cities", Integer.class);
        if (countries != null && countries >= MIN_COUNTRIES && cities != null && cities >= MIN_CITIES) return;

        log.info("Seeding geo data (found {} countries / {} cities, expected full GeoNames set)…", countries, cities);
        jdbc.update("DELETE FROM cities");
        jdbc.update("DELETE FROM countries");

        Set<String> knownCountries = seedCountries();
        int seeded = seedCities(knownCountries);
        log.info("Geo data seeded: {} countries, {} cities", knownCountries.size(), seeded);
    }

    private Set<String> seedCountries() throws IOException {
        Set<String> codes = new HashSet<>();
        List<Object[]> batch = new ArrayList<>();
        try (var reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("geo/countries.tsv").getInputStream(), StandardCharsets.UTF_8))) {
            reader.readLine(); // header
            String line;
            while ((line = reader.readLine()) != null) {
                String[] p = line.split("\t", -1);
                if (p.length < 2 || p[0].length() != 2) continue;
                String code = p[0].toUpperCase();
                batch.add(new Object[]{code, p[1], p.length > 2 && !p[2].isBlank() ? p[2] : null});
                codes.add(code);
            }
        }
        jdbc.batchUpdate("INSERT INTO countries(code, name, region) VALUES (?, ?, ?)", batch);
        return codes;
    }

    private int seedCities(Set<String> knownCountries) throws IOException {
        int total = 0;
        List<Object[]> batch = new ArrayList<>(BATCH_SIZE);
        try (var reader = new BufferedReader(new InputStreamReader(
                new GZIPInputStream(new ClassPathResource("geo/cities.tsv.gz").getInputStream()),
                StandardCharsets.UTF_8))) {
            reader.readLine(); // header
            String line;
            while ((line = reader.readLine()) != null) {
                String[] p = line.split("\t", -1);
                if (p.length < 5) continue;
                String country = p[1].toUpperCase();
                if (!knownCountries.contains(country)) continue;
                long population = parseLong(p[4]);
                batch.add(new Object[]{
                        p[0], country, parseDouble(p[2]), parseDouble(p[3]),
                        population >= POPULAR_MIN_POPULATION, population
                });
                if (batch.size() >= BATCH_SIZE) {
                    total += flush(batch);
                }
            }
        }
        total += flush(batch);
        return total;
    }

    private int flush(List<Object[]> batch) {
        if (batch.isEmpty()) return 0;
        int n = batch.size();
        jdbc.batchUpdate(
                "INSERT INTO cities(name, country_code, latitude, longitude, popular, population) VALUES (?, ?, ?, ?, ?, ?)",
                batch);
        batch.clear();
        return n;
    }

    private long parseLong(String s) {
        try { return Long.parseLong(s.trim()); } catch (Exception e) { return 0; }
    }

    private Double parseDouble(String s) {
        try { return Double.parseDouble(s.trim()); } catch (Exception e) { return null; }
    }
}
