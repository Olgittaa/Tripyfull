package com.tripyfull.controller;

import com.tripyfull.dto.DayResponse;
import com.tripyfull.dto.PlanApplyRequest;
import com.tripyfull.dto.PlanRequest;
import com.tripyfull.dto.PlanResponse;
import com.tripyfull.service.TripPlanningService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/trips/{tripId}/plan")
public class PlanController {

    private final TripPlanningService planningService;

    public PlanController(TripPlanningService planningService) {
        this.planningService = planningService;
    }

    /** Computes a plan (clusters + routes). Read-only: nothing is written until /apply. */
    @PostMapping
    public PlanResponse plan(@PathVariable UUID tripId,
                             @RequestBody PlanRequest request,
                             @AuthenticationPrincipal UserDetails user) {
        return planningService.plan(tripId, request, user.getUsername());
    }

    /** Materializes a plan: appends the assigned places as activities on their days. */
    @PostMapping("/apply")
    public List<DayResponse> apply(@PathVariable UUID tripId,
                                   @RequestBody PlanApplyRequest request,
                                   @AuthenticationPrincipal UserDetails user) {
        return planningService.apply(tripId, request, user.getUsername());
    }
}
