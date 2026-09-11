package com.tripyfull.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
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
        LocalDateTime bookingArrivalAt,
        // Where a journey lands, so the leg to the next stop can start there.
        Double bookingToLatitude,
        Double bookingToLongitude,
        // The leg to the next stop, as the server last computed it. Not known:
        // not computed yet, or the router was unreachable. Known with null
        // seconds: there is no route between the two.
        boolean travelKnown,
        /** The way the stored leg was computed for: the chosen mode, or the day's default. */
        String travelMode,
        Integer travelSeconds,
        Integer travelMeters,
        List<List<Double>> travelGeometry,
        boolean travelEstimated,
        /** The line a bus or train leg rides, when a timetable said ("RTC Bus Chiang Mai"). */
        String travelNote
) {}
