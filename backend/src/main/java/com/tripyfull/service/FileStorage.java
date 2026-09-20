package com.tripyfull.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;

/**
 * Where uploaded files live: a place's photos and a booking's tickets. Two
 * homes implement it — a folder on disk for a laptop, an S3-compatible bucket
 * (Cloudflare R2) in production, where the free instance has no disk of its own
 * and would lose every upload at each deploy. Callers see keys and streams,
 * never paths, so they cannot tell the two apart. `app.storage` picks one.
 */
public interface FileStorage {

    /** One attachment: the request limit the app had before trip files needed more. */
    long MAX_ATTACHMENT_BYTES = 10L * 1024 * 1024;

    /** A stored file, open for reading. The caller closes the stream. */
    record StoredFile(InputStream stream, long size) {}

    /** Saves bytes under an explicit key and answers with that key. */
    String storeBytes(byte[] bytes, String key, String contentType);

    /** The file behind a key, or empty when there is none. */
    Optional<StoredFile> open(String key);

    /** Removes the file; a key that is already gone is not an error. */
    void delete(String key);

    /**
     * Saves a booking's attachment under "{bookingId}/{uuid}_{safe name}" and
     * answers with that key — the same shape in every home, so a key made on a
     * laptop reads the same in a bucket.
     */
    default String store(MultipartFile file, UUID bookingId) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        // The request limit is set high enough for a whole trip file to come in;
        // one ticket is held to what it always was.
        if (file.getSize() > MAX_ATTACHMENT_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "File is larger than " + (MAX_ATTACHMENT_BYTES / 1024 / 1024) + " MB");
        }
        String key = bookingId + "/" + UUID.randomUUID() + "_" + safeName(file.getOriginalFilename());
        try {
            return storeBytes(file.getBytes(), key, file.getContentType());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file", e);
        }
    }

    /** The file's own name with anything a path or a shell could mistake removed. */
    static String safeName(String name) {
        if (name == null || name.isBlank()) return "file";
        String base = Paths.get(name).getFileName().toString();
        String safe = base.replaceAll("[^a-zA-Z0-9._-]", "_");
        return safe.isBlank() ? "file" : safe;
    }
}
