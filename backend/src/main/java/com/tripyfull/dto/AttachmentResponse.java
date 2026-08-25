package com.tripyfull.dto;

import java.time.Instant;
import java.util.UUID;

public record AttachmentResponse(
        UUID id,
        String fileName,
        String contentType,
        long size,
        Instant uploadedAt,
        String url
) {}
