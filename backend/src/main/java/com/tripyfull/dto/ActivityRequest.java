package com.tripyfull.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

public record ActivityRequest(
        @NotBlank(message = "Activity name is required")
        String name,
        String type,
        LocalTime startTime,
        LocalTime endTime,
        String address,
        BigDecimal costEstimate,
        String costCurrency,
        String notes,
        UUID placeId,          // link to a library Place (inherits address when blank)
        Boolean clearPlace,    // true to unlink
        UUID dayId,            // on update: move the activity to this day (same trip only)
        String travelModeToNext, // foot | taxi | bus | train | car — to the next mapped stop (a flight is a booking)
        Boolean needsBooking,
        // Where the stop is when it is not a saved place: an address found on the
        // map or coordinates typed in. Ignored while a place is linked.
        Double latitude,
        Double longitude,
        Boolean clearCoords
) {}
