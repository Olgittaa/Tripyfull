package com.example.demo.controller;

import com.example.demo.dto.BookingResponse;
import com.example.demo.model.Attachment;
import com.example.demo.service.BookingService;
import com.example.demo.service.FileStorageService;
import org.springframework.core.io.PathResource;
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

import java.nio.file.Path;
import java.util.UUID;

@RestController
public class AttachmentController {

    private final BookingService bookingService;
    private final FileStorageService fileStorageService;

    public AttachmentController(BookingService bookingService, FileStorageService fileStorageService) {
        this.bookingService = bookingService;
        this.fileStorageService = fileStorageService;
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
        Path path = fileStorageService.resolve(a.getStorageKey());
        Resource resource = new PathResource(path);
        if (!resource.exists()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File missing on storage");
        }
        MediaType mediaType = a.getContentType() != null
                ? MediaType.parseMediaType(a.getContentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + a.getFileName().replace("\"", "") + "\"")
                .body(resource);
    }

    @DeleteMapping("/api/attachments/{id}")
    public BookingResponse delete(@PathVariable UUID id,
                                  @AuthenticationPrincipal UserDetails user) {
        return bookingService.deleteAttachment(id, user.getUsername());
    }
}
