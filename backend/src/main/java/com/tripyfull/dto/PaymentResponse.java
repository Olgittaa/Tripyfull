package com.tripyfull.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        int sequence,
        BigDecimal amount,
        LocalDate dueDate,
        boolean paid,
        LocalDate paidDate
) {}
