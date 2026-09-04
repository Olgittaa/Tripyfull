package com.tripyfull.controller;

import com.tripyfull.dto.PlaceGeocodeRequest;
import com.tripyfull.dto.PlaceImportRequest;
import com.tripyfull.dto.PlaceRequest;
import com.tripyfull.dto.PlaceResponse;
import com.tripyfull.service.PlaceService;
import com.tripyfull.service.TripAdvisorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;
    private final TripAdvisorService tripAdvisorService;

    public PlaceController(PlaceService placeService, TripAdvisorService tripAdvisorService) {
        this.placeService = placeService;
        this.tripAdvisorService = tripAdvisorService;
    }

    /** Adds a place to a trip's own list (the trip's Places tab). */
    @PutMapping("/{placeId}/trips/{tripId}")
    public PlaceResponse addToTrip(@PathVariable UUID placeId, @PathVariable UUID tripId,
                                   @AuthenticationPrincipal UserDetails user) {
        return placeService.addToTrip(tripId, placeId, user.getUsername());
    }

    /** Removes a place from a trip's list; the place stays in the global library. */
    @DeleteMapping("/{placeId}/trips/{tripId}")
    public PlaceResponse removeFromTrip(@PathVariable UUID placeId, @PathVariable UUID tripId,
                                        @AuthenticationPrincipal UserDetails user) {
        return placeService.removeFromTrip(tripId, placeId, user.getUsername());
    }

    /** Tripadvisor rating + top reviews for a place; 204 when TA has no confident match. */
    @GetMapping("/{id}/tripadvisor")
    public ResponseEntity<TripAdvisorService.TaSummary> tripadvisor(@PathVariable UUID id,
                                                                    @AuthenticationPrincipal UserDetails user) {
        TripAdvisorService.TaSummary summary = tripAdvisorService.summaryForPlace(id, user.getUsername());
        return summary == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(summary);
    }

    @GetMapping
    public List<PlaceResponse> getAll(@RequestParam(required = false) UUID folderId,
                                      @RequestParam(required = false) UUID tripId,
                                      @RequestParam(required = false) String country,
                                      @RequestParam(required = false) String type,
                                      @RequestParam(required = false) String visibility,
                                      @RequestParam(required = false) String source,
                                      @RequestParam(required = false) String city,
                                      @RequestParam(required = false) String q,
                                      @RequestParam(required = false) String sort,
                                      @AuthenticationPrincipal UserDetails user) {
        return placeService.getAll(user.getUsername(), folderId, tripId, country, type, visibility,
                source, city, q, sort);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlaceResponse create(@Valid @RequestBody PlaceRequest request,
                                @AuthenticationPrincipal UserDetails user) {
        return placeService.create(request, user.getUsername());
    }

    @PostMapping("/geocode")
    @ResponseStatus(HttpStatus.CREATED)
    public PlaceResponse geocode(@Valid @RequestBody PlaceGeocodeRequest request,
                                 @AuthenticationPrincipal UserDetails user) {
        return placeService.geocodeCreate(request, user.getUsername());
    }

    @PostMapping("/import")
    @ResponseStatus(HttpStatus.CREATED)
    public PlaceResponse importFromUrl(@Valid @RequestBody PlaceImportRequest request,
                                       @AuthenticationPrincipal UserDetails user) {
        return placeService.importFromUrl(request, user.getUsername());
    }

    @PatchMapping("/{id}")
    public PlaceResponse update(@PathVariable UUID id,
                                @RequestBody PlaceRequest request,
                                @AuthenticationPrincipal UserDetails user) {
        return placeService.update(id, request, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id,
                       @AuthenticationPrincipal UserDetails user) {
        placeService.delete(id, user.getUsername());
    }
}
