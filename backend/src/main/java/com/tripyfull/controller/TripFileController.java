package com.tripyfull.controller;

import com.tripyfull.dto.TripResponse;
import com.tripyfull.service.TripFileService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/** A trip out as one file, and a file in as a new trip. */
@RestController
public class TripFileController {

    private final TripFileService tripFileService;

    public TripFileController(TripFileService tripFileService) {
        this.tripFileService = tripFileService;
    }

    @GetMapping("/api/trips/{tripId}/file")
    public ResponseEntity<byte[]> export(@PathVariable UUID tripId, @AuthenticationPrincipal UserDetails user) {
        TripFileService.Export export = tripFileService.export(tripId, user.getUsername());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/zip"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(export.fileName(), StandardCharsets.UTF_8).build().toString())
                .body(export.bytes());
    }

    @PostMapping("/api/trips/import")
    @ResponseStatus(HttpStatus.CREATED)
    public TripResponse importTrip(@RequestParam("file") MultipartFile file, @AuthenticationPrincipal UserDetails user) {
        return tripFileService.importFile(file, user.getUsername());
    }
}
