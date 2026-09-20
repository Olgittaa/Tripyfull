package com.tripyfull.service;

import com.tripyfull.dto.TripFile;
import com.tripyfull.dto.TripResponse;
import com.tripyfull.mapper.TripFileMapper;
import com.tripyfull.mapper.TripFileMapper.Built;
import com.tripyfull.mapper.TripFileMapper.Packed;
import com.tripyfull.mapper.TripMapper;
import com.tripyfull.model.Attachment;
import com.tripyfull.model.Booking;
import com.tripyfull.model.Place;
import com.tripyfull.model.PlaceFolder;
import com.tripyfull.model.TodoItem;
import com.tripyfull.model.Trip;
import com.tripyfull.model.User;
import com.tripyfull.repository.PlaceFolderRepository;
import com.tripyfull.repository.PlaceRepository;
import com.tripyfull.repository.TodoRepository;
import com.tripyfull.repository.TripRepository;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

/**
 * A trip as one file, and back. The archive holds {@code trip.json} (see
 * {@link TripFile}) and, under {@code files/}, the photos this app stores
 * itself and the tickets attached to bookings — so the file opens in another
 * account, or on another server, with nothing left behind.
 *
 * Importing always makes a new trip. Places join the importer's library: one
 * the library already has (same OpenStreetMap or Google id) is reused as it
 * is, the rest are created from the file, photos and all.
 */
@Service
@Transactional
public class TripFileService {

    /** What a trip file is called: the title, then this. */
    public static final String EXTENSION = ".tripyfull.zip";
    private static final String MANIFEST = "trip.json";

    private final TripRepository tripRepository;
    private final PlaceRepository placeRepository;
    private final PlaceFolderRepository folderRepository;
    private final TodoRepository todoRepository;
    private final PlacePhotoService placePhotoService;
    private final FileStorageService storage;
    private final OwnershipGuard guard;
    private final ObjectMapper json;

    public TripFileService(TripRepository tripRepository, PlaceRepository placeRepository,
                           PlaceFolderRepository folderRepository, TodoRepository todoRepository,
                           PlacePhotoService placePhotoService, FileStorageService storage,
                           OwnershipGuard guard, ObjectMapper json) {
        this.tripRepository = tripRepository;
        this.placeRepository = placeRepository;
        this.folderRepository = folderRepository;
        this.todoRepository = todoRepository;
        this.placePhotoService = placePhotoService;
        this.storage = storage;
        this.guard = guard;
        this.json = json;
    }

    /** The archive and the name to save it under. */
    public record Export(String fileName, byte[] bytes) {}

    public Export export(UUID tripId, String username) {
        Trip trip = guard.requireTrip(tripId, username);
        Long ownerId = trip.getOwner().getId();
        List<TodoItem> todos = todoRepository.findByTripIdOrderByOrderIndexAscCreatedAtAsc(tripId);
        List<PlaceFolder> folders = folderRepository.findByOwnerIdOrderByNameAsc(ownerId).stream()
                .filter(f -> f.getTrip() != null && tripId.equals(f.getTrip().getId()))
                .toList();
        Packed packed = TripFileMapper.toFile(trip, todos, folders, placePhotoService::keyForUrl);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(out)) {
            zip.putNextEntry(new ZipEntry(MANIFEST));
            zip.write(json.writerWithDefaultPrettyPrinter().writeValueAsBytes(packed.file()));
            zip.closeEntry();
            for (Map.Entry<String, String> e : packed.entries().entrySet()) {
                Path path = storage.resolve(e.getValue());
                // A file gone from the disk is a gap in the archive, not a reason to
                // refuse the whole trip.
                if (!Files.isRegularFile(path)) continue;
                zip.putNextEntry(new ZipEntry(e.getKey()));
                Files.copy(path, zip);
                zip.closeEntry();
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not write the trip file", e);
        }
        return new Export(fileNameFor(trip.getTitle()), out.toByteArray());
    }

    public TripResponse importFile(MultipartFile upload, String username) {
        User user = guard.requireUser(username);
        if (upload == null || upload.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file in the request");
        }

        // The whole archive first: the manifest may come after the files it names.
        TripFile file = null;
        Map<String, byte[]> files = new HashMap<>();
        try (ZipInputStream zip = new ZipInputStream(upload.getInputStream())) {
            for (ZipEntry entry = zip.getNextEntry(); entry != null; entry = zip.getNextEntry()) {
                if (entry.isDirectory()) continue;
                if (MANIFEST.equals(entry.getName())) {
                    file = json.readValue(zip.readAllBytes(), TripFile.class);
                } else if (entry.getName().startsWith("files/")) {
                    files.put(entry.getName(), zip.readAllBytes());
                }
            }
        } catch (IOException | JacksonException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Not a Tripyfull trip file — choose the .zip that Export made");
        }
        if (file == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Not a Tripyfull trip file — choose the .zip that Export made");
        }

        List<Place> created = new ArrayList<>();
        Built built;
        try {
            built = TripFileMapper.toTrip(file, user, fp -> resolvePlace(fp, user, created));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }

        // New places need an id before their photos can be filed under it.
        for (Place place : created) {
            placeRepository.save(place);
            List<String> photos = new ArrayList<>();
            for (String photo : place.getPhotos()) {
                if (!photo.startsWith(TripFileMapper.PHOTOS_DIR)) {
                    photos.add(photo);
                    continue;
                }
                byte[] bytes = files.get(photo);
                if (bytes != null) photos.add(placePhotoService.storeEncoded(bytes, place.getId()));
            }
            place.setPhotos(photos);
        }

        Trip trip = tripRepository.save(built.trip());
        TripFileMapper.wireLinks(built);
        for (Booking booking : trip.getBookings()) {
            for (Iterator<Attachment> it = booking.getAttachments().iterator(); it.hasNext(); ) {
                Attachment att = it.next();
                byte[] bytes = files.get(att.getStorageKey());
                if (bytes == null) {
                    it.remove();   // named in the manifest, missing from the archive
                    continue;
                }
                String key = booking.getId() + "/" + UUID.randomUUID() + "_" + safeName(att.getFileName());
                att.setStorageKey(storage.storeBytes(bytes, key));
            }
        }
        for (PlaceFolder folder : built.folders()) folderRepository.save(folder);
        todoRepository.saveAll(built.todos());
        return TripMapper.toResponse(tripRepository.save(trip));
    }

    /**
     * A place the importer's library already knows — same OpenStreetMap or Google
     * id — is used as it is; the library is theirs and the file does not overwrite
     * it. Anything else is made new from the file.
     */
    private Place resolvePlace(TripFile.FilePlace fp, User user, List<Place> created) {
        if (fp.osmId() != null && !fp.osmId().isBlank()) {
            Place existing = placeRepository.findByOwnerIdAndOsmId(user.getId(), fp.osmId()).orElse(null);
            if (existing != null) return existing;
        }
        Place place = TripFileMapper.newPlace(fp, user);
        created.add(place);
        return place;
    }

    static String fileNameFor(String title) {
        String base = title == null ? "" : title.replaceAll("[\\\\/:*?\"<>|]+", " ").trim();
        return (base.isEmpty() ? "trip" : base) + EXTENSION;
    }

    private static String safeName(String name) {
        String s = name == null ? "file" : name.replaceAll("[^A-Za-z0-9._-]", "_");
        return s.isBlank() ? "file" : s;
    }

    /** Only so a test can read what the service would write, without a servlet upload. */
    TripFile readManifest(InputStream zipBytes) throws IOException {
        try (ZipInputStream zip = new ZipInputStream(zipBytes)) {
            for (ZipEntry entry = zip.getNextEntry(); entry != null; entry = zip.getNextEntry()) {
                if (MANIFEST.equals(entry.getName())) return json.readValue(zip.readAllBytes(), TripFile.class);
            }
        }
        return null;
    }
}
