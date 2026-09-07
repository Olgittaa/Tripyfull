package com.tripyfull.service;

import com.tripyfull.dto.PlanSyncResult;
import com.tripyfull.model.Activity;
import com.tripyfull.model.ActivityType;
import com.tripyfull.model.Booking;
import com.tripyfull.model.BookingCategory;
import com.tripyfull.model.Day;
import com.tripyfull.model.TransportMode;
import com.tripyfull.model.Trip;
import com.tripyfull.repository.ActivityRepository;
import com.tripyfull.repository.BookingRepository;
import com.tripyfull.repository.DayRepository;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Turns the trip's bookings into itinerary stops.
 *
 * What is booked is already known: the hotel, the night train, the day the ferry
 * leaves. Typing it into the plan a second time is work the app can do — and
 * redo, whenever a booking changes.
 *
 * The rules it follows:
 * <ul>
 *   <li>A stay is the bracket around a day: the hotel is the day's last stop on
 *       the night you arrive, its first stop on the morning you leave, and both
 *       on every day in between — which is how a day actually runs.</li>
 *   <li>Transport lands on the day it departs, at its time; an overnight leg
 *       adds an arrival stop on the following day.</li>
 *   <li>An activity booking is placed only if it is tied to a day — nothing
 *       else says when it happens.</li>
 *   <li>Generated stops belong to their booking. A sync rewrites those and
 *       never touches a stop added by hand.</li>
 * </ul>
 */
@Service
@Transactional
public class BookingPlanService {

    /** Used when the booking does not say what time check-in or check-out is. */
    private static final LocalTime DEFAULT_CHECK_IN = LocalTime.of(15, 0);
    private static final LocalTime DEFAULT_CHECK_OUT = LocalTime.of(11, 0);

    /** Where a generated stop sits in the day, before times are considered. */
    private enum Slot { MORNING, TIMED, EVENING }

    private final ActivityRepository activityRepository;
    private final BookingRepository bookingRepository;
    private final DayRepository dayRepository;
    private final OwnershipGuard guard;

    public BookingPlanService(ActivityRepository activityRepository, BookingRepository bookingRepository,
                              DayRepository dayRepository, OwnershipGuard guard) {
        this.activityRepository = activityRepository;
        this.bookingRepository = bookingRepository;
        this.dayRepository = dayRepository;
        this.guard = guard;
    }

    /** How many stops in this trip currently come from a booking. */
    public long countGenerated(UUID tripId, String username) {
        guard.requireTrip(tripId, username);
        return activityRepository.countByDayTripIdAndSourceBookingIdIsNotNull(tripId);
    }

    public PlanSyncResult sync(UUID tripId, String username) {
        Trip trip = guard.requireTrip(tripId, username);

        // Reserve days have no date, so nothing can be scheduled onto them.
        Map<LocalDate, Day> byDate = new HashMap<>();
        for (Day d : trip.getDays()) {
            if (d.getDate() != null) byDate.putIfAbsent(d.getDate(), d);
        }

        List<Activity> stale = activityRepository.findByDayTripIdAndSourceBookingIdIsNotNull(tripId);
        activityRepository.deleteAll(stale);
        activityRepository.flush();

        List<Booking> bookings = bookingRepository.findByTripIdOrderByNameAsc(tripId);
        Map<UUID, List<Planned>> perDay = new HashMap<>();
        int skipped = 0;

        for (Booking b : bookings) {
            List<Planned> stops = stopsFor(b, byDate);
            if (stops.isEmpty()) {
                skipped++;
                continue;
            }
            for (Planned p : stops) {
                perDay.computeIfAbsent(p.day.getId(), k -> new ArrayList<>()).add(p);
            }
        }

        int created = 0;
        for (List<Planned> stops : perDay.values()) {
            created += stops.size();
            for (Planned p : stops) activityRepository.save(p.activity);
        }
        activityRepository.flush();

        // Order every touched day once, with the generated stops in their slots.
        for (UUID dayId : perDay.keySet()) {
            reorder(dayId, perDay.get(dayId));
        }

        return new PlanSyncResult(created, stale.size(), perDay.size(), skipped,
                activityRepository.countByDayTripIdAndSourceBookingIdIsNotNull(tripId));
    }

    /** The stops one booking contributes, already attached to their days. */
    private List<Planned> stopsFor(Booking b, Map<LocalDate, Day> byDate) {
        List<Planned> out = new ArrayList<>();
        if (b.getCategory() == BookingCategory.ACCOMMODATION) {
            addStay(b, byDate, out);
        } else if (b.getCategory() == BookingCategory.TRANSPORTATION) {
            addTransport(b, byDate, out);
        } else {
            addActivity(b, byDate, out);
        }
        return out;
    }

    /**
     * An activity is placed by its own start time when it has one, and otherwise
     * only if it was tied to a day by hand — nothing else says when it happens.
     */
    private void addActivity(Booking b, Map<LocalDate, Day> byDate, List<Planned> out) {
        Day day = null;
        if (b.getDepartureAt() != null) day = byDate.get(b.getDepartureAt().toLocalDate());
        if (day == null && b.getLinkedDayId() != null) {
            day = dayRepository.findById(b.getLinkedDayId()).orElse(null);
        }
        if (day == null) return;

        Activity a = base(b, day, ActivityType.OTHER, b.getName());
        a.setAddress(b.getAddress() != null ? b.getAddress() : b.getFromPlace());
        if (b.getDepartureAt() != null) {
            a.setStartTime(b.getDepartureAt().toLocalTime());
            if (b.getArrivalAt() != null
                    && b.getArrivalAt().toLocalDate().equals(b.getDepartureAt().toLocalDate())) {
                a.setEndTime(b.getArrivalAt().toLocalTime());
            }
        }
        out.add(new Planned(day, a, Slot.TIMED));
    }

    private void addStay(Booking b, Map<LocalDate, Day> byDate, List<Planned> out) {
        if (b.getCheckIn() == null || b.getCheckOut() == null) return;
        LocalTime in = b.getCheckInTime() != null ? b.getCheckInTime() : DEFAULT_CHECK_IN;
        LocalTime outTime = b.getCheckOutTime() != null ? b.getCheckOutTime() : DEFAULT_CHECK_OUT;

        for (LocalDate d = b.getCheckIn(); !d.isAfter(b.getCheckOut()); d = d.plusDays(1)) {
            Day day = byDate.get(d);
            if (day == null) continue;
            boolean first = d.equals(b.getCheckIn());
            boolean last = d.equals(b.getCheckOut());

            // The hotel's own times are conditions, not appointments: written as
            // a clock they sort wrongly — a check-out "at 11:00" would jump ahead
            // of the 09:00 ferry you actually leave on. They go in the note, and
            // the stop keeps its place as the day's first or last.
            if (!first) {
                Activity morning = base(b, day, ActivityType.ACCOMMODATION,
                        last ? "Check out · " + b.getName() : b.getName());
                if (last) morning.setNotes("Check-out by " + outTime);
                out.add(new Planned(day, morning, Slot.MORNING));
            }
            if (!last) {
                Activity evening = base(b, day, ActivityType.ACCOMMODATION,
                        first ? "Check in · " + b.getName() : "Overnight · " + b.getName());
                if (first) evening.setNotes("Check-in from " + in);
                out.add(new Planned(day, evening, Slot.EVENING));
                // The night is spent here, so the day can say so on its own.
                day.setOvernightStay(b.getName());
                day.setLinkedBookingId(b.getId());
                dayRepository.save(day);
            }
        }
    }

    private void addTransport(Booking b, Map<LocalDate, Day> byDate, List<Planned> out) {
        if (b.getDepartureAt() == null) return;
        Day day = byDate.get(b.getDepartureAt().toLocalDate());
        if (day == null) return;

        // A rental car is picked up, not travelled on: the day is not spent on the
        // move for as long as the rental runs, so the stop is an errand, not transport.
        boolean rental = b.getTransportMode() == TransportMode.CAR_RENTAL;
        Activity a = base(b, day, rental ? ActivityType.OTHER : ActivityType.TRANSPORT,
                rental ? "Pick up · " + b.getName() : b.getName());
        a.setStartTime(b.getDepartureAt().toLocalTime());
        if (rental && b.getFromLatitude() != null && b.getFromLongitude() != null) {
            a.setLatitude(b.getFromLatitude());
            a.setLongitude(b.getFromLongitude());
        }
        boolean sameDay = b.getArrivalAt() != null
                && b.getArrivalAt().toLocalDate().equals(b.getDepartureAt().toLocalDate());
        if (sameDay) a.setEndTime(b.getArrivalAt().toLocalTime());
        a.setAddress(rental ? b.getFromPlace() : route(b));
        a.setNotes(transportNote(b));
        if (rental) a.setEndTime(null); // picking up a car is a moment, not a span
        out.add(new Planned(day, a, Slot.TIMED));

        // A rental is returned: a stop on the day it goes back, where it goes back.
        if (rental && b.getArrivalAt() != null) {
            Day backDay = byDate.get(b.getArrivalAt().toLocalDate());
            if (backDay != null) {
                Activity drop = base(b, backDay, ActivityType.OTHER, "Drop off · " + b.getName());
                drop.setStartTime(b.getArrivalAt().toLocalTime());
                drop.setAddress(b.getToPlace() != null && !b.getToPlace().isBlank() ? b.getToPlace() : b.getFromPlace());
                if (b.getToLatitude() != null && b.getToLongitude() != null) {
                    drop.setLatitude(b.getToLatitude());
                    drop.setLongitude(b.getToLongitude());
                }
                out.add(new Planned(backDay, drop, Slot.TIMED));
            }
            return;
        }

        // An overnight leg also occupies the morning it lands.
        if (b.getArrivalAt() != null && !sameDay) {
            Day arrivalDay = byDate.get(b.getArrivalAt().toLocalDate());
            if (arrivalDay != null) {
                Activity arrive = base(b, arrivalDay, ActivityType.TRANSPORT,
                        "Arrive · " + (b.getToPlace() != null ? b.getToPlace() : b.getName()));
                arrive.setStartTime(b.getArrivalAt().toLocalTime());
                arrive.setAddress(route(b));
                out.add(new Planned(arrivalDay, arrive, Slot.TIMED));
            }
        }
    }

    private String route(Booking b) {
        if (b.getFromPlace() == null && b.getToPlace() == null) return b.getAddress();
        return (b.getFromPlace() == null ? "?" : b.getFromPlace())
                + " → " + (b.getToPlace() == null ? "?" : b.getToPlace());
    }

    private String transportNote(Booking b) {
        List<String> parts = new ArrayList<>();
        if (b.getFlightNumber() != null && !b.getFlightNumber().isBlank()) parts.add(b.getFlightNumber());
        if (b.getSeat() != null && !b.getSeat().isBlank()) parts.add("seat " + b.getSeat());
        if (b.getConfirmationNumber() != null && !b.getConfirmationNumber().isBlank()) {
            parts.add("ref " + b.getConfirmationNumber());
        }
        return parts.isEmpty() ? null : String.join(" · ", parts);
    }

    private Activity base(Booking b, Day day, ActivityType type, String name) {
        Activity a = new Activity();
        a.setDay(day);
        a.setName(name);
        a.setType(type);
        a.setSourceBookingId(b.getId());
        a.setLatitude(b.getLatitude());
        a.setLongitude(b.getLongitude());
        if (b.getCategory() == BookingCategory.ACCOMMODATION) {
            a.setAddress(b.getAddress() != null ? b.getAddress() : b.getAccommodationCity());
        }
        a.setOrderIndex(0);
        return a;
    }

    /**
     * One pass over a day: generated brackets outside, everything else in the
     * middle ordered by time. Hand-made stops without a time keep their order
     * and follow the timed ones.
     */
    private void reorder(UUID dayId, List<Planned> generated) {
        Map<UUID, Slot> slotOf = new HashMap<>();
        for (Planned p : generated) slotOf.put(p.activity.getId(), p.slot);

        List<Activity> all = activityRepository.findByDayIdOrderByOrderIndexAscIdAsc(dayId);
        List<Activity> morning = new ArrayList<>();
        List<Activity> middle = new ArrayList<>();
        List<Activity> evening = new ArrayList<>();
        for (Activity a : all) {
            Slot s = slotOf.get(a.getId());
            if (s == Slot.MORNING) morning.add(a);
            else if (s == Slot.EVENING) evening.add(a);
            else middle.add(a);
        }
        middle.sort(Comparator.comparing(Activity::getStartTime,
                Comparator.nullsLast(Comparator.naturalOrder())));

        int i = 0;
        for (Activity a : morning) a.setOrderIndex(i++);
        for (Activity a : middle) a.setOrderIndex(i++);
        for (Activity a : evening) a.setOrderIndex(i++);
        activityRepository.saveAll(all);
    }

    private record Planned(Day day, Activity activity, Slot slot) {}
}
