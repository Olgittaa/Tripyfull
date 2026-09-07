package com.tripyfull.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/** Stores attachment files on the local filesystem under a configurable directory. */
@Service
public class FileStorageService {

    private final Path root;

    public FileStorageService(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + root, e);
        }
    }

    /** Saves the file and returns a relative storage key (e.g. "{bookingId}/{uuid}_name.pdf"). */
    public String store(MultipartFile file, UUID bookingId) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        try {
            Path dir = root.resolve(bookingId.toString());
            Files.createDirectories(dir);
            String safeName = sanitize(file.getOriginalFilename());
            String key = bookingId + "/" + UUID.randomUUID() + "_" + safeName;
            Path target = root.resolve(key).normalize();
            if (!target.startsWith(root)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file path");
            }
            file.transferTo(target);
            return key;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file", e);
        }
    }

    /** Saves already-processed bytes under an explicit key (see PlacePhotoService). */
    public String storeBytes(byte[] bytes, String storageKey) {
        try {
            Path target = resolve(storageKey);
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
            return storageKey;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file", e);
        }
    }

    public Path resolve(String storageKey) {
        Path p = root.resolve(storageKey).normalize();
        if (!p.startsWith(root)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid storage key");
        }
        return p;
    }

    public void delete(String storageKey) {
        try {
            Path file = resolve(storageKey);
            Files.deleteIfExists(file);
            // A place keeps its photos in a directory of its own; once the last
            // file is gone the directory is only clutter.
            Path dir = file.getParent();
            if (dir != null && !dir.equals(root) && Files.isDirectory(dir)) {
                try (var entries = Files.list(dir)) {
                    if (entries.findAny().isEmpty()) Files.deleteIfExists(dir);
                }
            }
        } catch (IOException ignored) {
            // best-effort: leave an orphan rather than fail the request
        }
    }

    private String sanitize(String name) {
        if (name == null || name.isBlank()) return "file";
        String base = Paths.get(name).getFileName().toString();
        return base.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
