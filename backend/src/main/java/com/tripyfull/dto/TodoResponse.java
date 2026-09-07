package com.tripyfull.dto;

import java.time.LocalDate;
import java.util.UUID;

public record TodoResponse(
        UUID id,
        String title,
        String notes,
        String groupName,
        LocalDate dueDate,
        boolean done,
        int orderIndex,
        String templateKey
) {}
