package com.example.demo.controller;

import com.example.demo.dto.DayRequest;
import com.example.demo.dto.DayResponse;
import com.example.demo.service.DayService;
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
}
