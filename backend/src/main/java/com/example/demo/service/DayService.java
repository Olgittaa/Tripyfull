package com.example.demo.service;

import com.example.demo.dto.DayRequest;
import com.example.demo.dto.DayResponse;
import com.example.demo.mapper.DayMapper;
import com.example.demo.model.Day;
import com.example.demo.model.Trip;
import com.example.demo.model.User;
import com.example.demo.repository.DayRepository;
import com.example.demo.repository.TripRepository;
import com.example.demo.repository.UserRepository;
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
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    public DayService(DayRepository dayRepository, TripRepository tripRepository, UserRepository userRepository) {
        this.dayRepository = dayRepository;
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
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

    public DayResponse updateDay(UUID dayId, DayRequest request, String username) {
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Day not found"));

        findTripForUser(day.getTrip().getId(), username);

        if (request.city() != null) day.setCity(request.city());
        if (request.overnightStay() != null) day.setOvernightStay(request.overnightStay());
        if (request.linkedBookingId() != null) day.setLinkedBookingId(request.linkedBookingId());
        if (Boolean.TRUE.equals(request.clearLinkedBooking())) day.setLinkedBookingId(null);
        if (request.notes() != null) day.setNotes(request.notes());

        Day saved = dayRepository.save(day);
        List<Day> allDays = dayRepository.findByTripIdOrderByDateAsc(saved.getTrip().getId());
        int dayNumber = allDays.indexOf(saved) + 1;
        return DayMapper.toResponse(saved, dayNumber);
    }

    private Trip findTripForUser(UUID tripId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return tripRepository.findByIdAndOwnerId(tripId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
    }
}
