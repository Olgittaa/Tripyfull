package com.tripyfull.repository;

import com.tripyfull.model.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CityRepository extends JpaRepository<City, Long> {

    // Exact name match first, then prefix matches, then substrings;
    // within each group the biggest city wins.
    @Query("""
            SELECT c FROM City c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%'))
            ORDER BY CASE WHEN LOWER(c.name) = LOWER(:q) THEN 0
                          WHEN LOWER(c.name) LIKE LOWER(CONCAT(:q, '%')) THEN 1
                          ELSE 2 END,
                     c.population DESC, c.name ASC""")
    List<City> search(String q, org.springframework.data.domain.Pageable pageable);

    @Query("""
            SELECT c FROM City c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) AND c.country.code = :countryCode
            ORDER BY CASE WHEN LOWER(c.name) = LOWER(:q) THEN 0
                          WHEN LOWER(c.name) LIKE LOWER(CONCAT(:q, '%')) THEN 1
                          ELSE 2 END,
                     c.population DESC, c.name ASC""")
    List<City> searchByCountry(String q, String countryCode, org.springframework.data.domain.Pageable pageable);

    List<City> findByCountryCodeOrderByPopularDescNameAsc(String countryCode);
}
