package com.example.demo.service;

import com.example.demo.dto.TripRequest;
import com.example.demo.dto.TripResponse;
import com.example.demo.mapper.TripMapper;
import com.example.demo.model.Activity;
import com.example.demo.model.Trip;
import com.example.demo.model.User;
import com.example.demo.model.Day;
import com.example.demo.repository.TripRepository;
import com.example.demo.repository.UserRepository;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class TripService {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final GeocodingService geocodingService;

    public TripService(TripRepository tripRepository, UserRepository userRepository,
                       GeocodingService geocodingService) {
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
        this.geocodingService = geocodingService;
    }

    /** ISO country codes relevant to a trip: from its activities' linked places, plus its destination. */
    public List<String> getCountries(UUID id, String username) {
        Trip trip = findTripForUser(id, username);
        LinkedHashSet<String> codes = new LinkedHashSet<>();
        for (Day day : trip.getDays()) {
            for (Activity a : day.getActivities()) {
                if (a.getPlace() != null && a.getPlace().getCountry() != null && !a.getPlace().getCountry().isBlank()) {
                    codes.add(a.getPlace().getCountry().toUpperCase());
                }
            }
        }
        if (trip.getDestination() != null && !trip.getDestination().isBlank()) {
            try {
                GeocodingService.GeocodeResult r = geocodingService.geocode(trip.getDestination(), null);
                if (r != null && r.country() != null && !r.country().isBlank()) {
                    codes.add(r.country().toUpperCase());
                }
            } catch (Exception ignored) {
                // best-effort
            }
        }
        return new ArrayList<>(codes);
    }

    public List<TripResponse> getAll(String username) {
        User user = getUser(username);
        return tripRepository.findByOwnerId(user.getId()).stream()
                .map(TripMapper::toResponse)
                .toList();
    }

    public TripResponse getById(UUID id, String username) {
        Trip trip = findTripForUser(id, username);
        return TripMapper.toResponse(trip);
    }

    public TripResponse create(TripRequest request, String username) {
        User user = getUser(username);
        Trip trip = TripMapper.toEntity(request);
        trip.setOwner(user);
        generateDaysIfMissing(trip);
        return TripMapper.toResponse(tripRepository.save(trip));
    }

    public TripResponse update(UUID id, TripRequest request, String username) {
        Trip trip = findTripForUser(id, username);
        TripMapper.updateEntity(trip, request);
        // Dates set on a trip that had none (or a legacy trip without days) —
        // days appear automatically, exactly like on create. Date CHANGES on a
        // trip that already has days go through reschedule() instead.
        generateDaysIfMissing(trip);
        return TripMapper.toResponse(tripRepository.save(trip));
    }

    /** One empty Day per date in [start, end] — only when the trip has no days yet. */
    private void generateDaysIfMissing(Trip trip) {
        if (trip.getStartDate() == null || trip.getEndDate() == null) return;
        if (!trip.getDays().isEmpty()) return;
        LocalDate current = trip.getStartDate();
        while (!current.isAfter(trip.getEndDate())) {
            Day day = new Day();
            day.setTrip(trip);
            day.setDate(current);
            trip.getDays().add(day);
            current = current.plusDays(1);
        }
    }

    /**
     * Moves the trip to a new date range while keeping the itinerary intact:
     * every day is shifted by the same delta as the start date (so day 1 lands on
     * the new start date and the order/content of days is preserved), days that fall
     * outside the new range are deleted (their activities go with them), and any
     * uncovered dates inside the new range are filled with empty days. Bookings and
     * payment schedules are intentionally left untouched.
     */
    public TripResponse reschedule(UUID id, TripRequest request, String username) {
        Trip trip = findTripForUser(id, username);

        LocalDate newStart = request.startDate();
        LocalDate newEnd = request.endDate();
        if (newStart == null || newEnd == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start and end dates are required");
        }
        if (newEnd.isBefore(newStart)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date cannot be before start date");
        }

        List<Day> days = trip.getDays();

        // Anchor point for the shift: the current start date, falling back to the
        // earliest existing day if the trip never had a start date.
        LocalDate anchor = trip.getStartDate();
        if (anchor == null && !days.isEmpty()) {
            anchor = days.stream().map(Day::getDate).min(LocalDate::compareTo).orElse(null);
        }

        if (anchor != null && !days.isEmpty()) {
            long delta = ChronoUnit.DAYS.between(anchor, newStart);
            if (delta != 0) {
                for (Day day : days) {
                    day.setDate(day.getDate().plusDays(delta));
                }
            }
            // Drop days that no longer fit the new range (orphanRemoval deletes them + their activities).
            days.removeIf(day -> day.getDate().isBefore(newStart) || day.getDate().isAfter(newEnd));

            // Fill any uncovered dates inside the new range with empty days.
            Set<LocalDate> covered = new HashSet<>();
            for (Day day : days) covered.add(day.getDate());
            LocalDate current = newStart;
            while (!current.isAfter(newEnd)) {
                if (!covered.contains(current)) {
                    Day day = new Day();
                    day.setTrip(trip);
                    day.setDate(current);
                    days.add(day);
                }
                current = current.plusDays(1);
            }
        }

        // Apply the new dates plus any other edited metadata (title, destination, status, ...).
        TripMapper.updateEntity(trip, request);
        return TripMapper.toResponse(tripRepository.save(trip));
    }

    public void delete(UUID id, String username) {
        Trip trip = findTripForUser(id, username);
        tripRepository.delete(trip);
    }

    private Trip findTripForUser(UUID id, String username) {
        User user = getUser(username);
        return tripRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
