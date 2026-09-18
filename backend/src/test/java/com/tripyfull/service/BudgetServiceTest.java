package com.tripyfull.service;

import com.tripyfull.dto.BudgetResponse;
import com.tripyfull.model.Activity;
import com.tripyfull.model.ActivityType;
import com.tripyfull.model.Booking;
import com.tripyfull.model.BookingCategory;
import com.tripyfull.model.Day;
import com.tripyfull.model.Payment;
import com.tripyfull.model.Trip;
import com.tripyfull.model.User;
import com.tripyfull.repository.BookingRepository;
import com.tripyfull.repository.DayRepository;
import com.tripyfull.security.OwnershipGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The budget, to the cent.
 *
 * One trip, three bookings in three currencies, one of them part-paid, two day
 * estimates — and every figure below was worked out by hand before it was typed
 * in, so a change in the code has to argue with the arithmetic, not with itself.
 *
 * <pre>
 * base EUR        price      rate      in EUR   paid          owed
 * hotel        420.00 EUR    1        420.00    120.00        300.00 (due 1 Aug)
 * flight      1000.00 USD    0.90     900.00    900.00 (full)   0.00
 * cooking     3000.00 THB    0.026     78.00      0.00         78.00 (no date)
 *                                    -------   -------       -------
 *                                    1398.00   1020.00        378.00
 *
 * estimates     20.00 EUR    1         20.00   (sightseeing → ACTIVITY)
 *              500.00 THB    0.026     13.00   (meal stop   → FOOD)
 *                                    -------
 *                                      33.00     planned total 1431.00
 * </pre>
 */
class BudgetServiceTest {

    private static final UUID TRIP_ID = UUID.randomUUID();

    private final DayRepository dayRepository = mock(DayRepository.class);
    private final BookingRepository bookingRepository = mock(BookingRepository.class);
    private final ExchangeRateService rates = mock(ExchangeRateService.class);
    private final OwnershipGuard guard = mock(OwnershipGuard.class);
    private final BudgetService service = new BudgetService(dayRepository, bookingRepository, rates, guard);

    private User user;
    private Trip trip;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setUsername("marta");
        user.setBaseCurrency("GBP"); // deliberately not the trip's, to prove which one wins
        setField(user, "id", 1L);

        trip = new Trip();
        trip.setTitle("Andalusia for the Ruiz family");
        trip.setBaseCurrency("EUR");
        setField(trip, "id", TRIP_ID);

        when(guard.requireUser(anyString())).thenReturn(user);
        when(guard.requireTrip(any(UUID.class), any(User.class))).thenReturn(trip);

        Day one = day(LocalDate.of(2027, 8, 10));
        Day two = day(LocalDate.of(2027, 8, 11));
        one.getActivities().add(estimate(one, ActivityType.SIGHTSEEING, "20.00", "EUR"));
        two.getActivities().add(estimate(two, ActivityType.MEAL_STOP, "500", "THB"));
        when(dayRepository.findByTripIdOrderByDateAsc(TRIP_ID)).thenReturn(List.of(one, two));

        Booking hotel = booking("Hotel Alfonso XIII", BookingCategory.ACCOMMODATION, "420.00", "EUR", null);
        hotel.setCheckIn(LocalDate.of(2027, 8, 10));
        hotel.setCheckOut(LocalDate.of(2027, 8, 12));
        hotel.getPayments().add(instalment(hotel, "120.00", LocalDate.of(2027, 8, 1), true));
        hotel.getPayments().add(instalment(hotel, "300.00", LocalDate.of(2027, 8, 9), false));

        Booking flight = booking("Madrid to Seville", BookingCategory.TRANSPORTATION, "1000.00", "USD", "0.90");
        flight.setDepartureAt(LocalDateTime.of(2027, 8, 10, 7, 30));
        flight.setPaidSimple(true);

        Booking cooking = booking("Cooking class", BookingCategory.ACTIVITY, "3000", "THB", null);
        cooking.setDepartureAt(LocalDateTime.of(2027, 8, 11, 18, 0));

        when(bookingRepository.findByTripIdOrderByNameAsc(TRIP_ID))
                .thenReturn(List.of(hotel, flight, cooking));
    }

    @Test
    void everyFigureIsTheOneWorkedOutByHand() {
        when(rates.getRate("THB", "EUR")).thenReturn(new BigDecimal("0.026"));

        BudgetResponse b = service.getBudget(TRIP_ID, "marta");

        assertThat(b.baseCurrency()).isEqualTo("EUR");
        assertThat(b.bookingsTotal()).isEqualByComparingTo("1398.00");
        assertThat(b.bookingsPaid()).isEqualByComparingTo("1020.00");
        assertThat(b.bookingsRemaining()).isEqualByComparingTo("378.00");
        assertThat(b.estimatesTotal()).isEqualByComparingTo("33.00");
        assertThat(b.totalPlanned()).isEqualByComparingTo("1431.00");
        assertThat(b.missingRates()).isZero();

        // The 300 still to pay has a date; the cooking class owes with none.
        assertThat(b.upcomingPayments()).hasSize(1);
        assertThat(b.upcomingPayments().get(0).amount()).isEqualByComparingTo("300.00");
        assertThat(b.unscheduled()).hasSize(1);
        assertThat(b.unscheduled().get(0).bookingName()).isEqualTo("Cooking class");
        assertThat(b.unscheduled().get(0).remaining()).isEqualByComparingTo("78.00");

        assertThat(byCategory(b, "TRANSPORT").booked()).isEqualByComparingTo("900.00");
        assertThat(byCategory(b, "TRANSPORT").paid()).isEqualByComparingTo("900.00");
        assertThat(byCategory(b, "ACCOMMODATION").booked()).isEqualByComparingTo("420.00");
        assertThat(byCategory(b, "ACCOMMODATION").paid()).isEqualByComparingTo("120.00");
        assertThat(byCategory(b, "ACTIVITY").booked()).isEqualByComparingTo("78.00");
        assertThat(byCategory(b, "ACTIVITY").estimated()).isEqualByComparingTo("20.00");
        assertThat(byCategory(b, "FOOD").estimated()).isEqualByComparingTo("13.00");
    }

    @Test
    void theNightsCarryTheStayAndTheRestSitsOnItsOwnDay() {
        when(rates.getRate("THB", "EUR")).thenReturn(new BigDecimal("0.026"));

        BudgetResponse b = service.getBudget(TRIP_ID, "marta");

        // 420 over two nights: 210 a night, and the flight lands on the first day.
        assertThat(b.days()).hasSize(2);
        assertThat(b.days().get(0).booked()).isEqualByComparingTo("1110.00"); // 210 + 900
        assertThat(b.days().get(0).estimated()).isEqualByComparingTo("20.00");
        assertThat(b.days().get(1).booked()).isEqualByComparingTo("288.00"); // 210 + 78
        assertThat(b.days().get(1).estimated()).isEqualByComparingTo("13.00");
    }

    @Test
    void theTripsCurrencyDecides() {
        // The same trip sold in dollars: every figure is converted for that, and
        // the account's own currency (GBP) has nothing to do with it.
        trip.setBaseCurrency("USD");
        when(rates.getRate("EUR", "USD")).thenReturn(new BigDecimal("1.10"));
        when(rates.getRate("THB", "USD")).thenReturn(new BigDecimal("0.029"));

        BudgetResponse b = service.getBudget(TRIP_ID, "marta");

        assertThat(b.baseCurrency()).isEqualTo("USD");
        // 420 EUR → 462.00, the flight is already in dollars → 1000.00, 3000 THB → 87.00
        assertThat(b.bookingsTotal()).isEqualByComparingTo("1549.00");
        assertThat(b.bookingsPaid()).isEqualByComparingTo("1132.00"); // 120 × 1.10 + 1000
        assertThat(b.bookingsRemaining()).isEqualByComparingTo("417.00"); // 300 × 1.10 + 87
        assertThat(b.estimatesTotal()).isEqualByComparingTo("36.50"); // 20 × 1.10 + 500 × 0.029
    }

    @Test
    void aTripWithoutItsOwnCurrencyFallsBackToTheAccount() {
        trip.setBaseCurrency(null);
        when(rates.getRate(anyString(), anyString())).thenReturn(null);

        BudgetResponse b = service.getBudget(TRIP_ID, "marta");

        assertThat(b.baseCurrency()).isEqualTo("GBP");
    }

    @Test
    void aRateNobodyCanGiveIsCountedRatherThanGuessed() {
        // No rate for baht: the amount stays as it is and the page is told how
        // many figures it cannot trust, instead of quietly treating 3000 as 3000 EUR.
        when(rates.getRate("THB", "EUR")).thenReturn(null);

        BudgetResponse b = service.getBudget(TRIP_ID, "marta");

        assertThat(b.missingRates()).isEqualTo(1);
        assertThat(b.bookingsTotal()).isEqualByComparingTo("4320.00"); // 420 + 900 + 3000 raw
    }

    /* ---- fixture helpers ---- */

    private Day day(LocalDate date) {
        Day d = new Day();
        d.setTrip(trip);
        d.setDate(date);
        setField(d, "id", UUID.randomUUID());
        return d;
    }

    private Activity estimate(Day day, ActivityType type, String amount, String currency) {
        Activity a = new Activity();
        a.setDay(day);
        a.setType(type);
        a.setName("estimate");
        a.setCostEstimate(new BigDecimal(amount));
        a.setCostCurrency(currency);
        setField(a, "id", UUID.randomUUID());
        return a;
    }

    private Booking booking(String name, BookingCategory category, String price, String currency, String rate) {
        Booking b = new Booking();
        b.setTrip(trip);
        b.setName(name);
        b.setCategory(category);
        b.setFullPrice(new BigDecimal(price));
        b.setPriceCurrency(currency);
        if (rate != null) b.setExchangeRate(new BigDecimal(rate));
        setField(b, "id", UUID.randomUUID());
        return b;
    }

    private Payment instalment(Booking booking, String amount, LocalDate due, boolean paid) {
        Payment p = new Payment();
        p.setBooking(booking);
        p.setAmount(new BigDecimal(amount));
        p.setDueDate(due);
        p.setPaid(paid);
        setField(p, "id", UUID.randomUUID());
        return p;
    }

    private static BudgetResponse.CategoryBudget byCategory(BudgetResponse b, String category) {
        return b.byCategory().stream()
                .filter(c -> c.category().equals(category))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no category " + category + " in " + b.byCategory()));
    }

    /** Ids are the database's to hand out; the fixture plants them. */
    private static void setField(Object target, String name, Object value) {
        try {
            Field f = target.getClass().getDeclaredField(name);
            f.setAccessible(true);
            f.set(target, value);
        } catch (ReflectiveOperationException e) {
            throw new AssertionError(target.getClass().getSimpleName() + "." + name + " moved", e);
        }
    }
}
