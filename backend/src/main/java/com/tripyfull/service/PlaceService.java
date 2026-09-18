package com.tripyfull.service;

import com.tripyfull.util.GeoMath;
import com.tripyfull.util.PlaceTypes;
import com.tripyfull.dto.PlaceGeocodeRequest;
import com.tripyfull.dto.PlaceImportRequest;
import com.tripyfull.dto.PlaceRequest;
import com.tripyfull.dto.PlaceResponse;
import com.tripyfull.model.Activity;
import com.tripyfull.model.Place;
import com.tripyfull.model.PlaceFolder;
import com.tripyfull.model.PlaceAudience;
import com.tripyfull.model.PlaceSource;
import com.tripyfull.model.PlaceType;
import com.tripyfull.model.Trip;
import com.tripyfull.model.User;
import com.tripyfull.repository.PlaceFolderRepository;
import com.tripyfull.repository.PlaceRepository;
import com.tripyfull.repository.TripRepository;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final GeocodingService geocodingService;
    private final PlaceFolderRepository folderRepository;
    private final MapLinkService mapLinkService;
    private final OpenTripMapService openTripMapService;
    private final GooglePlacesService googlePlacesService;
    private final TripRepository tripRepository;
    private final PlacePhotoService placePhotoService;
    private final com.tripyfull.repository.ActivityRepository activityRepository;
    private final OwnershipGuard guard;

    public PlaceService(PlaceRepository placeRepository, GeocodingService geocodingService,
                        PlaceFolderRepository folderRepository, MapLinkService mapLinkService,
                        OpenTripMapService openTripMapService, GooglePlacesService googlePlacesService,
                        TripRepository tripRepository, PlacePhotoService placePhotoService,
                        com.tripyfull.repository.ActivityRepository activityRepository,
                        OwnershipGuard guard) {
        this.placeRepository = placeRepository;
        this.geocodingService = geocodingService;
        this.folderRepository = folderRepository;
        this.mapLinkService = mapLinkService;
        this.openTripMapService = openTripMapService;
        this.googlePlacesService = googlePlacesService;
        this.tripRepository = tripRepository;
        this.placePhotoService = placePhotoService;
        this.activityRepository = activityRepository;
        this.guard = guard;
    }

    /** Google (photos + editorial summary) first when configured; OpenTripMap fills remaining gaps. */
    private void enrichPlace(Place place) {
        if (googlePlacesService.isEnabled()) googlePlacesService.enrich(place);
        openTripMapService.enrich(place);
    }

    /**
     * The user's places, narrowed to one folder or to a trip's itinerary, with optional
     * filters (country/type/source/city/text) and sort (name|recent|type|rating). The
     * text query matches name, city or address.
     */
    public List<PlaceResponse> getAll(String username, UUID folderId, UUID tripId, String country,
                                      String type, String source, String city,
                                      String q, String sort) {
        User user = getUser(username);
        Map<UUID, UUID> placeToFolder = myPlaceFolderMap(user);

        List<Place> base;
        if (folderId != null) {
            PlaceFolder folder = folderRepository.findByIdAndOwnerId(folderId, user.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));
            base = folder.getPlaces().stream()
                    .filter(p -> isMine(p, user))
                    .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        } else if (tripId != null) {
            Trip trip = guard.requireTrip(tripId, user);   // 404 for someone else's trip
            base = trip.getPlaces().stream()
                    .filter(p -> isMine(p, user))
                    .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        } else {
            base = new ArrayList<>(placeRepository.findByOwnerIdOrderByNameAsc(user.getId()));
        }

        String country2 = blankToNull(country);
        String type2 = blankToNull(type);
        String source2 = blankToNull(source);
        String city2 = blankToNull(city);
        String q2 = blankToNull(q);

        List<Place> filtered = base.stream()
                .filter(p -> country2 == null || (p.getCountry() != null && p.getCountry().equalsIgnoreCase(country2)))
                .filter(p -> type2 == null || (p.getType() != null && p.getType().name().equalsIgnoreCase(type2)))
                .filter(p -> source2 == null || (p.getSource() != null && p.getSource().name().equalsIgnoreCase(source2)))
                .filter(p -> city2 == null || (p.getCity() != null && p.getCity().toLowerCase().contains(city2.toLowerCase())))
                .filter(p -> q2 == null || matchesText(p, q2.toLowerCase()))
                .sorted(comparatorFor(sort))
                .toList();

        Map<UUID, List<UUID>> placeToTrips = myPlaceTripMap(user);
        return filtered.stream()
                .map(p -> toResponse(p, user, placeToFolder.get(p.getId()), placeToTrips.get(p.getId())))
                .toList();
    }

    /** Map of placeId -> trips of the user whose list contains it. */
    private Map<UUID, List<UUID>> myPlaceTripMap(User user) {
        Map<UUID, List<UUID>> map = new HashMap<>();
        for (Trip t : tripRepository.findByOwnerId(user.getId())) {
            for (Place p : t.getPlaces()) {
                map.computeIfAbsent(p.getId(), k -> new ArrayList<>()).add(t.getId());
            }
        }
        return map;
    }

    /** Adds a place to a trip's list. */
    public PlaceResponse addToTrip(UUID tripId, UUID placeId, String username) {
        User user = getUser(username);
        Trip trip = guard.requireTrip(tripId, user);
        Place place = placeRepository.findById(placeId)
                .filter(p -> isMine(p, user))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
        if (trip.getPlaces().add(place)) tripRepository.save(trip);
        return toResponse(place, user, myPlaceFolderMap(user).get(placeId), myPlaceTripMap(user).get(placeId));
    }

    /** Removes a place from a trip's list; the place itself and its folders stay. */
    public PlaceResponse removeFromTrip(UUID tripId, UUID placeId, String username) {
        User user = getUser(username);
        Trip trip = guard.requireTrip(tripId, user);
        Place place = placeRepository.findById(placeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
        if (trip.getPlaces().removeIf(p -> p.getId().equals(placeId))) tripRepository.save(trip);
        return toResponse(place, user, myPlaceFolderMap(user).get(placeId), myPlaceTripMap(user).get(placeId));
    }

    private Comparator<Place> comparatorFor(String sort) {
        String s = sort == null ? "name" : sort.toLowerCase();
        return switch (s) {
            case "recent" -> Comparator.comparing(Place::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
            case "type" -> Comparator.comparing((Place p) -> p.getType() != null ? p.getType().name() : "")
                    .thenComparing(p -> p.getName() != null ? p.getName().toLowerCase() : "");
            case "rating" -> Comparator.comparingInt(Place::getRating).reversed()
                    .thenComparing(p -> p.getName() != null ? p.getName().toLowerCase() : "");
            default -> Comparator.comparing(p -> p.getName() != null ? p.getName().toLowerCase() : "");
        };
    }

    /** Map of placeId -> folderId across the user's own folders (one folder per place). */
    private Map<UUID, UUID> myPlaceFolderMap(User user) {
        Map<UUID, UUID> map = new HashMap<>();
        for (PlaceFolder f : folderRepository.findByOwnerIdOrderByNameAsc(user.getId())) {
            for (Place p : f.getPlaces()) map.put(p.getId(), f.getId());
        }
        return map;
    }

    private boolean isMine(Place p, User user) {
        return p.getOwner().getId().equals(user.getId());
    }

    private String blankToNull(String s) { return (s == null || s.isBlank()) ? null : s; }

    /** One search box covers name, city and address. */
    private boolean matchesText(Place p, String needle) {
        return contains(p.getName(), needle) || contains(p.getCity(), needle) || contains(p.getAddress(), needle);
    }

    private boolean contains(String haystack, String needle) {
        return haystack != null && haystack.toLowerCase().contains(needle);
    }

    /** Maps an OSM category hint (e.g. "natural:beach", "amenity:restaurant") to a PlaceType. */
    public PlaceResponse create(PlaceRequest request, String username) {
        User user = getUser(username);
        Place place = new Place();
        place.setOwner(user);
        place.setSource(PlaceSource.MANUAL);
        applyRequest(place, request);
        // Geocode manual entries that lack coordinates, caching the result on the place.
        if (place.getLatitude() == null || place.getLongitude() == null) {
            geocodeInto(place);
        }
        enrichPlace(place);   // best-effort description + photos
        return toResponse(placeRepository.save(place), user, null);   // new place, not in a folder yet
    }

    /** Find-or-create from a geocoding lookup. Dedupes by (owner, osmId). */
    public PlaceResponse geocodeCreate(PlaceGeocodeRequest request, String username) {
        User user = getUser(username);
        GeocodingService.GeocodeResult r = geocodingService.geocode(request.text(), request.country());
        if (r == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No location found for: " + request.text());
        }
        if (r.osmId() != null) {
            Place existing = placeRepository.findByOwnerIdAndOsmId(user.getId(), r.osmId()).orElse(null);
            if (existing != null) return toResponse(existing, user, myPlaceFolderMap(user).get(existing.getId()));
        }
        Place place = new Place();
        place.setOwner(user);
        place.setSource(PlaceSource.GEOCODED);
        place.setType(PlaceTypes.infer(r.category()));
        place.setName(r.name() != null && !r.name().isBlank() ? r.name() : request.text());
        place.setAddress(r.address());
        place.setLatitude(r.latitude());
        place.setLongitude(r.longitude());
        place.setOsmId(r.osmId());
        place.setCity(r.city());
        String country = r.country() != null ? r.country()
                : (request.country() != null && !request.country().isBlank() ? request.country().toUpperCase() : null);
        place.setCountry(country);
        enrichPlace(place);   // best-effort description + photos
        return toResponse(placeRepository.save(place), user, null);
    }

    /** Import a place from a Google Maps share link (resolves redirect, parses, geocodes). */
    public PlaceResponse importFromUrl(PlaceImportRequest request, String username) {
        User user = getUser(username);
        MapLinkService.ParsedLink parsed = mapLinkService.parse(request.url());
        if (parsed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Couldn't read that link — paste a Google Maps place link");
        }
        if (parsed.isList()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "That link opens a list or destination page, not a single place. Open a specific place and share its link.");
        }

        // The link names the place and marks the spot; Google turns the two into
        // the place itself — its id, canonical name, address, type — and later the
        // id fetches its description and photos. Without Google, or when Google
        // finds nothing there, the OSM geocoder reads the spot as before.
        GeocodingService.GeocodeResult r = null;
        boolean fromGoogle = false;
        if (googlePlacesService.isEnabled() && parsed.name() != null) {
            r = googlePlacesService.locate(parsed.name(), parsed.lat(), parsed.lon());
            fromGoogle = r != null;
        }
        if (r == null && parsed.lat() != null && parsed.lon() != null) {
            r = geocodingService.reverseGeocode(parsed.lat(), parsed.lon());
        }
        if (r == null && parsed.name() != null) {
            r = geocodingService.geocode(parsed.name(), null);
        }
        // A link shared from a phone in Thailand carries the place's Thai name in
        // its own path, and Google, asked in English, answers with the listing that
        // name belongs to — which for many places is the only one Google has. The
        // card then reads "เป็น น้ำตกวชิรธาร · ตำบลบ้านหลวง", and so does the client's
        // book. OpenStreetMap keeps an English name beside the local one, so the
        // same words go to the OSM geocoders and their naming is taken instead.
        if (fromGoogle && !hasLatinLetters(r.name())) {
            r = inLatinLetters(r, geocodingService.geocodeOsm(parsed.name(), null));
        }

        if (r != null && r.osmId() != null) {
            Place existing = placeRepository.findByOwnerIdAndOsmId(user.getId(), r.osmId()).orElse(null);
            if (existing != null) {
                // Re-import of a known place — still remember the Google Maps link on it.
                if (addSourceLink(existing, request.url())) placeRepository.save(existing);
                return toResponse(existing, user, myPlaceFolderMap(user).get(existing.getId()));
            }
        }

        // Type from the geocoder's category, falling back to the place description (e.g. "Buddhist temple").
        PlaceType type = PlaceTypes.infer(r != null ? r.category() : null);
        if (type == PlaceType.OTHER && parsed.description() != null) type = PlaceTypes.infer(parsed.description());

        Place place = new Place();
        place.setOwner(user);
        place.setSource(PlaceSource.IMPORTED);
        place.setType(type);
        if (fromGoogle) {
            // Google's own record of the place: its name as listed, its pin.
            place.setName(r.name() != null ? r.name() : parsed.name());
            place.setLatitude(r.latitude());
            place.setLongitude(r.longitude());
        } else {
            place.setName(parsed.name() != null ? parsed.name()
                    : (r != null && r.name() != null ? r.name() : "Imported place"));
            // Prefer the link's exact marker coordinates; fall back to the geocoder's.
            place.setLatitude(parsed.lat() != null ? parsed.lat() : (r != null ? r.latitude() : null));
            place.setLongitude(parsed.lon() != null ? parsed.lon() : (r != null ? r.longitude() : null));
        }
        if (r != null) {
            place.setAddress(r.address());
            place.setOsmId(r.osmId());
            place.setCity(r.city());
            place.setCountry(r.country());
        }
        // The share page's own snippet ("★★★★★ · Buddhist temple") and preview
        // image are the fallback: Google's editorial summary and photos, fetched
        // by id in enrichPlace, come first when the place was found there.
        if (!fromGoogle) {
            if (parsed.description() != null) place.setDescription(parsed.description());
            if (parsed.photo() != null) place.getPhotos().add(parsed.photo());
        }
        addSourceLink(place, request.url());   // keep the Google Maps link the place came from
        enrichPlace(place);   // fills whatever the link didn't provide
        if (fromGoogle) {
            if ((place.getDescription() == null || place.getDescription().isBlank()) && parsed.description() != null) {
                place.setDescription(parsed.description());
            }
            if (place.getPhotos().isEmpty() && parsed.photo() != null) place.getPhotos().add(parsed.photo());
        }
        return toResponse(placeRepository.save(place), user, null);
    }

    /** Attaches the link a place was imported from — trimmed, deduped, sized for the column. */
    private boolean addSourceLink(Place place, String url) {
        if (url == null) return false;
        String link = url.trim();
        if (link.isEmpty() || link.length() > 1000) return false;
        if (place.getLinks().stream().anyMatch(link::equalsIgnoreCase)) return false;
        place.getLinks().add(link);
        return true;
    }

    public PlaceResponse update(UUID id, PlaceRequest request, String username) {
        User user = getUser(username);
        Place place = findOwned(id, user);   // edits are owner-only
        applyRequest(place, request);
        Place saved = placeRepository.save(place);
        return toResponse(saved, user, myPlaceFolderMap(user).get(saved.getId()));
    }

    /** Stores an uploaded image (downscaled and re-encoded) as the place's next photo. */
    public PlaceResponse addPhoto(UUID id, MultipartFile file, String username) {
        User user = getUser(username);
        Place place = findOwned(id, user);
        if (place.getPhotos().size() >= PlacePhotoService.MAX_PER_PLACE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A place holds up to " + PlacePhotoService.MAX_PER_PLACE + " photos");
        }
        place.getPhotos().add(placePhotoService.store(file, place.getId()));
        Place saved = placeRepository.save(place);
        return toResponse(saved, user, myPlaceFolderMap(user).get(saved.getId()));
    }

    /** Drops one photo; the file is deleted too when we are the ones storing it. */
    public PlaceResponse removePhoto(UUID id, String url, String username) {
        User user = getUser(username);
        Place place = findOwned(id, user);
        if (!place.getPhotos().remove(url)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Photo not found on this place");
        }
        Place saved = placeRepository.save(place);
        placePhotoService.deleteFile(url);
        return toResponse(saved, user, myPlaceFolderMap(user).get(saved.getId()));
    }

    public void delete(UUID id, String username) {
        User user = getUser(username);
        Place place = findOwned(id, user);
        // Drop folder memberships (any owner's folder) so the join rows don't dangle.
        for (PlaceFolder f : folderRepository.findByPlacesId(place.getId())) {
            f.getPlaces().remove(place);
            folderRepository.save(f);
        }
        // Same for trip shortlists: trip_places references the place, so deleting
        // one that is planned into a trip failed on the foreign key.
        for (Trip t : tripRepository.findByPlacesId(place.getId())) {
            t.getPlaces().remove(place);
            tripRepository.save(t);
        }
        // Itinerary entries keep their name, times and notes — they just stop
        // pointing at a place that no longer exists.
        List<Activity> planned = activityRepository.findByPlaceId(place.getId());
        for (Activity a : planned) a.setPlace(null);
        activityRepository.saveAll(planned);

        // Uploaded photos live on disk under the place's id; without this the
        // files outlived the row and quietly piled up.
        for (String url : place.getPhotos()) placePhotoService.deleteFile(url);
        placeRepository.delete(place);
    }

    // ---- helpers ----

    /** How far a second opinion may sit from the pin and still be the same place. */
    static final double SAME_PLACE_METRES = 300;

    /**
     * Letters a client can read without a keyboard they do not own. A name with
     * any Latin letter in it — "Café Kyoto 京都" — is left alone; one with none is
     * the case this asks about.
     */
    static boolean hasLatinLetters(String s) {
        if (s == null) return false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) return true;
        }
        return false;
    }

    /**
     * The naming of {@code found} in Latin letters, when it needs one and a second
     * opinion offers it for the same spot. Only the words change — the pin, the id
     * and the category stay with the record that was found first, so a wrong match
     * can rename a place but never move it. Everything is kept as it was when
     * {@code found} can already be read, and when the second opinion is missing, is
     * not in Latin letters either, or is further away than one place can be from
     * itself.
     */
    static GeocodingService.GeocodeResult inLatinLetters(GeocodingService.GeocodeResult found,
                                                         GeocodingService.GeocodeResult other) {
        if (found == null || hasLatinLetters(found.name())) return found;
        if (other == null || !hasLatinLetters(other.name())) return found;
        if (found.latitude() == null || found.longitude() == null
                || other.latitude() == null || other.longitude() == null) return found;
        double metres = GeoMath.distanceMetres(
                found.latitude().doubleValue(), found.longitude().doubleValue(),
                other.latitude().doubleValue(), other.longitude().doubleValue());
        if (metres > SAME_PLACE_METRES) return found;
        return new GeocodingService.GeocodeResult(
                found.latitude(), found.longitude(),
                other.address() != null ? other.address() : found.address(),
                found.osmId(), found.country(),
                other.city() != null ? other.city() : found.city(),
                other.name(), found.category());
    }

    /** Applies present (non-null) request fields onto the place. */
    private void applyRequest(Place place, PlaceRequest request) {
        if (request.name() != null) place.setName(request.name());
        if (request.type() != null) place.setType(parseType(request.type()));
        if (request.country() != null) place.setCountry(request.country().isBlank() ? null : request.country().toUpperCase());
        if (request.city() != null) place.setCity(request.city());
        if (request.address() != null) place.setAddress(request.address());
        if (request.latitude() != null) place.setLatitude(request.latitude());
        if (request.longitude() != null) place.setLongitude(request.longitude());
        if (request.description() != null) place.setDescription(request.description());
        if (request.photos() != null) place.setPhotos(request.photos());
        if (request.links() != null) place.setLinks(request.links());
        if (request.rating() != null) {
            if (request.rating() < 1 || request.rating() > 5) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be 1..5");
            }
            place.setRating(request.rating());
        }
        if (request.ratingComment() != null) place.setRatingComment(blankToNull(request.ratingComment()));
        if (request.visitMinutes() != null) place.setVisitMinutes(request.visitMinutes() > 0 ? request.visitMinutes() : null);
        if (request.audience() != null) place.setAudience(parseAudience(request.audience()));
        if (request.needsPreparation() != null) place.setNeedsPreparation(request.needsPreparation());
        if (request.needsBooking() != null) place.setNeedsBooking(request.needsBooking());
    }

    private PlaceAudience parseAudience(String value) {
        try {
            return PlaceAudience.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid audience: " + value);
        }
    }

    private void geocodeInto(Place place) {
        if (place.getName() == null || place.getName().isBlank()) return;
        String query = place.getCity() != null && !place.getCity().isBlank()
                ? place.getName() + ", " + place.getCity()
                : place.getName();
        try {
            GeocodingService.GeocodeResult r = geocodingService.geocode(query, place.getCountry());
            if (r != null) {
                place.setLatitude(r.latitude());
                place.setLongitude(r.longitude());
                if (place.getOsmId() == null) place.setOsmId(r.osmId());
                if (place.getAddress() == null || place.getAddress().isBlank()) place.setAddress(r.address());
                if (place.getCity() == null || place.getCity().isBlank()) place.setCity(r.city());
                if (place.getCountry() == null || place.getCountry().isBlank()) place.setCountry(r.country());
            }
        } catch (Exception ignored) {
            // best-effort; never block a save on geocoding
        }
    }

    private PlaceType parseType(String s) {
        try { return PlaceType.valueOf(s); }
        catch (IllegalArgumentException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid place type: " + s); }
    }

    private Place findOwned(UUID id, User user) {
        Place place = placeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
        if (!place.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found");
        }
        return place;
    }

    private User getUser(String username) {
        return guard.requireUser(username);
    }

    private PlaceResponse toResponse(Place p, User currentUser, UUID folderId) {
        return toResponse(p, currentUser, folderId, null);
    }

    private PlaceResponse toResponse(Place p, User currentUser, UUID folderId, List<UUID> tripIds) {
        return new PlaceResponse(
                p.getId(), p.getName(),
                p.getType() != null ? p.getType().name() : null,
                p.getCountry(), p.getCity(), p.getAddress(),
                p.getLatitude(), p.getLongitude(), p.getDescription(),
                p.getPhotos(), p.getLinks(), p.getOsmId(),
                p.getSource() != null ? p.getSource().name() : null,
                p.getRating(),
                p.getRatingComment(),
                p.getVisitMinutes(),
                p.getAudience() != null ? p.getAudience().name() : PlaceAudience.ALL.name(),
                p.isNeedsPreparation(),
                p.isNeedsBooking(),
                folderId,
                tripIds != null ? tripIds : List.of()
        );
    }
}
