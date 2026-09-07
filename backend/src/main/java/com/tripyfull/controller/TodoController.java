package com.tripyfull.controller;

import com.tripyfull.dto.TodoFromSuggestionsRequest;
import com.tripyfull.dto.TodoRequest;
import com.tripyfull.dto.TodoResponse;
import com.tripyfull.dto.TodoSuggestionResponse;
import com.tripyfull.service.TodoService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping("/api/trips/{tripId}/todos")
    public List<TodoResponse> list(@PathVariable UUID tripId, @AuthenticationPrincipal UserDetails user) {
        return todoService.list(tripId, user.getUsername());
    }

    @PostMapping("/api/trips/{tripId}/todos")
    @ResponseStatus(HttpStatus.CREATED)
    public TodoResponse create(@PathVariable UUID tripId, @RequestBody TodoRequest request,
                               @AuthenticationPrincipal UserDetails user) {
        return todoService.create(tripId, request, user.getUsername());
    }

    @PatchMapping("/api/todos/{id}")
    public TodoResponse update(@PathVariable UUID id, @RequestBody TodoRequest request,
                               @AuthenticationPrincipal UserDetails user) {
        return todoService.update(id, request, user.getUsername());
    }

    @DeleteMapping("/api/todos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UserDetails user) {
        todoService.delete(id, user.getUsername());
    }

    @GetMapping("/api/trips/{tripId}/todos/suggestions")
    public List<TodoSuggestionResponse> suggestions(@PathVariable UUID tripId,
                                                    @AuthenticationPrincipal UserDetails user) {
        return todoService.suggestions(tripId, user.getUsername());
    }

    @PostMapping("/api/trips/{tripId}/todos/from-suggestions")
    @ResponseStatus(HttpStatus.CREATED)
    public List<TodoResponse> addSuggestions(@PathVariable UUID tripId,
                                             @RequestBody TodoFromSuggestionsRequest request,
                                             @AuthenticationPrincipal UserDetails user) {
        return todoService.addSuggestions(tripId, request, user.getUsername());
    }
}
