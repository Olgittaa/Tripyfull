package com.tripyfull.service;

import com.tripyfull.dto.BudgetResponse;
import com.tripyfull.model.Activity;
import com.tripyfull.model.Booking;
import com.tripyfull.model.BookingCategory;
import com.tripyfull.model.Day;
import com.tripyfull.model.Expense;
import com.tripyfull.model.Payment;
import com.tripyfull.model.User;
import com.tripyfull.repository.BookingRepository;
import com.tripyfull.repository.DayRepository;
import com.tripyfull.repository.ExpenseRepository;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class BudgetService {

    /** Expense categories are the common language; bookings are mapped onto them. */
    private static final List<String> CATEGORY_ORDER =
            List.of("TRANSPORT", "ACCOMMODATION", "ACTIVITY", "FOOD", "OTHER");

    private final DayRepository dayRepository;
    private final ExpenseRepository expenseRepository;
    private final BookingRepository bookingRepository;
    private final ExchangeRateService exchangeRateService;
    private final OwnershipGuard guard;

    public BudgetService(DayRepository dayRepository, ExpenseRepository expenseRepository,
                         BookingRepository bookingRepository, ExchangeRateService exchangeRateService,
                         OwnershipGuard guard) {
        this.dayRepository = dayRepository;
        this.expenseRepository = expenseRepository;
        this.bookingRepository = bookingRepository;
        this.exchangeRateService = exchangeRateService;
        this.guard = guard;
    }

    public BudgetResponse getBudget(UUID tripId, String username) {
        User user = guard.requireUser(username);
        guard.requireTrip(tripId, user);
        String base = user.getBaseCurrency();

        List<Day> days = dayRepository.findByTripIdOrderByDateAsc(tripId);
        List<Expense> expenses = expenseRepository.findByDayTripId(tripId);
        List<Booking> bookings = bookingRepository.findByTripIdOrderByNameAsc(tripId);

        Map<UUID, BigDecimal> rateOf = new HashMap<>();
        int missingRates = 0;
        for (Booking b : bookings) {
            BigDecimal r = resolveRate(b, base);
            if (r == null) {
                missingRates++;
                r = BigDecimal.ONE; // shown raw; the count tells the page to warn
            }
            rateOf.put(b.getId(), r);
        }
        Map<String, BigDecimal> liveRates = new HashMap<>();

        // ---- bookings: committed, paid, still owed ----
        BigDecimal bookingsTotal = BigDecimal.ZERO;
        BigDecimal bookingsPaid = BigDecimal.ZERO;
        BigDecimal bookingsRemaining = BigDecimal.ZERO;
        List<BudgetResponse.UpcomingPayment> upcoming = new ArrayList<>();
        List<BudgetResponse.UnscheduledBooking> unscheduled = new ArrayList<>();
        Map<String, BigDecimal> bookedByCat = new LinkedHashMap<>();
        Map<String, BigDecimal> paidByCat = new LinkedHashMap<>();
        Map<UUID, BigDecimal> bookedByDay = new HashMap<>();
        Map<LocalDate, Day> dayByDate = new HashMap<>();
        for (Day d : days) if (d.getDate() != null) dayByDate.putIfAbsent(d.getDate(), d);

        for (Booking b : bookings) {
            BigDecimal rate = rateOf.get(b.getId());
            BigDecimal full = toBase(b.getFullPrice(), rate);
            // "Paid in full" is a statement about the whole booking; only without it
            // do the instalments decide. Before, a ticked booking counted as unpaid.
            BigDecimal paid = b.isPaidSimple()
                    ? full
                    : b.getPayments().stream().filter(Payment::isPaid)
                            .map(p -> toBase(p.getAmount(), rate))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal remaining = full.subtract(paid).max(BigDecimal.ZERO);

            bookingsTotal = bookingsTotal.add(full);
            bookingsPaid = bookingsPaid.add(paid.min(full));
            bookingsRemaining = bookingsRemaining.add(remaining);
            bookedByCat.merge(categoryOf(b), full, BigDecimal::add);
            paidByCat.merge(categoryOf(b), paid.min(full), BigDecimal::add);
            allocateToDays(b, full, dayByDate, bookedByDay);

            if (b.isPaidSimple()) continue;
            boolean anyUnpaidScheduled = false;
            for (Payment p : b.getPayments()) {
                if (p.isPaid()) continue;
                anyUnpaidScheduled = true;
                upcoming.add(new BudgetResponse.UpcomingPayment(p.getId(), b.getId(), b.getName(),
                        categoryOf(b), toBase(p.getAmount(), rate), p.getDueDate()));
            }
            // Owed, but no instalment says when: the page lists it separately so the
            // "left to pay" figure is fully accounted for.
            if (!anyUnpaidScheduled && remaining.signum() > 0) {
                unscheduled.add(new BudgetResponse.UnscheduledBooking(b.getId(), b.getName(),
                        categoryOf(b), remaining));
            }
        }
        upcoming.sort(Comparator.comparing(BudgetResponse.UpcomingPayment::dueDate,
                Comparator.nullsLast(Comparator.naturalOrder())));

        // ---- estimates and expenses, per day and per category ----
        Map<String, BigDecimal> estimatedByCat = new LinkedHashMap<>();
        Map<String, BigDecimal> spentByCat = new LinkedHashMap<>();
        Map<UUID, BigDecimal> spentByDay = new HashMap<>();
        BigDecimal estimatesTotal = BigDecimal.ZERO;
        BigDecimal expensesTotal = BigDecimal.ZERO;

        for (Expense e : expenses) {
            BigDecimal amt = toBase(e.getAmount(), rateFor(e.getCurrency(), base, liveRates));
            expensesTotal = expensesTotal.add(amt);
            spentByCat.merge(e.getCategory() != null ? e.getCategory().name() : "OTHER", amt, BigDecimal::add);
            spentByDay.merge(e.getDay().getId(), amt, BigDecimal::add);
        }

        List<BudgetResponse.DayBudget> dayBudgets = new ArrayList<>();
        for (int i = 0; i < days.size(); i++) {
            Day day = days.get(i);
            BigDecimal estimated = BigDecimal.ZERO;
            for (Activity a : day.getActivities()) {
                if (a.getCostEstimate() == null) continue;
                BigDecimal amt = toBase(a.getCostEstimate(), rateFor(a.getCostCurrency(), base, liveRates));
                estimated = estimated.add(amt);
                // A dinner estimate is food, a taxi estimate is transport — the same
                // words the expenses use, so the two columns line up.
                estimatedByCat.merge(categoryOf(a), amt, BigDecimal::add);
            }
            estimatesTotal = estimatesTotal.add(estimated);
            dayBudgets.add(new BudgetResponse.DayBudget(day.getId(), i + 1, day.getDate(), day.getCity(),
                    bookedByDay.getOrDefault(day.getId(), BigDecimal.ZERO),
                    estimated,
                    spentByDay.getOrDefault(day.getId(), BigDecimal.ZERO)));
        }

        List<BudgetResponse.CategoryBudget> byCategory = new ArrayList<>();
        for (String cat : CATEGORY_ORDER) {
            BigDecimal booked = bookedByCat.getOrDefault(cat, BigDecimal.ZERO);
            BigDecimal paidCat = paidByCat.getOrDefault(cat, BigDecimal.ZERO);
            BigDecimal est = estimatedByCat.getOrDefault(cat, BigDecimal.ZERO);
            BigDecimal spent = spentByCat.getOrDefault(cat, BigDecimal.ZERO);
            if (booked.signum() == 0 && est.signum() == 0 && spent.signum() == 0) continue;
            byCategory.add(new BudgetResponse.CategoryBudget(cat, booked, paidCat, est, spent));
        }

        return new BudgetResponse(
                base,
                bookingsTotal.add(estimatesTotal), expensesTotal,
                bookingsTotal, bookingsPaid, bookingsRemaining,
                estimatesTotal, expensesTotal, missingRates,
                byCategory, dayBudgets, upcoming, unscheduled
        );
    }

    /**
     * Spreads a booking over the days it is for: a stay by night, a journey or an
     * activity on the day it starts. Bookings without a date stay in the totals only.
     */
    private void allocateToDays(Booking b, BigDecimal full, Map<LocalDate, Day> dayByDate,
                                Map<UUID, BigDecimal> bookedByDay) {
        if (full.signum() == 0) return;
        if (b.getCategory() == BookingCategory.ACCOMMODATION) {
            if (b.getCheckIn() == null || b.getCheckOut() == null) return;
            long nights = ChronoUnit.DAYS.between(b.getCheckIn(), b.getCheckOut());
            if (nights <= 0) return;
            BigDecimal perNight = full.divide(BigDecimal.valueOf(nights), 2, RoundingMode.HALF_UP);
            for (LocalDate d = b.getCheckIn(); d.isBefore(b.getCheckOut()); d = d.plusDays(1)) {
                Day day = dayByDate.get(d);
                if (day != null) bookedByDay.merge(day.getId(), perNight, BigDecimal::add);
            }
            return;
        }
        if (b.getDepartureAt() != null) {
            Day day = dayByDate.get(b.getDepartureAt().toLocalDate());
            if (day != null) bookedByDay.merge(day.getId(), full, BigDecimal::add);
        }
    }

    /** Activity types in the expense categories' words. */
    private static String categoryOf(Activity a) {
        if (a.getType() == null) return "ACTIVITY";
        return switch (a.getType()) {
            case RESTAURANT, MEAL_STOP -> "FOOD";
            case TRANSPORT -> "TRANSPORT";
            case ACCOMMODATION -> "ACCOMMODATION";
            case SHOPPING, OTHER -> "OTHER";
            default -> "ACTIVITY";
        };
    }

    /** Booking categories in the expense categories' words, so the two line up. */
    private static String categoryOf(Booking b) {
        if (b.getCategory() == null) return "OTHER";
        return switch (b.getCategory()) {
            case TRANSPORTATION -> "TRANSPORT";
            case ACCOMMODATION -> "ACCOMMODATION";
            case ACTIVITY -> "ACTIVITY";
        };
    }

    /**
     * The booking's rate into the base currency: ONE for the same currency, the
     * stored rate when there is one, a live one otherwise — and null when none can
     * be had, so the caller can count the gap instead of silently mixing currencies.
     */
    private BigDecimal resolveRate(Booking booking, String base) {
        String cur = booking.getPriceCurrency();
        if (cur == null || cur.equalsIgnoreCase(base)) return BigDecimal.ONE;
        BigDecimal stored = booking.getExchangeRate();
        if (stored != null && stored.signum() > 0) return stored;
        try {
            BigDecimal live = exchangeRateService.getRate(cur, base);
            if (live != null && live.signum() > 0) return live;
        } catch (Exception ignored) {}
        return null;
    }

    private BigDecimal toBase(BigDecimal amount, BigDecimal rate) {
        if (amount == null) return BigDecimal.ZERO;
        if (rate == null || rate.compareTo(BigDecimal.ONE) == 0) return amount;
        return amount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    /** Live rate for an expense or estimate currency, memoised per request. */
    private BigDecimal rateFor(String currency, String base, Map<String, BigDecimal> memo) {
        if (currency == null || currency.isBlank() || currency.equalsIgnoreCase(base)) return BigDecimal.ONE;
        return memo.computeIfAbsent(currency.toUpperCase(), c -> {
            try {
                BigDecimal live = exchangeRateService.getRate(c, base);
                if (live != null && live.signum() > 0) return live;
            } catch (Exception ignored) {}
            return BigDecimal.ONE;
        });
    }
}
