package com.tripyfull.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.List;

public record PlaceRequest(
        @NotBlank(message = "Place name is required")
        String name,
        String type,            // PlaceType enum name
        String country,         // ISO 3166-1 alpha-2
        String city,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        String description,
        List<String> photos,
        List<String> links,
        String visibility,      // PUBLIC | PRIVATE
        String priority,        // MUST_SEE | OPTIONAL
        Boolean needsBooking
) {}
