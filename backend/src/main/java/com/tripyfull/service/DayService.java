package com.tripyfull.service;

import com.tripyfull.dto.DayRequest;
import com.tripyfull.dto.DayResponse;
import com.tripyfull.mapper.DayMapper;
import com.tripyfull.model.Activity;
import com.tripyfull.model.Day;
import com.tripyfull.model.Trip;
import com.tripyfull.repository.ActivityRepository;
import com.tripyfull.repository.DayRepository;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class DayService {

    private final DayRepository dayRepository;
    private final ActivityRepository activityRepository;
    private final OwnershipGuard guard;

    public DayService(DayRepository dayRepository, ActivityRepository activityRepository,
                      OwnershipGuard guard) {
        this.dayRepository = dayRepository;
        this.activityRepository = activityRepository;
        this.guard = guard;
    }

    public List<DayResponse> getDays(UUID tripId, String username) {
        Trip trip = findTripForUser(tripId, username);
        List<Day> days = dayRepository.findByTripIdOrderByDateAsc(trip.getId());
        return DayMapper.toResponseList(days);
    }

    public List<DayResponse> generateDays(UUID tripId, String username) {
        Trip trip = findTripForUser(tripId, username);

        if (trip.getStartDate() == null || trip.getEndDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trip must have start and end dates");
        }

        // Backfill-only: regenerating over existing days would wipe their activities
        // and expenses. Date changes go through the reschedule flow, which preserves content.
        if (dayRepository.existsByTripId(tripId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Days already exist — change the trip dates to reshape them");
        }

        List<Day> days = new ArrayList<>();
        LocalDate current = trip.getStartDate();
        while (!current.isAfter(trip.getEndDate())) {
            Day day = new Day();
            day.setTrip(trip);
            day.setDate(current);
            days.add(day);
            current = current.plusDays(1);
        }

        List<Day> saved = dayRepository.saveAll(days);
        return DayMapper.toResponseList(saved);
    }

    /**
     * A reserve day: belongs to the trip but has no date, so it sits outside the
     * numbered sequence and costs the plan nothing. Its content is moved into a
     * real day with a swap once the plan changes.
     */
    public List<DayResponse> addBufferDay(UUID tripId, String username) {
        Trip trip = findTripForUser(tripId, username);
        Day day = new Day();
        day.setTrip(trip);
        day.setDate(null);
        day.setBuffer(true);
        dayRepository.save(day);
        return DayMapper.toResponseList(dayRepository.findByTripIdOrderByDateAsc(trip.getId()));
    }

    /** Only reserve days can be removed — dated ones follow the trip's dates. */
    public void deleteDay(UUID dayId, String username) {
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Day not found"));
        findTripForUser(day.getTrip().getId(), username);
        if (day.getDate() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A dated day cannot be removed — change the trip dates instead");
        }
        dayRepository.delete(day);
    }

    public DayResponse updateDay(UUID dayId, DayRequest request, String username) {
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Day not found"));

        findTripForUser(day.getTrip().getId(), username);

        if (request.city() != null) day.setCity(request.city());
        if (request.overnightStay() != null) day.setOvernightStay(request.overnightStay());
        if (request.linkedBookingId() != null) day.setLinkedBookingId(request.linkedBookingId());
        if (Boolean.TRUE.equals(request.clearLinkedBooking())) day.setLinkedBookingId(null);
        if (request.notes() != null) day.setNotes(request.notes());
        if (request.isBuffer() != null) day.setBuffer(request.isBuffer());

        Day saved = dayRepository.save(day);
        List<Day> allDays = dayRepository.findByTripIdOrderByDateAsc(saved.getTrip().getId());
        int dayNumber = allDays.indexOf(saved) + 1;
        return DayMapper.toResponse(saved, dayNumber);
    }

    /**
     * Swaps the PLANS of two days of the same trip: activities, city, overnight stay,
     * notes and the buffer flag move between the dates. Date-bound data stays put —
     * expenses (actual spending) and the linked overnight booking belong to the date.
     */
    public List<DayResponse> swapDays(UUID tripId, UUID dayId, UUID otherDayId, String username) {
        Trip trip = findTripForUser(tripId, username);
        Day a = findDayOfTrip(dayId, trip);
        Day b = findDayOfTrip(otherDayId, trip);
        if (a.getId().equals(b.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot swap a day with itself");
        }

        // Re-parent via the owning side (Activity.day) only. Never through the Day
        // collections: they carry orphanRemoval, and clearing them deletes the rows.
        List<Activity> fromA = activityRepository.findByDayIdOrderByOrderIndexAscIdAsc(a.getId());
        List<Activity> fromB = activityRepository.findByDayIdOrderByOrderIndexAscIdAsc(b.getId());
        for (Activity act : fromA) act.setDay(b);
        for (Activity act : fromB) act.setDay(a);
        activityRepository.saveAll(fromA);
        activityRepository.saveAll(fromB);

        String city = a.getCity(); a.setCity(b.getCity()); b.setCity(city);
        String stay = a.getOvernightStay(); a.setOvernightStay(b.getOvernightStay()); b.setOvernightStay(stay);
        String notes = a.getNotes(); a.setNotes(b.getNotes()); b.setNotes(notes);
        // Between a dated day and a reserve day the flag stays put: the reserve
        // remains the reserve, the dated day remains part of the plan. Only the
        // content moves. Between two dated days the flag travels with the plan.
        if ((a.getDate() == null) == (b.getDate() == null)) {
            boolean buffer = a.isBuffer(); a.setBuffer(b.isBuffer()); b.setBuffer(buffer);
        }

        dayRepository.save(a);
        dayRepository.save(b);
        return DayMapper.toResponseList(dayRepository.findByTripIdOrderByDateAsc(tripId));
    }

    private Day findDayOfTrip(UUID dayId, Trip trip) {
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Day not found"));
        if (!day.getTrip().getId().equals(trip.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Day not found");
        }
        return day;
    }

    private Trip findTripForUser(UUID tripId, String username) {
        return guard.requireTrip(tripId, username);
    }
}
