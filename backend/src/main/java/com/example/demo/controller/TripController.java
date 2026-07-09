package com.example.demo.controller;

import com.example.demo.dto.TripRequest;
import com.example.demo.dto.TripResponse;
import com.example.demo.service.TripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final TripService tripService;

    public TripController(TripService tripService) {
        this.tripService = tripService;
    }

    @GetMapping
    public List<TripResponse> getAll(@AuthenticationPrincipal UserDetails user) {
        return tripService.getAll(user.getUsername());
    }

    @GetMapping("/{id}")
    public TripResponse getById(@PathVariable UUID id,
                                @AuthenticationPrincipal UserDetails user) {
        return tripService.getById(id, user.getUsername());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TripResponse create(@Valid @RequestBody TripRequest request,
                               @AuthenticationPrincipal UserDetails user) {
        return tripService.create(request, user.getUsername());
    }

    @PatchMapping("/{id}")
    public TripResponse update(@PathVariable UUID id,
                               @RequestBody TripRequest request,
                               @AuthenticationPrincipal UserDetails user) {
        return tripService.update(id, request, user.getUsername());
    }

    @GetMapping("/{id}/countries")
    public List<String> countries(@PathVariable UUID id,
                                  @AuthenticationPrincipal UserDetails user) {
        return tripService.getCountries(id, user.getUsername());
    }

    @PostMapping("/{id}/reschedule")
    public TripResponse reschedule(@PathVariable UUID id,
                                   @Valid @RequestBody TripRequest request,
                                   @AuthenticationPrincipal UserDetails user) {
        return tripService.reschedule(id, request, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id,
                       @AuthenticationPrincipal UserDetails user) {
        tripService.delete(id, user.getUsername());
    }
}
