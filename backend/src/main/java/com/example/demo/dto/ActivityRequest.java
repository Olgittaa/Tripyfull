package com.example.demo.dto;

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
        Boolean clearPlace     // true to unlink
) {}
