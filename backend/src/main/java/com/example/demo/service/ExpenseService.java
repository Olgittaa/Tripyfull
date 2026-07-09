package com.example.demo.service;

import com.example.demo.dto.ExpenseRequest;
import com.example.demo.dto.ExpenseResponse;
import com.example.demo.model.Day;
import com.example.demo.model.Expense;
import com.example.demo.model.ExpenseCategory;
import com.example.demo.model.User;
import com.example.demo.repository.DayRepository;
import com.example.demo.repository.ExpenseRepository;
import com.example.demo.repository.TripRepository;
import com.example.demo.repository.UserRepository;
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
    private final DayRepository dayRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    public ExpenseService(ExpenseRepository expenseRepository, DayRepository dayRepository,
                          TripRepository tripRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.dayRepository = dayRepository;
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
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
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Day not found"));
        tripRepository.findByIdAndOwnerId(day.getTrip().getId(), user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
        return day;
    }

    private ExpenseResponse toResponse(Expense e) {
        return new ExpenseResponse(e.getId(), e.getCategory() != null ? e.getCategory().name() : null, e.getAmount(), e.getCurrency(), e.getDescription());
    }
}
