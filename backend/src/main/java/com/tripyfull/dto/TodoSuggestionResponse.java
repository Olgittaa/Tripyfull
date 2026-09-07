package com.tripyfull.dto;

import java.time.LocalDate;

/** A built-in to-do the owner may add, with its due date already worked out for this trip. */
public record TodoSuggestionResponse(
        String key,
        String title,
        String groupName,
        String why,
        LocalDate dueDate
) {}
