package com.tripyfull.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

/** Files in a folder on this machine — the laptop's storage, and the default. */
@Service
@ConditionalOnProperty(name = "app.storage", havingValue = "local", matchIfMissing = true)
public class LocalFileStorage implements FileStorage {

    private final Path root;

    public LocalFileStorage(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + root, e);
        }
    }

    @Override
    public String storeBytes(byte[] bytes, String key, String contentType) {
        try {
            Path target = resolve(key);
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
            return key;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file", e);
        }
    }

    @Override
    public Optional<StoredFile> open(String key) {
        Path file = resolve(key);
        if (!Files.isRegularFile(file)) return Optional.empty();
        try {
            return Optional.of(new StoredFile(Files.newInputStream(file), Files.size(file)));
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    @Override
    public void delete(String key) {
        try {
            Path file = resolve(key);
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

    /** The key as a path under the root — and never outside it. */
    private Path resolve(String key) {
        Path p = root.resolve(key).normalize();
        if (!p.startsWith(root)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid storage key");
        }
        return p;
    }
}
