package com.example.demo.dto;

import java.util.UUID;

public record FolderResponse(
        UUID id,
        String name,
        String color,
        int placeCount
) {}
