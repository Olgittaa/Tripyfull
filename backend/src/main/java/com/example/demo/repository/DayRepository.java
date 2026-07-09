package com.example.demo.repository;

import com.example.demo.model.Day;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DayRepository extends JpaRepository<Day, UUID> {
    List<Day> findByTripIdOrderByDateAsc(UUID tripId);
    Optional<Day> findByIdAndTripId(UUID id, UUID tripId);
    void deleteByTripId(UUID tripId);
    boolean existsByTripId(UUID tripId);
}
