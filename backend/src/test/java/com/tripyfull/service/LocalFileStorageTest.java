package com.tripyfull.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The storage contract, tried on the folder implementation: what every home
 * for uploads promises — a ticket's key shape, the size it refuses, a name it
 * cannot be tricked by — and the folder's own housekeeping.
 */
class LocalFileStorageTest {

    @TempDir
    Path dir;

    private FileStorage storage() {
        return new LocalFileStorage(dir.toString());
    }

    @Test
    @DisplayName("a ticket is filed under its booking with a safe name, and reads back the same")
    void aTicketIsStoredUnderItsBooking() throws Exception {
        FileStorage storage = storage();
        UUID booking = UUID.randomUUID();
        byte[] pdf = "%PDF-1.4 voucher".getBytes();

        String key = storage.store(new MockMultipartFile("file", "Gutschein (final).pdf",
                "application/pdf", pdf), booking);

        assertThat(key).startsWith(booking + "/").endsWith("_Gutschein__final_.pdf");
        Optional<FileStorage.StoredFile> back = storage.open(key);
        assertThat(back).isPresent();
        assertThat(back.get().size()).isEqualTo(pdf.length);
        try (var in = back.get().stream()) {
            assertThat(in.readAllBytes()).isEqualTo(pdf);
        }
    }

    @Test
    @DisplayName("a file over 10 MB is refused before anything is written")
    void aFileOverTheLimitIsRefused() {
        FileStorage storage = storage();
        byte[] big = new byte[(int) FileStorage.MAX_ATTACHMENT_BYTES + 1];

        assertThatThrownBy(() -> storage.store(new MockMultipartFile("file", "huge.pdf", "application/pdf", big),
                UUID.randomUUID()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(e -> ((ResponseStatusException) e).getStatusCode())
                .isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(dir).isEmptyDirectory();
    }

    @Test
    @DisplayName("a name that tries to climb out of its folder is flattened, and a key that tries is refused")
    void namesAndKeysStayInsideTheRoot() throws Exception {
        FileStorage storage = storage();
        UUID booking = UUID.randomUUID();
        String key = storage.store(new MockMultipartFile("file", "../../etc/passwd", "text/plain",
                "x".getBytes()), booking);
        assertThat(key).isEqualTo(booking + "/" + key.substring(key.indexOf('/') + 1));
        assertThat(key).endsWith("_passwd");
        assertThat(Files.walk(dir).filter(Files::isRegularFile)).allMatch(p -> p.startsWith(dir));

        assertThatThrownBy(() -> storage.storeBytes("x".getBytes(), "../outside.txt", "text/plain"))
                .isInstanceOf(ResponseStatusException.class);
        assertThat(FileStorage.safeName(null)).isEqualTo("file");
        assertThat(FileStorage.safeName("###")).isEqualTo("___");
    }

    @Test
    @DisplayName("a missing key is empty, not an error; deleting the last photo takes its folder with it")
    void missingIsEmptyAndDeleteTidiesUp() {
        FileStorage storage = storage();
        assertThat(storage.open("nobody/here.jpg")).isEmpty();

        String key = storage.storeBytes(new byte[]{1, 2, 3}, "places/abc/one.jpg", "image/jpeg");
        assertThat(dir.resolve("places/abc")).isDirectory();
        storage.delete(key);
        assertThat(storage.open(key)).isEmpty();
        assertThat(dir.resolve("places/abc")).doesNotExist();
        storage.delete(key); // twice is fine
    }
}
