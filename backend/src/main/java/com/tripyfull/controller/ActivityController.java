package com.tripyfull.controller;

import com.tripyfull.dto.ActivityRequest;
import com.tripyfull.dto.ActivityResponse;
import com.tripyfull.dto.ReorderRequest;
import com.tripyfull.service.ActivityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ActivityController {

    private final ActivityService activityService;

    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @GetMapping("/api/days/{dayId}/itinerary")
    public List<ActivityResponse> getActivities(@PathVariable UUID dayId,
                                                @AuthenticationPrincipal UserDetails user) {
        return activityService.getActivities(dayId, user.getUsername());
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
