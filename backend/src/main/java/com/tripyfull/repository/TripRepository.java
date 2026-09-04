package com.tripyfull.repository;

import com.tripyfull.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TripRepository extends JpaRepository<Trip, UUID> {
    List<Trip> findByOwnerId(Long ownerId);
    /** Trips whose own place list contains this place (join rows must go first). */
    List<Trip> findByPlacesId(UUID placeId);
    Optional<Trip> findByIdAndOwnerId(UUID id, Long ownerId);
}
