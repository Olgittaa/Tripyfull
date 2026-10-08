package com.tripyfull.service;

import com.tripyfull.model.Activity;
import com.tripyfull.model.ActivityType;
import com.tripyfull.model.Day;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class BookingPlanHotelTimeTest {

    private static final UUID HOTEL = UUID.randomUUID();
    private static final UUID FLIGHT = UUID.randomUUID();

    private static Activity stop(UUID booking, Day day, ActivityType type, String name, LocalTime time) {
        Activity a = new Activity();
        a.setSourceBookingId(booking);
        a.setDay(day);
        a.setType(type);
        a.setName(name);
        a.setStartTime(time);
        return a;
    }

    private static Day day() {
        Day d = new Day();
        ReflectionTestUtils.setField(d, "id", UUID.randomUUID());   // the database assigns it
        return d;
    }

    @Test
    @DisplayName("leaving the hotel at 7:30 on day 4 survives Update plan, on that stop only")
    void aHotelStopKeepsItsOwnTime() {
        Day day4 = day();
        Day day5 = day();
        List<Activity> before = List.of(
                stop(HOTEL, day4, ActivityType.ACCOMMODATION, "Check out · Railay Village", LocalTime.of(7, 30)),
                stop(HOTEL, day5, ActivityType.ACCOMMODATION, "Check out · Railay Village", null),
                // A flight's time is the booking's, not the traveller's: not carried over.
                stop(FLIGHT, day4, ActivityType.TRANSPORT, "KBV → BKK", LocalTime.of(9, 0)));

        Map<String, LocalTime> kept = BookingPlanService.hotelTimes(before);

        Activity rewritten = stop(HOTEL, day4, ActivityType.ACCOMMODATION, "Check out · Railay Village", null);
        assertThat(kept.get(BookingPlanService.hotelKey(rewritten))).isEqualTo(LocalTime.of(7, 30));
        Activity otherDay = stop(HOTEL, day5, ActivityType.ACCOMMODATION, "Check out · Railay Village", null);
        assertThat(kept.get(BookingPlanService.hotelKey(otherDay))).isNull();
        assertThat(kept).hasSize(1);
    }
}
