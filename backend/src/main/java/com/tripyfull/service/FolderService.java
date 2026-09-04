package com.tripyfull.service;

import com.tripyfull.dto.FolderRequest;
import com.tripyfull.dto.FolderResponse;
import com.tripyfull.model.Place;
import com.tripyfull.model.PlaceFolder;
import com.tripyfull.model.PlaceVisibility;
import com.tripyfull.model.User;
import com.tripyfull.repository.PlaceFolderRepository;
import com.tripyfull.repository.PlaceRepository;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class FolderService {

    private final PlaceFolderRepository folderRepository;
    private final PlaceRepository placeRepository;
    private final com.tripyfull.repository.TripRepository tripRepository;
    private final OwnershipGuard guard;

    public FolderService(PlaceFolderRepository folderRepository, PlaceRepository placeRepository,
                         com.tripyfull.repository.TripRepository tripRepository, OwnershipGuard guard) {
        this.folderRepository = folderRepository;
        this.placeRepository = placeRepository;
        this.tripRepository = tripRepository;
        this.guard = guard;
    }

    /** All of the user's folders, or only those belonging to one trip. */
    public List<FolderResponse> list(String username, UUID tripId) {
        User user = getUser(username);
        return folderRepository.findByOwnerIdOrderByNameAsc(user.getId()).stream()
                .filter(f -> tripId == null
                        || (f.getTrip() != null && f.getTrip().getId().equals(tripId)))
                .map(this::toResponse).toList();
    }

    public FolderResponse create(FolderRequest request, String username) {
        User user = getUser(username);
        PlaceFolder folder = new PlaceFolder();
        folder.setOwner(user);
        folder.setName(request.name());
        folder.setColor(request.color());
        // A folder without a trip is invisible in the trip's list and silently
        // breaks "file a place into a folder" (the place never joins the trip),
        // so new folders always belong to one. Older trip-less rows still load.
        if (request.tripId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A folder must belong to a trip");
        }
        folder.setTrip(guard.requireTrip(request.tripId(), user));
        return toResponse(folderRepository.save(folder));
    }

    public FolderResponse update(UUID id, FolderRequest request, String username) {
        PlaceFolder folder = findOwned(id, username);
        if (request.name() != null) folder.setName(request.name());
        if (request.color() != null) folder.setColor(request.color());
        return toResponse(folderRepository.save(folder));
    }

    public void delete(UUID id, String username) {
        folderRepository.delete(findOwned(id, username));   // removes folder + memberships, keeps places
    }

    /** Adds a place to the folder, removing it from the user's other folders (one folder per place). */
    public FolderResponse addPlace(UUID folderId, UUID placeId, String username) {
        User user = getUser(username);
        PlaceFolder folder = findOwned(folderId, user);
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
        boolean visible = place.getOwner().getId().equals(user.getId())
                || place.getVisibility() == PlaceVisibility.PUBLIC;
        if (!visible) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found");

        for (PlaceFolder f : folderRepository.findByOwnerIdOrderByNameAsc(user.getId())) {
            if (!f.getId().equals(folderId) && f.getPlaces().remove(place)) folderRepository.save(f);
        }
        folder.getPlaces().add(place);
        // Filing into a trip's folder implies the place belongs to that trip's list.
        if (folder.getTrip() != null && folder.getTrip().getPlaces().add(place)) {
            tripRepository.save(folder.getTrip());
        }
        return toResponse(folderRepository.save(folder));
    }

    public FolderResponse removePlace(UUID folderId, UUID placeId, String username) {
        PlaceFolder folder = findOwned(folderId, username);
        folder.getPlaces().removeIf(p -> p.getId().equals(placeId));
        return toResponse(folderRepository.save(folder));
    }

    private PlaceFolder findOwned(UUID id, String username) {
        return findOwned(id, getUser(username));
    }

    private PlaceFolder findOwned(UUID id, User user) {
        return folderRepository.findByIdAndOwnerId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));
    }

    private User getUser(String username) {
        return guard.requireUser(username);
    }

    private FolderResponse toResponse(PlaceFolder f) {
        return new FolderResponse(f.getId(), f.getName(), f.getColor(), f.getPlaces().size(),
                f.getTrip() != null ? f.getTrip().getId() : null);
    }
}
