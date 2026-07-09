package com.example.demo.controller;

import com.example.demo.dto.BudgetResponse;
import com.example.demo.service.BudgetService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping("/api/trips/{tripId}/budget")
    public BudgetResponse getBudget(@PathVariable UUID tripId,
                                    @AuthenticationPrincipal UserDetails user) {
        return budgetService.getBudget(tripId, user.getUsername());
    }
}
