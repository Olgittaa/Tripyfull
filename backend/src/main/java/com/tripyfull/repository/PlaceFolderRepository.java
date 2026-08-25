package com.tripyfull.repository;

import com.tripyfull.model.PlaceFolder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlaceFolderRepository extends JpaRepository<PlaceFolder, UUID> {
    List<PlaceFolder> findByOwnerIdOrderByNameAsc(Long ownerId);
    Optional<PlaceFolder> findByIdAndOwnerId(UUID id, Long ownerId);
    /** Folders (any owner) that contain a given place — used to clean up on place delete. */
    List<PlaceFolder> findByPlacesId(UUID placeId);
}
