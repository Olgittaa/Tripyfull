package com.tripyfull.dto;

import jakarta.validation.constraints.NotBlank;

public record PlaceGeocodeRequest(
        @NotBlank(message = "Search text is required")
        String text,
        String country          // optional ISO 3166-1 alpha-2 filter
) {}
