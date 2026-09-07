package com.tripyfull.service;

import com.tripyfull.dto.TodoFromSuggestionsRequest;
import com.tripyfull.dto.TodoRequest;
import com.tripyfull.dto.TodoResponse;
import com.tripyfull.dto.TodoSuggestionResponse;
import com.tripyfull.model.TodoItem;
import com.tripyfull.model.Trip;
import com.tripyfull.repository.TodoRepository;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class TodoService {

    private final TodoRepository todoRepository;
    private final OwnershipGuard guard;

    public TodoService(TodoRepository todoRepository, OwnershipGuard guard) {
        this.todoRepository = todoRepository;
        this.guard = guard;
    }

    public List<TodoResponse> list(UUID tripId, String username) {
        guard.requireTrip(tripId, username);
        return todoRepository.findByTripIdOrderByOrderIndexAscCreatedAtAsc(tripId).stream()
                .map(TodoService::toResponse)
                .toList();
    }

    public TodoResponse create(UUID tripId, TodoRequest req, String username) {
        Trip trip = guard.requireTrip(tripId, username);
        if (req.title() == null || req.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A to-do needs a title");
        }
        TodoItem t = new TodoItem();
        t.setTrip(trip);
        t.setTitle(req.title().trim());
        t.setNotes(req.notes());
        t.setGroupName(cleanGroup(req.groupName()));
        t.setDueDate(req.dueDate());
        t.setDone(Boolean.TRUE.equals(req.done()));
        t.setOrderIndex(req.orderIndex() != null ? req.orderIndex() : nextOrder(tripId));
        return toResponse(todoRepository.save(t));
    }

    public TodoResponse update(UUID id, TodoRequest req, String username) {
        TodoItem t = findOwned(id, username);
        if (req.title() != null) {
            if (req.title().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A to-do needs a title");
            }
            t.setTitle(req.title().trim());
        }
        if (req.notes() != null) t.setNotes(req.notes());
        if (req.groupName() != null) t.setGroupName(cleanGroup(req.groupName()));
        if (Boolean.TRUE.equals(req.clearDueDate())) t.setDueDate(null);
        else if (req.dueDate() != null) t.setDueDate(req.dueDate());
        if (req.done() != null) t.setDone(req.done());
        if (req.orderIndex() != null) t.setOrderIndex(req.orderIndex());
        return toResponse(todoRepository.save(t));
    }

    public void delete(UUID id, String username) {
        todoRepository.delete(findOwned(id, username));
    }

    /** Built-in to-dos not yet on this trip's list, dated against the trip. */
    public List<TodoSuggestionResponse> suggestions(UUID tripId, String username) {
        Trip trip = guard.requireTrip(tripId, username);
        Set<String> taken = new HashSet<>();
        for (TodoItem t : todoRepository.findByTripIdAndTemplateKeyIsNotNull(tripId)) {
            taken.add(t.getTemplateKey());
        }
        List<TodoSuggestionResponse> out = new ArrayList<>();
        for (TodoSuggestions.Template tpl : TodoSuggestions.ALL) {
            if (taken.contains(tpl.key())) continue;
            out.add(new TodoSuggestionResponse(tpl.key(), tpl.title(), tpl.group(), tpl.why(),
                    dueFor(tpl, trip)));
        }
        return out;
    }

    public List<TodoResponse> addSuggestions(UUID tripId, TodoFromSuggestionsRequest req, String username) {
        Trip trip = guard.requireTrip(tripId, username);
        Set<String> wanted = new HashSet<>(req.keys() == null ? List.of() : req.keys());
        Set<String> taken = new HashSet<>();
        for (TodoItem t : todoRepository.findByTripIdAndTemplateKeyIsNotNull(tripId)) {
            taken.add(t.getTemplateKey());
        }
        int order = nextOrder(tripId);
        List<TodoItem> created = new ArrayList<>();
        for (TodoSuggestions.Template tpl : TodoSuggestions.ALL) {
            if (!wanted.contains(tpl.key()) || taken.contains(tpl.key())) continue;
            TodoItem t = new TodoItem();
            t.setTrip(trip);
            t.setTitle(tpl.title());
            t.setNotes(tpl.why());
            t.setGroupName(tpl.group());
            t.setDueDate(dueFor(tpl, trip));
            t.setTemplateKey(tpl.key());
            t.setOrderIndex(order++);
            created.add(t);
        }
        return todoRepository.saveAll(created).stream().map(TodoService::toResponse).toList();
    }

    /** The template's offset applied to this trip; null when the trip has no dates yet. */
    private LocalDate dueFor(TodoSuggestions.Template tpl, Trip trip) {
        LocalDate anchor = tpl.afterEnd() ? trip.getEndDate() : trip.getStartDate();
        if (anchor == null) return null;
        return anchor.plusDays(tpl.offsetDays());
    }

    private int nextOrder(UUID tripId) {
        return todoRepository.findByTripIdOrderByOrderIndexAscCreatedAtAsc(tripId).size();
    }

    private String cleanGroup(String g) {
        if (g == null) return null;
        String s = g.trim();
        return s.isEmpty() ? null : s;
    }

    private TodoItem findOwned(UUID id, String username) {
        TodoItem t = todoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "To-do not found"));
        guard.requireTrip(t.getTrip().getId(), username);
        return t;
    }

    static TodoResponse toResponse(TodoItem t) {
        return new TodoResponse(t.getId(), t.getTitle(), t.getNotes(), t.getGroupName(),
                t.getDueDate(), t.isDone(), t.getOrderIndex(), t.getTemplateKey());
    }
}
