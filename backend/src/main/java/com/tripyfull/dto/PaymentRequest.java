package com.tripyfull.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(
        @NotNull(message = "Amount is required")
        BigDecimal amount,
        LocalDate dueDate,
        // PATCH semantics treat null fields as "keep" — this flag (same pattern as
        // DayRequest.clearLinkedBooking) explicitly removes an existing due date.
        Boolean clearDueDate
) {}
