package com.tripyfull.controller;

import com.tripyfull.dto.ExportResponse;
import com.tripyfull.model.*;
import com.tripyfull.repository.*;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ExportController {

    private final DayRepository dayRepository;
    private final BookingRepository bookingRepository;
    private final OwnershipGuard guard;

    public ExportController(DayRepository dayRepository, BookingRepository bookingRepository,
                            OwnershipGuard guard) {
        this.dayRepository = dayRepository;
        this.bookingRepository = bookingRepository;
        this.guard = guard;
    }

    @GetMapping("/api/trips/{tripId}/export")
    public ExportResponse export(@PathVariable UUID tripId,
                                  @AuthenticationPrincipal UserDetails user) {
        Trip trip = guard.requireTrip(tripId, user.getUsername());

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
