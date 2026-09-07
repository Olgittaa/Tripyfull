package com.tripyfull.controller;

import com.tripyfull.dto.ExportResponse;
import com.tripyfull.model.Activity;
import com.tripyfull.model.Booking;
import com.tripyfull.model.Day;
import com.tripyfull.model.Payment;
import com.tripyfull.model.Place;
import com.tripyfull.model.TodoItem;
import com.tripyfull.model.Trip;
import com.tripyfull.repository.BookingRepository;
import com.tripyfull.repository.DayRepository;
import com.tripyfull.repository.TodoRepository;
import com.tripyfull.security.OwnershipGuard;
import com.tripyfull.service.PlacePhotoService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
public class ExportController {

    private final DayRepository dayRepository;
    private final BookingRepository bookingRepository;
    private final TodoRepository todoRepository;
    private final PlacePhotoService placePhotoService;
    private final OwnershipGuard guard;

    public ExportController(DayRepository dayRepository, BookingRepository bookingRepository,
                            TodoRepository todoRepository, PlacePhotoService placePhotoService,
                            OwnershipGuard guard) {
        this.dayRepository = dayRepository;
        this.bookingRepository = bookingRepository;
        this.todoRepository = todoRepository;
        this.placePhotoService = placePhotoService;
        this.guard = guard;
    }

    @GetMapping("/api/trips/{tripId}/export")
    @Transactional(readOnly = true)
    public ExportResponse export(@PathVariable UUID tripId, @AuthenticationPrincipal UserDetails user) {
        Trip trip = guard.requireTrip(tripId, user.getUsername());
        List<Day> days = dayRepository.findByTripIdOrderByDateAsc(tripId);
        List<Booking> bookings = bookingRepository.findByTripIdOrderByNameAsc(tripId);

        List<ExportResponse.ExportDay> exportDays = new ArrayList<>();
        for (int i = 0; i < days.size(); i++) {
            Day day = days.get(i);
            List<ExportResponse.ExportActivity> activities = day.getActivities().stream()
                    .sorted(Comparator.comparingInt(Activity::getOrderIndex))
                    .map(this::toActivity)
                    .toList();
            exportDays.add(new ExportResponse.ExportDay(i + 1, day.getDate(), day.getCity(),
                    day.getOvernightStay(), day.isBuffer(), day.getNotes(), activities));
        }

        List<ExportResponse.ExportBooking> exportBookings = bookings.stream()
                .map(this::toBooking)
                .toList();

        List<ExportResponse.ExportTodo> todos = todoRepository
                .findByTripIdOrderByOrderIndexAscCreatedAtAsc(tripId).stream()
                .map(t -> new ExportResponse.ExportTodo(t.getTitle(), t.getGroupName(), t.getDueDate(), t.isDone()))
                .toList();

        List<ExportResponse.ExportPlace> places = trip.getPlaces().stream()
                .sorted(Comparator.comparingInt(Place::getRating).reversed().thenComparing(Place::getName))
                .map(p -> new ExportResponse.ExportPlace(p.getName(),
                        p.getType() != null ? p.getType().name() : null, p.getRating(), p.getCity(),
                        p.getLatitude() != null ? p.getLatitude().doubleValue() : null,
                        p.getLongitude() != null ? p.getLongitude().doubleValue() : null,
                        photosOf(p)))
                .toList();

        return new ExportResponse(trip.getTitle(), trip.getDestination(), trip.getStartDate(),
                trip.getEndDate(), trip.getBaseCurrency(), exportDays, exportBookings, todos, places);
    }

    private ExportResponse.ExportActivity toActivity(Activity a) {
        Place p = a.getPlace();
        return new ExportResponse.ExportActivity(
                a.getName(), a.getType() != null ? a.getType().name() : null,
                a.getStartTime(), a.getEndTime(), a.getAddress(),
                a.getCostEstimate(), a.getCostCurrency(), a.getNotes(),
                a.isNeedsBooking(), a.getSourceBookingId() != null, a.getTravelModeToNext(),
                coord(p != null ? p.getLatitude() : null, a.getLatitude()),
                coord(p != null ? p.getLongitude() : null, a.getLongitude()),
                p != null && p.getType() != null ? p.getType().name() : null,
                p != null ? p.getRating() : null,
                p != null ? p.getRatingComment() : null,
                p != null ? p.getDescription() : null,
                p != null ? p.getVisitMinutes() : null,
                p != null ? photosOf(p) : List.of(),
                p != null ? firstLink(p) : null);
    }

    /**
     * The place's coordinate when it has one, else the stop's own — which may be
     * null too. Kept as Double on both sides: a ternary mixing double and Double
     * unboxes, and a hand-made stop without coordinates took the whole export
     * down with a NullPointerException that surfaced as a 403.
     */
    private static Double coord(java.math.BigDecimal fromPlace, Double own) {
        return fromPlace != null ? Double.valueOf(fromPlace.doubleValue()) : own;
    }

    /**
     * Every photo the place has, the ones this app stores first: those always load,
     * while external links may have expired — the client checks each before it
     * prints anything.
     */
    private List<String> photosOf(Place p) {
        List<String> out = new ArrayList<>();
        for (String u : p.getPhotos()) if (placePhotoService.isStoredHere(u)) out.add(u);
        for (String u : p.getPhotos()) if (!placePhotoService.isStoredHere(u)) out.add(u);
        return out;
    }

    private static String firstLink(Place p) {
        return p.getLinks() == null || p.getLinks().isEmpty() ? null : p.getLinks().get(0);
    }

    private ExportResponse.ExportBooking toBooking(Booking b) {
        BigDecimal paidTotal = b.getPayments().stream()
                .filter(Payment::isPaid)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ExportResponse.ExportBooking(
                b.getName(), b.getCategory() != null ? b.getCategory().name() : null,
                b.getTransportMode() != null ? b.getTransportMode().name() : null,
                b.getVendor(), b.getConfirmationNumber(), b.getBookingUrl(),
                b.getFullPrice(), b.getPriceCurrency(), b.isPaidSimple(), paidTotal, b.getNotes(),
                b.getFromPlace(), b.getToPlace(), b.getDepartureAt(), b.getArrivalAt(),
                b.getFlightNumber(), b.getSeat(),
                b.getAccommodationCity(), b.getAddress(), b.getCheckIn(), b.getCheckOut(),
                b.getCheckInTime(), b.getCheckOutTime());
    }
}
