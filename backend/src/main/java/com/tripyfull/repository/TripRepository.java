package com.tripyfull.repository;

import com.tripyfull.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripRepository extends JpaRepository<Trip, UUID> {
    List<Trip> findByOwnerId(Long ownerId);
    Optional<Trip> findByIdAndOwnerId(UUID id, Long ownerId);
}
