package com.tripyfull.controller;

import com.tripyfull.dto.ActivityRequest;
import com.tripyfull.dto.ActivityResponse;
import com.tripyfull.dto.PlanSyncResult;
import com.tripyfull.dto.PlannedPlaceResponse;
import com.tripyfull.dto.ReorderRequest;
import com.tripyfull.service.ActivityService;
import com.tripyfull.service.BookingPlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class ActivityController {

    private final ActivityService activityService;
    private final BookingPlanService bookingPlanService;

    public ActivityController(ActivityService activityService, BookingPlanService bookingPlanService) {
        this.activityService = activityService;
        this.bookingPlanService = bookingPlanService;
    }

    @GetMapping("/api/days/{dayId}/itinerary")
    public List<ActivityResponse> getActivities(@PathVariable UUID dayId,
                                                @AuthenticationPrincipal UserDetails user) {
        return activityService.getActivities(dayId, user.getUsername());
    }

    @GetMapping("/api/trips/{tripId}/planned-places")
    public List<PlannedPlaceResponse> getPlannedPlaces(@PathVariable UUID tripId,
                                                       @AuthenticationPrincipal UserDetails user) {
        return activityService.getPlannedPlaces(tripId, user.getUsername());
    }

    /** Writes the trip's bookings into the plan; safe to run again after a change. */
    @PostMapping("/api/trips/{tripId}/plan/from-bookings")
    public PlanSyncResult syncFromBookings(@PathVariable UUID tripId,
                                           @AuthenticationPrincipal UserDetails user) {
        return bookingPlanService.sync(tripId, user.getUsername());
    }

    /** How many stops already come from a booking — decides add vs. update. */
    @GetMapping("/api/trips/{tripId}/plan/from-bookings")
    public Map<String, Long> countFromBookings(@PathVariable UUID tripId,
                                               @AuthenticationPrincipal UserDetails user) {
        return Map.of("total", bookingPlanService.countGenerated(tripId, user.getUsername()));
    }

    @PostMapping("/api/days/{dayId}/activities")
    @ResponseStatus(HttpStatus.CREATED)
    public ActivityResponse create(@PathVariable UUID dayId,
                                   @Valid @RequestBody ActivityRequest request,
                                   @AuthenticationPrincipal UserDetails user) {
        return activityService.create(dayId, request, user.getUsername());
    }

    @PatchMapping("/api/activities/{id}")
    public ActivityResponse update(@PathVariable UUID id,
                                   @RequestBody ActivityRequest request,
                                   @AuthenticationPrincipal UserDetails user) {
        return activityService.update(id, request, user.getUsername());
    }

    @DeleteMapping("/api/activities/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id,
                       @AuthenticationPrincipal UserDetails user) {
        activityService.delete(id, user.getUsername());
    }

    @PatchMapping("/api/days/{dayId}/activities/reorder")
    public List<ActivityResponse> reorder(@PathVariable UUID dayId,
                                          @RequestBody ReorderRequest request,
                                          @AuthenticationPrincipal UserDetails user) {
        return activityService.reorder(dayId, request, user.getUsername());
    }
}
