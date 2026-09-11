package com.tripyfull.service;

import com.tripyfull.model.Activity;
import com.tripyfull.model.ActivityType;
import com.tripyfull.model.Booking;
import com.tripyfull.model.Day;
import org.junit.jupiter.api.Test;

import java.time.*;

import static org.assertj.core.api.Assertions.assertThat;

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
