package com.tripyfull.repository;

import com.tripyfull.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findByDayIdOrderByIdAsc(UUID dayId);
    List<Expense> findByDayTripId(UUID tripId);
}
