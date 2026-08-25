package com.tripyfull.dto;

import jakarta.validation.constraints.NotBlank;

public record PlaceImportRequest(
        @NotBlank(message = "A map link is required")
        String url
) {}
