package com.tripyfull.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * The trip's money in one shape, all in the owner's base currency.
 *
 * Three streams, kept apart because they answer different questions:
 * bookings (what is committed, paid, and still to pay), activity estimates (what
 * the days are expected to cost on the way), and expenses (what was actually
 * spent on the way). {@code totalPlanned} = bookings + estimates is the Overview
 * card's headline and stays for that reason.
 */
public record BudgetResponse(
        String baseCurrency,
        BigDecimal totalPlanned,
        BigDecimal totalActual,
        BigDecimal bookingsTotal,
        BigDecimal bookingsPaid,
        BigDecimal bookingsRemaining,
        BigDecimal estimatesTotal,
        BigDecimal expensesTotal,
        int missingRates,
        List<CategoryBudget> byCategory,
        List<DayBudget> days,
        List<UpcomingPayment> upcomingPayments,
        List<UnscheduledBooking> unscheduled
) {
    /**
     * One expense category. Booked is the bookings' full price, paid the part of
     * it already settled, estimated the day plans' cost fields, spent the expenses
     * on the way — so the page can add them up whichever way it reads them.
     */
    public record CategoryBudget(
            String category,
            BigDecimal booked,
            BigDecimal paid,
            BigDecimal estimated,
            BigDecimal spent
    ) {}

    public record DayBudget(
            UUID dayId,
            int dayNumber,
            LocalDate date,
            String city,
            BigDecimal booked,
            BigDecimal estimated,
            BigDecimal spent
    ) {}

    /** A scheduled instalment not yet paid. */
    public record UpcomingPayment(
            UUID paymentId,
            UUID bookingId,
            String bookingName,
            String category,
            BigDecimal amount,
            LocalDate dueDate
    ) {}

    /** Money still owed on a booking that has no instalment plan to say when. */
    public record UnscheduledBooking(
            UUID bookingId,
            String bookingName,
            String category,
            BigDecimal remaining
    ) {}
}
