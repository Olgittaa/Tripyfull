package com.example.demo.service;

import com.example.demo.dto.FolderRequest;
import com.example.demo.dto.FolderResponse;
import com.example.demo.model.Place;
import com.example.demo.model.PlaceFolder;
import com.example.demo.model.PlaceVisibility;
import com.example.demo.model.User;
import com.example.demo.repository.PlaceFolderRepository;
import com.example.demo.repository.PlaceRepository;
import com.example.demo.repository.UserRepository;
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
    private final UserRepository userRepository;

    public FolderService(PlaceFolderRepository folderRepository, PlaceRepository placeRepository,
                         UserRepository userRepository) {
        this.folderRepository = folderRepository;
        this.placeRepository = placeRepository;
        this.userRepository = userRepository;
    }

    public List<FolderResponse> list(String username) {
        User user = getUser(username);
        return folderRepository.findByOwnerIdOrderByNameAsc(user.getId()).stream()
                .map(this::toResponse).toList();
    }

    public FolderResponse create(FolderRequest request, String username) {
        User user = getUser(username);
        PlaceFolder folder = new PlaceFolder();
        folder.setOwner(user);
        folder.setName(request.name());
        folder.setColor(request.color());
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
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private FolderResponse toResponse(PlaceFolder f) {
        return new FolderResponse(f.getId(), f.getName(), f.getColor(), f.getPlaces().size());
    }
}
