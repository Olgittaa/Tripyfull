package com.tripyfull.repository;

import com.tripyfull.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    // Manual order is the source of truth (drag-and-drop); id breaks legacy ties.
    List<Activity> findByDayIdOrderByOrderIndexAscIdAsc(UUID dayId);

    /** Itinerary entries pointing at a place, so deleting it can unlink them. */
    List<Activity> findByPlaceId(UUID placeId);

    /** Every planned place of a trip, across all its days. */
    List<Activity> findByDayTripIdAndPlaceIsNotNull(UUID tripId);

    /** Stops a booking sync generated, so the next sync can replace them. */
    List<Activity> findByDayTripIdAndSourceBookingIdIsNotNull(UUID tripId);

    long countByDayTripIdAndSourceBookingIdIsNotNull(UUID tripId);
}
