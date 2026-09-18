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
import java.util.ArrayList;
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

    /* ---- What a day costs the router ----
       A leg is kept on the stop it departs from, together with a key naming what
       it was computed for. Re-routing is the expensive part — a real request to
       Google or OSRM — so these say, in calls, what a day is allowed to cost. */

    /** A router that answers instantly and remembers what it was asked. */
    private static final class CountingRouter {
        final RoutingService service = mock(RoutingService.class);
        final List<String> asked = new ArrayList<>();

        CountingRouter() {
            when(service.route(any(), anyString(), any())).thenAnswer(call -> {
                List<double[]> points = call.getArgument(0);
                asked.add(call.getArgument(1) + " " + fmt(points.get(0)) + "->" + fmt(points.get(1)));
                return new RoutingService.RouteResult(call.getArgument(1), 600, 4000, List.of(), List.of());
            });
        }

        private static String fmt(double[] p) {
            return String.format("%.3f,%.3f", p[0], p[1]);
        }
    }

    /** A day of pinned stops, a hundred metres apart, in the order given. */
    private static List<Activity> pinnedDay(int count) {
        Day day = new Day();
        day.setDate(LocalDate.of(2027, 4, 5));
        List<Activity> stops = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Activity a = new Activity();
            a.setDay(day);
            a.setName("Stop " + (i + 1));
            a.setType(ActivityType.SIGHTSEEING);
            a.setLatitude(18.78 + i * 0.01);
            a.setLongitude(98.99 + i * 0.01);
            a.setTravelModeToNext("foot"); // a mode the user picked, so the day needs no car lookup
            withId(a);
            stops.add(a);
        }
        return stops;
    }

    private static TravelLegService serviceWith(CountingRouter router) {
        return new TravelLegService(router.service, mock(ActivityRepository.class), mock(BookingRepository.class));
    }

    @Test
    void adayIsRoutedOnceAndThenLeftAlone() {
        CountingRouter router = new CountingRouter();
        TravelLegService service = serviceWith(router);
        List<Activity> day = pinnedDay(5);

        service.refresh(day);
        assertThat(router.asked).hasSize(4); // one per pair, the last stop leads nowhere

        router.asked.clear();
        service.refresh(day);
        assertThat(router.asked).isEmpty(); // nothing moved, so nothing is asked again
    }

    @Test
    void movingOneStopReRoutesOnlyWhatMoved() {
        CountingRouter router = new CountingRouter();
        TravelLegService service = serviceWith(router);
        List<Activity> day = pinnedDay(10);
        service.refresh(day);
        router.asked.clear();

        // The last stop is dragged to the front: the only new way to travel is
        // from it to what used to be first. The eight legs in the middle are
        // between the same two stops as before and must not be asked again.
        List<Activity> reordered = new ArrayList<>();
        reordered.add(day.get(9));
        reordered.addAll(day.subList(0, 9));
        service.refresh(reordered);

        assertThat(router.asked).hasSize(1);
        assertThat(router.asked.get(0)).contains("18.870,99.080->18.780,98.990");
    }

    @Test
    void changingOneStopsModeReRoutesThatLegAlone() {
        CountingRouter router = new CountingRouter();
        TravelLegService service = serviceWith(router);
        List<Activity> day = pinnedDay(4);
        service.refresh(day);
        router.asked.clear();

        day.get(1).setTravelModeToNext("taxi");
        service.refresh(day);

        assertThat(router.asked).hasSize(1);
        assertThat(router.asked.get(0)).startsWith("taxi ");
    }

    @Test
    void aStopWithoutAPinIsSteppedOverRatherThanGuessedAt() {
        CountingRouter router = new CountingRouter();
        TravelLegService service = serviceWith(router);
        List<Activity> day = pinnedDay(3);
        Activity unpinned = new Activity();
        unpinned.setDay(day.get(0).getDay());
        unpinned.setName("Lunch somewhere in town");
        unpinned.setType(ActivityType.MEAL_STOP);
        withId(unpinned);
        day.add(1, unpinned);

        service.refresh(day);

        // Two legs: stop 1 to stop 2 over the unpinned one, and stop 2 to stop 3.
        assertThat(router.asked).hasSize(2);
        // The stop nobody could place on the map carries no leg of its own — the
        // row shows the stop, not an empty promise of a time.
        assertThat(unpinned.getTravelKey()).isNull();
        assertThat(unpinned.getTravelSeconds()).isNull();
    }
}
