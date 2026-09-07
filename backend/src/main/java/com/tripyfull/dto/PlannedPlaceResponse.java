package com.tripyfull.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/** One itinerary entry that points at a saved place: which day it is planned on. */
public record PlannedPlaceResponse(
        UUID placeId,
        UUID dayId,
        int dayNumber,
        LocalDate date,
        boolean buffer,
        String activityName,
        LocalTime startTime
) {}
