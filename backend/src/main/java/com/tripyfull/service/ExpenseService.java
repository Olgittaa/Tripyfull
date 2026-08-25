package com.tripyfull.service;

import com.tripyfull.dto.ExpenseRequest;
import com.tripyfull.dto.ExpenseResponse;
import com.tripyfull.model.Day;
import com.tripyfull.model.Expense;
import com.tripyfull.model.ExpenseCategory;
import com.tripyfull.repository.ExpenseRepository;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final OwnershipGuard guard;

    public ExpenseService(ExpenseRepository expenseRepository, OwnershipGuard guard) {
        this.expenseRepository = expenseRepository;
        this.guard = guard;
    }

    public List<ExpenseResponse> getExpenses(UUID dayId, String username) {
        findDayForUser(dayId, username);
        return expenseRepository.findByDayIdOrderByIdAsc(dayId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ExpenseResponse create(UUID dayId, ExpenseRequest request, String username) {
        Day day = findDayForUser(dayId, username);
        Expense expense = new Expense();
        expense.setDay(day);
        if (request.category() != null) expense.setCategory(ExpenseCategory.valueOf(request.category()));
        expense.setAmount(request.amount());
        expense.setCurrency(request.currency());
        expense.setDescription(request.description());
        return toResponse(expenseRepository.save(expense));
    }

    public void delete(UUID expenseId, String username) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expense not found"));
        findDayForUser(expense.getDay().getId(), username);
        expenseRepository.delete(expense);
    }

    private Day findDayForUser(UUID dayId, String username) {
        return guard.requireDay(dayId, username);
    }

    private ExpenseResponse toResponse(Expense e) {
        return new ExpenseResponse(e.getId(), e.getCategory() != null ? e.getCategory().name() : null, e.getAmount(), e.getCurrency(), e.getDescription());
    }
}
