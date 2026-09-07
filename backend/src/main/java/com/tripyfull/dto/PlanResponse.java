package com.tripyfull.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Computed plan: per plannable day an ordered route of places, plus the leftover pool. */
public record PlanResponse(
        List<PlanDay> days,
        List<PlanPlace> unassigned    // no coordinates, over capacity, or bumped by balancing
) {
    public record PlanDay(
            UUID dayId,
            int dayNumber,
            LocalDate date,
            List<PlanPlace> places,   // in visiting order
            double totalKm,           // anchor -> stops, Haversine
            String baseName           // the hotel the day was planned from; null = centre of places
    ) {}

    public record PlanPlace(UUID placeId, String name, String type, int rating, boolean needsBooking) {}
}
