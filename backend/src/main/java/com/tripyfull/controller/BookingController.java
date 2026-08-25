package com.tripyfull.controller;

import com.tripyfull.dto.BookingRequest;
import com.tripyfull.dto.BookingResponse;
import com.tripyfull.dto.PaymentRequest;
import com.tripyfull.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/api/trips/{tripId}/bookings")
    public List<BookingResponse> getBookings(@PathVariable UUID tripId,
                                             @AuthenticationPrincipal UserDetails user) {
        return bookingService.getBookings(tripId, user.getUsername());
    }

    @PostMapping("/api/trips/{tripId}/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse create(@PathVariable UUID tripId,
                                  @Valid @RequestBody BookingRequest request,
                                  @AuthenticationPrincipal UserDetails user) {
        return bookingService.create(tripId, request, user.getUsername());
    }

    @PatchMapping("/api/bookings/{id}")
    public BookingResponse update(@PathVariable UUID id,
                                  @RequestBody BookingRequest request,
                                  @AuthenticationPrincipal UserDetails user) {
        return bookingService.update(id, request, user.getUsername());
    }

    @DeleteMapping("/api/bookings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id,
                       @AuthenticationPrincipal UserDetails user) {
        bookingService.delete(id, user.getUsername());
    }

    @PostMapping("/api/bookings/{id}/payments")
    public BookingResponse addPayment(@PathVariable UUID id,
                                      @Valid @RequestBody PaymentRequest request,
                                      @AuthenticationPrincipal UserDetails user) {
        return bookingService.addPayment(id, request, user.getUsername());
    }

    @PatchMapping("/api/payments/{id}")
    public BookingResponse updatePayment(@PathVariable UUID id,
                                          @RequestBody PaymentRequest request,
                                          @AuthenticationPrincipal UserDetails user) {
        return bookingService.updatePayment(id, request, user.getUsername());
    }

    @DeleteMapping("/api/payments/{id}")
    public BookingResponse deletePayment(@PathVariable UUID id,
                                          @AuthenticationPrincipal UserDetails user) {
        return bookingService.deletePayment(id, user.getUsername());
    }

    @PatchMapping("/api/payments/{id}/paid")
    public BookingResponse markPaid(@PathVariable UUID id,
                                    @AuthenticationPrincipal UserDetails user) {
        return bookingService.markPaymentPaid(id, user.getUsername());
    }

    @PatchMapping("/api/payments/{id}/unpaid")
    public BookingResponse markUnpaid(@PathVariable UUID id,
                                      @AuthenticationPrincipal UserDetails user) {
        return bookingService.markPaymentUnpaid(id, user.getUsername());
    }
}
