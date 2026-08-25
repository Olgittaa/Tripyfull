package com.tripyfull.controller;

import com.tripyfull.dto.FolderRequest;
import com.tripyfull.dto.FolderResponse;
import com.tripyfull.service.FolderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    private final FolderService folderService;

    public FolderController(FolderService folderService) {
        this.folderService = folderService;
    }

    @GetMapping
    public List<FolderResponse> list(@AuthenticationPrincipal UserDetails user) {
        return folderService.list(user.getUsername());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FolderResponse create(@Valid @RequestBody FolderRequest request,
                                 @AuthenticationPrincipal UserDetails user) {
        return folderService.create(request, user.getUsername());
    }

    @PatchMapping("/{id}")
    public FolderResponse update(@PathVariable UUID id,
                                 @RequestBody FolderRequest request,
                                 @AuthenticationPrincipal UserDetails user) {
        return folderService.update(id, request, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id,
                       @AuthenticationPrincipal UserDetails user) {
        folderService.delete(id, user.getUsername());
    }

    @PutMapping("/{folderId}/places/{placeId}")
    public FolderResponse addPlace(@PathVariable UUID folderId, @PathVariable UUID placeId,
                                   @AuthenticationPrincipal UserDetails user) {
        return folderService.addPlace(folderId, placeId, user.getUsername());
    }

    @DeleteMapping("/{folderId}/places/{placeId}")
    public FolderResponse removePlace(@PathVariable UUID folderId, @PathVariable UUID placeId,
                                      @AuthenticationPrincipal UserDetails user) {
        return folderService.removePlace(folderId, placeId, user.getUsername());
    }
}
