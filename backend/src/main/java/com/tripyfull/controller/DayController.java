package com.tripyfull.controller;

import com.tripyfull.dto.DayRequest;
import com.tripyfull.dto.DayResponse;
import com.tripyfull.service.DayService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class DayController {

    private final DayService dayService;

    public DayController(DayService dayService) {
        this.dayService = dayService;
    }

    @GetMapping("/api/trips/{tripId}/days")
    public List<DayResponse> getDays(@PathVariable UUID tripId,
                                     @AuthenticationPrincipal UserDetails user) {
        return dayService.getDays(tripId, user.getUsername());
    }

    @PostMapping("/api/trips/{tripId}/days")
    @ResponseStatus(HttpStatus.CREATED)
    public List<DayResponse> generateDays(@PathVariable UUID tripId,
                                          @AuthenticationPrincipal UserDetails user) {
        return dayService.generateDays(tripId, user.getUsername());
    }

    @PatchMapping("/api/days/{dayId}")
    public DayResponse updateDay(@PathVariable UUID dayId,
                                 @RequestBody DayRequest request,
                                 @AuthenticationPrincipal UserDetails user) {
        return dayService.updateDay(dayId, request, user.getUsername());
    }

    /** Swaps the plans (activities, city, stay, notes, buffer flag) of two days of a trip. */
    @PostMapping("/api/trips/{tripId}/days/{dayId}/swap/{otherDayId}")
    public List<DayResponse> swapDays(@PathVariable UUID tripId,
                                      @PathVariable UUID dayId,
                                      @PathVariable UUID otherDayId,
                                      @AuthenticationPrincipal UserDetails user) {
        return dayService.swapDays(tripId, dayId, otherDayId, user.getUsername());
    }
}
