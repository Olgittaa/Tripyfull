package com.tripyfull.repository;

import com.tripyfull.model.Day;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DayRepository extends JpaRepository<Day, UUID> {
    List<Day> findByTripIdOrderByDateAsc(UUID tripId);
    Optional<Day> findByIdAndTripId(UUID id, UUID tripId);
    boolean existsByTripId(UUID tripId);
}
