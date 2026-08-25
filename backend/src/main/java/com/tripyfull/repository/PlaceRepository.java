package com.tripyfull.repository;

import com.tripyfull.model.Place;
import com.tripyfull.model.PlaceVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlaceRepository extends JpaRepository<Place, UUID> {

    List<Place> findByOwnerIdOrderByNameAsc(Long ownerId);

    Optional<Place> findByOwnerIdAndOsmId(Long ownerId, String osmId);

    /**
     * Places visible to the user: their own (any visibility) plus everyone's PUBLIC,
     * optionally filtered by country (ISO code) and a name substring.
     */
    @Query("""
            select p from Place p
            where (p.owner.id = :ownerId or p.visibility = :publicVisibility)
              and (:country is null or p.country = :country)
              and (:q is null or lower(p.name) like :q)
            order by p.name asc
            """)
    List<Place> findVisible(@Param("ownerId") Long ownerId,
                            @Param("publicVisibility") PlaceVisibility publicVisibility,
                            @Param("country") String country,
                            @Param("q") String q);
}
