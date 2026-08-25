package com.tripyfull.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Auto-plan input. Base point anchors clustering and daily routes (usually the hotel);
 * when absent, the centroid of the selected places is used.
 */
public record PlanRequest(
        List<UUID> placeIds,
        BigDecimal baseLatitude,
        BigDecimal baseLongitude,
        Integer maxPerDay          // cap of places per day; default = spread evenly
) {}
