package com.example.demo.controller;

import com.example.demo.dto.ExportResponse;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
public class ExportController {

    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final DayRepository dayRepository;
    private final BookingRepository bookingRepository;

    public ExportController(TripRepository tripRepository, UserRepository userRepository,
                            DayRepository dayRepository, BookingRepository bookingRepository) {
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
        this.dayRepository = dayRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/api/trips/{tripId}/export")
    public ExportResponse export(@PathVariable UUID tripId,
                                  @AuthenticationPrincipal UserDetails user) {
        User u = userRepository.findByUsername(user.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        Trip trip = tripRepository.findByIdAndOwnerId(tripId, u.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        List<Day> days = dayRepository.findByTripIdOrderByDateAsc(tripId);
        List<Booking> bookings = bookingRepository.findByTripIdOrderByNameAsc(tripId);

        List<ExportResponse.ExportDay> exportDays = new java.util.ArrayList<>();
        for (int i = 0; i < days.size(); i++) {
            Day day = days.get(i);
            List<ExportResponse.ExportActivity> activities = day.getActivities().stream()
                    .map(a -> new ExportResponse.ExportActivity(
                            a.getName(), a.getType() != null ? a.getType().name() : null,
                            a.getStartTime(), a.getEndTime(), a.getAddress(),
                            a.getCostEstimate(), a.getNotes()))
                    .toList();
            exportDays.add(new ExportResponse.ExportDay(i + 1, day.getDate(), day.getCity(), activities));
        }

        List<ExportResponse.ExportBooking> exportBookings = bookings.stream()
                .map(b -> new ExportResponse.ExportBooking(
                        b.getName(), b.getCategory() != null ? b.getCategory().name() : null,
                        b.getVendor(), b.getFullPrice(), b.getNotes()))
                .toList();

        return new ExportResponse(trip.getTitle(), trip.getDestination(), trip.getStartDate(),
                trip.getEndDate(), trip.getBaseCurrency(), exportDays, exportBookings);
    }
}
