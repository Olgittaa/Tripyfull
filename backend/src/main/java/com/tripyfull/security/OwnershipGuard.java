package com.tripyfull.security;

import com.tripyfull.model.Day;
import com.tripyfull.model.Trip;
import com.tripyfull.model.User;
import com.tripyfull.repository.DayRepository;
import com.tripyfull.repository.TripRepository;
import com.tripyfull.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Single home for the "resolve user → load entity → verify trip ownership" chain
 * that every service needs. Missing entities and foreign ownership both surface
 * as 404 so record existence is never leaked to other users.
 */
@Component
public class OwnershipGuard {

    private final UserRepository userRepository;
    private final TripRepository tripRepository;
    private final DayRepository dayRepository;

    public OwnershipGuard(UserRepository userRepository, TripRepository tripRepository,
                          DayRepository dayRepository) {
        this.userRepository = userRepository;
        this.tripRepository = tripRepository;
        this.dayRepository = dayRepository;
    }

    public User requireUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    public Trip requireTrip(UUID tripId, String username) {
        return requireTrip(tripId, requireUser(username));
    }

    public Trip requireTrip(UUID tripId, User user) {
        return tripRepository.findByIdAndOwnerId(tripId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
    }

    public Day requireDay(UUID dayId, String username) {
        User user = requireUser(username);
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Day not found"));
        requireTrip(day.getTrip().getId(), user);
        return day;
    }
}
