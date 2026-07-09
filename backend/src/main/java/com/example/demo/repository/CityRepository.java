package com.example.demo.repository;

import com.example.demo.model.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CityRepository extends JpaRepository<City, Long> {

    @Query("SELECT c FROM City c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY c.popular DESC, c.name ASC")
    List<City> search(String q);

    @Query("SELECT c FROM City c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :q, '%')) AND c.country.code = :countryCode ORDER BY c.popular DESC, c.name ASC")
    List<City> searchByCountry(String q, String countryCode);

    List<City> findByCountryCodeOrderByPopularDescNameAsc(String countryCode);
}
