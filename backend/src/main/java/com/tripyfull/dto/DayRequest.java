package com.tripyfull.dto;

import java.util.UUID;

public record DayRequest(
        String city,
        String overnightStay,
        UUID linkedBookingId,
        Boolean clearLinkedBooking,
        String notes,
        Boolean isBuffer
) {}
