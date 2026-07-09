package com.example.demo.service;

import com.example.demo.dto.BudgetResponse;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;

@Service
@Transactional(readOnly = true)
public class BudgetService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final DayRepository dayRepository;
    private final ActivityRepository activityRepository;
    private final ExpenseRepository expenseRepository;
    private final BookingRepository bookingRepository;
    private final ExchangeRateService exchangeRateService;

    public BudgetService(TripRepository tripRepository, UserRepository userRepository,
                         DayRepository dayRepository, ActivityRepository activityRepository,
                         ExpenseRepository expenseRepository, BookingRepository bookingRepository,
                         ExchangeRateService exchangeRateService) {
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
        this.dayRepository = dayRepository;
        this.activityRepository = activityRepository;
        this.expenseRepository = expenseRepository;
        this.bookingRepository = bookingRepository;
        this.exchangeRateService = exchangeRateService;
    }

    public BudgetResponse getBudget(UUID tripId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        tripRepository.findByIdAndOwnerId(tripId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));

        String baseCurrency = user.getBaseCurrency();

        List<Day> days = dayRepository.findByTripIdOrderByDateAsc(tripId);
        List<Expense> allExpenses = expenseRepository.findByDayTripId(tripId);
        List<Booking> bookings = bookingRepository.findByTripIdOrderByNameAsc(tripId);

        // Pre-build effective rate map so each booking's rate is resolved once
        Map<UUID, BigDecimal> effectiveRates = new HashMap<>();
        for (Booking b : bookings) {
            effectiveRates.put(b.getId(), resolveRate(b, baseCurrency));
        }

        // Expenses grouped by day
        Map<UUID, List<Expense>> expensesByDay = allExpenses.stream()
                .collect(Collectors.groupingBy(e -> e.getDay().getId()));

        // Actual by category (expenses are assumed to be in base currency)
        Map<String, BigDecimal> actualByCategory = allExpenses.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getCategory() != null ? e.getCategory().name() : "OTHER",
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        // Per-day budgets
        List<BudgetResponse.DayBudget> dayBudgets = new ArrayList<>();
        BigDecimal totalPlanned = BigDecimal.ZERO;
        BigDecimal totalActual = BigDecimal.ZERO;

        for (int i = 0; i < days.size(); i++) {
            Day day = days.get(i);

            BigDecimal planned = day.getActivities().stream()
                    .map(Activity::getCostEstimate)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal actual = expensesByDay.getOrDefault(day.getId(), List.of()).stream()
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            totalPlanned = totalPlanned.add(planned);
            totalActual = totalActual.add(actual);

            dayBudgets.add(new BudgetResponse.DayBudget(
                    day.getId(), i + 1, day.getDate(), day.getCity(), planned, actual
            ));
        }

        // Bookings totals — all amounts converted to base currency
        BigDecimal bookingsTotal = bookings.stream()
                .map(b -> toBase(b.getFullPrice(), effectiveRates.get(b.getId())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal bookingsPaid = bookings.stream()
                .flatMap(b -> b.getPayments().stream()
                        .filter(Payment::isPaid)
                        .map(p -> toBase(p.getAmount(), effectiveRates.get(b.getId()))))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal bookingsRemaining = bookings.stream()
                .flatMap(b -> b.getPayments().stream()
                        .filter(p -> !p.isPaid())
                        .map(p -> toBase(p.getAmount(), effectiveRates.get(b.getId()))))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expensesTotal = allExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Planned by category — booking full prices in base currency
        Map<String, BigDecimal> plannedByCategory = new LinkedHashMap<>();
        bookings.forEach(b -> {
            String cat = b.getCategory() != null ? b.getCategory().name() : "OTHER";
            plannedByCategory.merge(cat, toBase(b.getFullPrice(), effectiveRates.get(b.getId())), BigDecimal::add);
        });
        days.forEach(day -> day.getActivities().forEach(a -> {
            if (a.getCostEstimate() != null) {
                plannedByCategory.merge("ACTIVITY", a.getCostEstimate(), BigDecimal::add);
            }
        }));

        // Upcoming unpaid payments in base currency
        List<BudgetResponse.UpcomingPayment> upcomingPayments = bookings.stream()
                .flatMap(b -> b.getPayments().stream()
                        .filter(p -> !p.isPaid())
                        .map(p -> new BudgetResponse.UpcomingPayment(
                                p.getId(), b.getId(), b.getName(),
                                b.getCategory() != null ? b.getCategory().name() : null,
                                toBase(p.getAmount(), effectiveRates.get(b.getId())),
                                p.getDueDate()
                        )))
                .sorted(Comparator.comparing(BudgetResponse.UpcomingPayment::dueDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        totalPlanned = totalPlanned.add(bookingsTotal);

        return new BudgetResponse(
                baseCurrency,
                totalPlanned, totalActual,
                bookingsTotal, bookingsPaid, bookingsRemaining, expensesTotal,
                actualByCategory, plannedByCategory, dayBudgets, upcomingPayments
        );
    }

    /**
     * Returns the effective exchange rate for a booking.
     * Uses the stored rate if present; otherwise fetches live from ExchangeRateService (cached 1h).
     * Returns BigDecimal.ONE when priceCurrency == baseCurrency or priceCurrency is null.
     */
    private BigDecimal resolveRate(Booking booking, String baseCurrency) {
        String priceCur = booking.getPriceCurrency();
        if (priceCur == null || priceCur.equalsIgnoreCase(baseCurrency)) {
            return BigDecimal.ONE;
        }
        BigDecimal stored = booking.getExchangeRate();
        if (stored != null && stored.compareTo(BigDecimal.ZERO) > 0) {
            return stored;
        }
        // No stored rate — fetch live (ExchangeRateService has an in-memory 1h cache)
        try {
            BigDecimal live = exchangeRateService.getRate(priceCur, baseCurrency);
            if (live != null && live.compareTo(BigDecimal.ZERO) > 0) return live;
        } catch (Exception ignored) {}
        // Could not convert — return ONE and let the caller deal with the raw value
        return BigDecimal.ONE;
    }

    /** Multiply amount by rate. Rate == ONE means same currency, so amount is returned as-is. */
    private BigDecimal toBase(BigDecimal amount, BigDecimal rate) {
        if (amount == null) return BigDecimal.ZERO;
        if (rate == null || rate.compareTo(BigDecimal.ONE) == 0) return amount;
        return amount.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }
}
