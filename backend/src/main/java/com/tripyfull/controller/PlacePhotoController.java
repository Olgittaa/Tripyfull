package com.tripyfull.controller;

import com.tripyfull.dto.PlaceResponse;
import com.tripyfull.service.FileStorageService;
import com.tripyfull.service.PlacePhotoService;
import com.tripyfull.service.PlaceService;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.time.Duration;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
public class PlacePhotoController {

    /** Only the names we generate ourselves: "{uuid}.jpg". */
    private static final Pattern FILE_NAME =
            Pattern.compile("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.jpg");

    private final PlaceService placeService;
    private final PlacePhotoService placePhotoService;
    private final FileStorageService fileStorageService;

    public PlacePhotoController(PlaceService placeService, PlacePhotoService placePhotoService,
                                FileStorageService fileStorageService) {
        this.placeService = placeService;
        this.placePhotoService = placePhotoService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/api/places/{id}/photos")
    @ResponseStatus(HttpStatus.CREATED)
    public PlaceResponse upload(@PathVariable UUID id,
                                @RequestParam("file") MultipartFile file,
                                @AuthenticationPrincipal UserDetails user) {
        return placeService.addPhoto(id, file, user.getUsername());
    }

    @DeleteMapping("/api/places/{id}/photos")
    public PlaceResponse remove(@PathVariable UUID id,
                                @RequestParam("url") String url,
                                @AuthenticationPrincipal UserDetails user) {
        return placeService.removePhoto(id, url, user.getUsername());
    }

    /**
     * Serves a stored photo. Unauthenticated on purpose: an &lt;img&gt; tag cannot
     * send the bearer token, so the URL itself is the capability — it carries a
     * random v4 UUID per file and is only ever handed out with the place.
     */
    @GetMapping("/api/place-photos/{placeId}/{name}")
    public ResponseEntity<Resource> serve(@PathVariable UUID placeId, @PathVariable String name) {
        if (!FILE_NAME.matcher(name).matches()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }
        String url = PlacePhotoService.URL_PREFIX + placeId + "/" + name;
        Path path = fileStorageService.resolve(placePhotoService.keyForUrl(url));
        Resource resource = new PathResource(path);
        if (!resource.exists()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                // Immutable content: the name changes whenever the bytes do.
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .body(resource);
    }
}
