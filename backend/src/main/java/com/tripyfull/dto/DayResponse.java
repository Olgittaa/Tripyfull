package com.tripyfull.dto;

import java.time.LocalDate;
import java.util.UUID;

public record DayResponse(
        UUID id,
        int dayNumber,
        LocalDate date,
        String city,
        String overnightStay,
        UUID linkedBookingId,
        String notes,
        boolean isBuffer
) {}
