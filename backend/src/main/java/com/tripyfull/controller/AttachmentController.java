package com.tripyfull.controller;

import com.tripyfull.dto.BookingResponse;
import com.tripyfull.model.Attachment;
import com.tripyfull.service.BookingService;
import com.tripyfull.service.FileStorage;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
public class AttachmentController {

    private final BookingService bookingService;
    private final FileStorage fileStorage;

    public AttachmentController(BookingService bookingService, FileStorage fileStorage) {
        this.bookingService = bookingService;
        this.fileStorage = fileStorage;
    }

    @PostMapping("/api/bookings/{id}/attachments")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse upload(@PathVariable UUID id,
                                  @RequestParam("file") MultipartFile file,
                                  @AuthenticationPrincipal UserDetails user) {
        return bookingService.addAttachment(id, file, user.getUsername());
    }

    @GetMapping("/api/attachments/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID id,
                                             @AuthenticationPrincipal UserDetails user) {
        Attachment a = bookingService.getAttachmentForUser(id, user.getUsername());
        FileStorage.StoredFile file = fileStorage.open(a.getStorageKey())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File missing on storage"));
        MediaType mediaType = a.getContentType() != null
                ? MediaType.parseMediaType(a.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        ResponseEntity.BodyBuilder response = ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + a.getFileName().replace("\"", "") + "\"");
        if (file.size() >= 0) response.contentLength(file.size());
        return response.body(new InputStreamResource(file.stream()));
    }

    @DeleteMapping("/api/attachments/{id}")
    public BookingResponse delete(@PathVariable UUID id,
                                  @AuthenticationPrincipal UserDetails user) {
        return bookingService.deleteAttachment(id, user.getUsername());
    }
}
