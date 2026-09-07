package com.tripyfull.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
        boolean needsBooking,
        // The stop's own coordinates, used when it is not a saved place.
        Double latitude,
        Double longitude,
        /** Generated from a booking: a sync may rewrite or remove it. */
        boolean fromBooking,
        // From the source booking, so the day can show a plane as a plane and
        // count an overnight flight's hours on the right day.
        String bookingTransportMode,
        LocalDateTime bookingDepartureAt,
        LocalDateTime bookingArrivalAt
) {}
