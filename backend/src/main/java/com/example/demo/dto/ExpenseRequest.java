package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ExpenseRequest(
        String category,
        @NotNull(message = "Amount is required")
        BigDecimal amount,
        String currency,
        String description
) {}
