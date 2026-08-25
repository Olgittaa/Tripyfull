package com.tripyfull.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record TripRequest(
        @NotBlank(message = "Title is required")
        String title,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        String baseCurrency,
        String coverImage,
        String status
) {}
