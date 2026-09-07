package com.tripyfull.dto;

import java.time.LocalDate;

/** Create takes the full shape; PATCH treats null as "keep" and uses clearDueDate to unset. */
public record TodoRequest(
        String title,
        String notes,
        String groupName,
        LocalDate dueDate,
        Boolean done,
        Integer orderIndex,
        Boolean clearDueDate
) {}
