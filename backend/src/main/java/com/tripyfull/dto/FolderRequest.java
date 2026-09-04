package com.tripyfull.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record FolderRequest(
        @NotBlank(message = "Folder name is required")
        String name,
        String color,
        UUID tripId      // folders live inside a trip; null only for legacy folders
) {}
