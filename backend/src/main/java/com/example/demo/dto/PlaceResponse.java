package com.example.demo.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PlaceResponse(
        UUID id,
        String name,
        String type,
        String country,
        String city,
        String address,
        BigDecimal latitude,
        BigDecimal longitude,
        String description,
        List<String> photos,
        List<String> links,
        String osmId,
        String visibility,
        String source,
        boolean owned,       // true if the current user owns it (editable)
        UUID folderId        // the current user's folder this place is filed in, if any
) {}
