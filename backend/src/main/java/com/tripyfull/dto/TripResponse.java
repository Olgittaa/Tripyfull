package com.tripyfull.dto;

import java.time.LocalDate;
import java.util.UUID;

public record TripResponse(
        UUID id,
        String title,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        String baseCurrency,
        String coverImage,
        String status
) {}
