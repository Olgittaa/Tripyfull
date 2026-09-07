package com.tripyfull.repository;

import com.tripyfull.model.TodoItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TodoRepository extends JpaRepository<TodoItem, UUID> {
    List<TodoItem> findByTripIdOrderByOrderIndexAscCreatedAtAsc(UUID tripId);

    /** Suggestion keys already in the list, so the picker offers only the rest. */
    List<TodoItem> findByTripIdAndTemplateKeyIsNotNull(UUID tripId);
}
