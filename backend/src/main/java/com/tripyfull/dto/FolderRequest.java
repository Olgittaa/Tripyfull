package com.tripyfull.dto;

import jakarta.validation.constraints.NotBlank;

public record FolderRequest(
        @NotBlank(message = "Folder name is required")
        String name,
        String color
) {}
