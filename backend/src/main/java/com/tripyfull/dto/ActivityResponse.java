package com.tripyfull.dto;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

public record ActivityResponse(
        UUID id,
        String name,
        String type,
        LocalTime startTime,
        LocalTime endTime,
        String address,
        BigDecimal costEstimate,
        String costCurrency,
        String notes,
        int orderIndex,
        UUID placeId,
        String placeName,
        BigDecimal placeLatitude,
        BigDecimal placeLongitude,
        String travelModeToNext,
        boolean needsBooking
) {}
