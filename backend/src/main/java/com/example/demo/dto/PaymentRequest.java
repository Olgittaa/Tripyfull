package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(
        @NotNull(message = "Amount is required")
        BigDecimal amount,
        LocalDate dueDate
) {}
