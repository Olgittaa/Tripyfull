package com.tripyfull.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ExpenseResponse(
        UUID id,
        String category,
        BigDecimal amount,
        String currency,
        String description
) {}
