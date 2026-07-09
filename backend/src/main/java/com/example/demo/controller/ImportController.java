package com.example.demo.controller;

import com.example.demo.service.ImportService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
public class ImportController {

    private final ImportService importService;

    public ImportController(ImportService importService) {
        this.importService = importService;
    }

    @PostMapping("/api/trips/{tripId}/import/csv")
    public Map<String, Object> importCsv(@PathVariable UUID tripId,
                                          @RequestParam("file") MultipartFile file,
                                          @AuthenticationPrincipal UserDetails user) {
        int count = importService.importBookingsCsv(tripId, file, user.getUsername());
        return Map.of("imported", count);
    }
}
