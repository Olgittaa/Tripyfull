package com.tripyfull.service;

import com.tripyfull.model.Activity;
import com.tripyfull.model.ActivityType;
import com.tripyfull.model.Booking;
import com.tripyfull.model.Day;
import com.tripyfull.repository.ActivityRepository;
import com.tripyfull.repository.BookingRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.*;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TravelLegServiceTest {

    private static final double[] OLD_TOWN = {18.7876, 98.9932};
    private static final double[] NIMMAN = {18.8005, 98.9675};
    private static final double[] ROUND_THE_CORNER = {18.7880, 98.9940};

    @Test
    void aShortHopIsWalkedWhateverTheDay() {
        assertThat(TravelLegService.defaultMode(OLD_TOWN, ROUND_THE_CORNER, true)).isEqualTo("foot");
        assertThat(TravelLegService.defaultMode(OLD_TOWN, ROUND_THE_CORNER, false)).isEqualTo("foot");
    }

    @Test
    void aLongerLegIsDrivenWithACarElseTaxied() {
        assertThat(TravelLegService.defaultMode(OLD_TOWN, NIMMAN, true)).isEqualTo("car");
        assertThat(TravelLegService.defaultMode(OLD_TOWN, NIMMAN, false)).isEqualTo("taxi");
    }

    @Test
    void aJourneyThatLandsTheSameDayContinuesFromWhereItLands() {
        Activity flight = new Activity();
        flight.setType(ActivityType.TRANSPORT);
        flight.setLatitude(50.0379);   // departs Frankfurt
        flight.setLongitude(8.5622);
        Booking b = new Booking();
        b.setDepartureAt(LocalDateTime.of(2026, 12, 11, 8, 0));
        b.setArrivalAt(LocalDateTime.of(2026, 12, 11, 18, 15));
        b.setToLatitude(19.9526);
        b.setToLongitude(99.8829);
        assertThat(TravelLegService.legStart(flight, b)).containsExactly(19.9526, 99.8829);

        b.setArrivalAt(LocalDateTime.of(2026, 12, 12, 6, 0)); // overnight: the day ends where it took off
        assertThat(TravelLegService.legStart(flight, b)).containsExactly(50.0379, 8.5622);
        assertThat(TravelLegService.legStart(flight, null)).containsExactly(50.0379, 8.5622);
    }

    @Test
    void departureKeepsTheStopsTimeAndNeverLiesInThePast() {
        Day day = new Day();
        day.setDate(LocalDate.of(2020, 1, 6)); // a Monday long gone
        Activity stop = new Activity();
        stop.setDay(day);
        stop.setStartTime(LocalTime.of(9, 0));
        stop.setEndTime(LocalTime.of(10, 30));

        Instant at = TravelLegService.departureOf(stop, OLD_TOWN);
        ZonedDateTime local = at.atZone(ZoneOffset.ofHours(7)); // Thailand, from the longitude
        assertThat(local.toLocalTime()).isEqualTo(LocalTime.of(10, 30));
        assertThat(local.getDayOfWeek()).isEqualTo(DayOfWeek.MONDAY);
        assertThat(local.toLocalDate()).isAfterOrEqualTo(LocalDate.now());
    }

    /**
     * Regression: a day whose stops came from no booking at all — the ordinary case for a trip
     * before anything is booked. The lookup of a stop's source booking must simply come back
     * empty; it used to be asked of an empty Map.of(), which throws on a null key, and the
     * stop being added was lost with a 500.
     */
    @Test
    void aDayWhoseStopsCameFromNoBookingStillGetsItsLegs() {
        RoutingService routing = mock(RoutingService.class);
        ActivityRepository activities = mock(ActivityRepository.class);
        TravelLegService service = new TravelLegService(routing, activities, mock(BookingRepository.class));
        when(routing.route(any(), anyString(), any()))
                .thenReturn(new RoutingService.RouteResult("taxi", 900, 4200, List.of(), List.of()));

        Day day = new Day();
        day.setDate(LocalDate.of(2026, 12, 11));
        Activity first = handMade(day, OLD_TOWN);
        Activity second = handMade(day, NIMMAN);

        service.refresh(List.of(first, second));

        assertThat(first.getSourceBookingId()).isNull();
        assertThat(first.getTravelSeconds()).isEqualTo(900);
        assertThat(first.getTravelMeters()).isEqualTo(4200);
        assertThat(second.getTravelSeconds()).isNull();   // the last stop leads nowhere
    }

    /** A stop the user typed in: it has a pin and no booking behind it. */
    private static Activity handMade(Day day, double[] at) {
        Activity a = new Activity();
        a.setDay(day);
        a.setType(ActivityType.SIGHTSEEING);
        a.setLatitude(at[0]);
        a.setLongitude(at[1]);
        withId(a);
        return a;
    }

    /** The id is JPA's to hand out; the day's bookkeeping needs one, so the test plants it. */
    private static void withId(Activity a) {
        try {
            Field id = Activity.class.getDeclaredField("id");
            id.setAccessible(true);
            id.set(a, UUID.randomUUID());
        } catch (ReflectiveOperationException e) {
            throw new AssertionError("Activity.id moved", e);
        }
    }

    @Test
    void aDayWithoutADateOrTimeAsksForNineOnTheComingMonday() {
        Activity stop = new Activity();
        stop.setDay(new Day());
        ZonedDateTime local = TravelLegService.departureOf(stop, OLD_TOWN).atZone(ZoneOffset.ofHours(7));
        assertThat(local.toLocalTime()).isEqualTo(LocalTime.of(9, 0));
        assertThat(local.getDayOfWeek()).isEqualTo(DayOfWeek.MONDAY);
        assertThat(local.toLocalDate()).isAfter(LocalDate.now());
    }
}
