package com.tripyfull.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record BudgetResponse(
        String baseCurrency,
        BigDecimal totalPlanned,
        BigDecimal totalActual,
        BigDecimal bookingsTotal,
        BigDecimal bookingsPaid,
        BigDecimal bookingsRemaining,
        BigDecimal expensesTotal,
        Map<String, BigDecimal> actualByCategory,
        Map<String, BigDecimal> plannedByCategory,
        List<DayBudget> days,
        List<UpcomingPayment> upcomingPayments
) {
    public record DayBudget(
            UUID dayId,
            int dayNumber,
            LocalDate date,
            String city,
            BigDecimal planned,
            BigDecimal actual
    ) {}

    public record UpcomingPayment(
            UUID paymentId,
            UUID bookingId,
            String bookingName,
            String category,
            BigDecimal amount,
            LocalDate dueDate
    ) {}
}
