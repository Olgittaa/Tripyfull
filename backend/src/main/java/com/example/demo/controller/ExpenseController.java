package com.example.demo.controller;

import com.example.demo.dto.ExpenseRequest;
import com.example.demo.dto.ExpenseResponse;
import com.example.demo.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping("/api/days/{dayId}/expenses")
    public List<ExpenseResponse> getExpenses(@PathVariable UUID dayId,
                                             @AuthenticationPrincipal UserDetails user) {
        return expenseService.getExpenses(dayId, user.getUsername());
    }

    @PostMapping("/api/days/{dayId}/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseResponse create(@PathVariable UUID dayId,
                                  @Valid @RequestBody ExpenseRequest request,
                                  @AuthenticationPrincipal UserDetails user) {
        return expenseService.create(dayId, request, user.getUsername());
    }

    @DeleteMapping("/api/expenses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id,
                       @AuthenticationPrincipal UserDetails user) {
        expenseService.delete(id, user.getUsername());
    }
}
