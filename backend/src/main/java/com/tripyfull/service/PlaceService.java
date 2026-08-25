package com.tripyfull.service;

import com.tripyfull.dto.PlaceGeocodeRequest;
import com.tripyfull.dto.PlaceImportRequest;
import com.tripyfull.dto.PlaceRequest;
import com.tripyfull.dto.PlaceResponse;
import com.tripyfull.model.Place;
import com.tripyfull.model.PlaceFolder;
import com.tripyfull.model.PlacePriority;
import com.tripyfull.model.PlaceSource;
import com.tripyfull.model.PlaceType;
import com.tripyfull.model.PlaceVisibility;
import com.tripyfull.model.User;
import com.tripyfull.repository.PlaceFolderRepository;
import com.tripyfull.repository.PlaceRepository;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
    private final OwnershipGuard guard;

    public PlaceService(PlaceRepository placeRepository, GeocodingService geocodingService,
                        PlaceFolderRepository folderRepository, MapLinkService mapLinkService,
                        OpenTripMapService openTripMapService, OwnershipGuard guard) {
        this.placeRepository = placeRepository;
        this.geocodingService = geocodingService;
        this.folderRepository = folderRepository;
        this.mapLinkService = mapLinkService;
        this.openTripMapService = openTripMapService;
        this.guard = guard;
    }

    /**
     * Visible places (own + everyone's PUBLIC) or a single folder's contents, with optional
     * filters (country/type/visibility/source/city/name) and sort (name|recent|type).
     */
    public List<PlaceResponse> getAll(String username, UUID folderId, String country, String type,
                                      String visibility, String source, String city, String q, String sort) {
        User user = getUser(username);
        Map<UUID, UUID> placeToFolder = myPlaceFolderMap(user);

        List<Place> base;
        if (folderId != null) {
            PlaceFolder folder = folderRepository.findByIdAndOwnerId(folderId, user.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));
            base = folder.getPlaces().stream()
                    .filter(p -> isVisible(p, user))
                    .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        } else {
            base = new ArrayList<>(placeRepository.findVisible(user.getId(), PlaceVisibility.PUBLIC, null, null));
        }

        String country2 = blankToNull(country);
        String type2 = blankToNull(type);
        String visibility2 = blankToNull(visibility);
        String source2 = blankToNull(source);
        String city2 = blankToNull(city);
        String q2 = blankToNull(q);

        List<Place> filtered = base.stream()
                .filter(p -> country2 == null || (p.getCountry() != null && p.getCountry().equalsIgnoreCase(country2)))
                .filter(p -> type2 == null || (p.getType() != null && p.getType().name().equalsIgnoreCase(type2)))
                .filter(p -> visibility2 == null || (p.getVisibility() != null && p.getVisibility().name().equalsIgnoreCase(visibility2)))
                .filter(p -> source2 == null || (p.getSource() != null && p.getSource().name().equalsIgnoreCase(source2)))
                .filter(p -> city2 == null || (p.getCity() != null && p.getCity().toLowerCase().contains(city2.toLowerCase())))
                .filter(p -> q2 == null || (p.getName() != null && p.getName().toLowerCase().contains(q2.toLowerCase())))
                .sorted(comparatorFor(sort))
                .toList();

        return filtered.stream().map(p -> toResponse(p, user, placeToFolder.get(p.getId()))).toList();
    }

    private Comparator<Place> comparatorFor(String sort) {
        String s = sort == null ? "name" : sort.toLowerCase();
        return switch (s) {
            case "recent" -> Comparator.comparing(Place::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()));
            case "type" -> Comparator.comparing((Place p) -> p.getType() != null ? p.getType().name() : "")
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

    private boolean isVisible(Place p, User user) {
        return p.getOwner().getId().equals(user.getId()) || p.getVisibility() == PlaceVisibility.PUBLIC;
    }

    private String blankToNull(String s) { return (s == null || s.isBlank()) ? null : s; }

    /** Maps an OSM category hint (e.g. "natural:beach", "amenity:restaurant") to a PlaceType. */
    private PlaceType inferType(String category) {
        if (category == null || category.isBlank()) return PlaceType.OTHER;
        String c = category.toLowerCase();
        if (c.contains("beach")) return PlaceType.BEACH;
        if (c.contains("museum")) return PlaceType.MUSEUM;
        if (c.contains("viewpoint")) return PlaceType.VIEWPOINT;
        if (c.contains("aeroway") || c.contains("airport")) return PlaceType.AIRPORT;
        if (c.contains("ferry") || c.contains("harbour") || c.contains("harbor") || c.contains("port")) return PlaceType.PORT;
        if (c.contains("restaurant") || c.contains("cafe") || c.contains("bar") || c.contains("food")
                || c.contains("catering") || c.contains("pub")) return PlaceType.RESTAURANT;
        if (c.contains("shop") || c.contains("mall") || c.contains("store") || c.contains("retail")
                || c.contains("supermarket") || c.contains("commercial")) return PlaceType.SHOP;
        if (c.contains("park") || c.contains("garden") || c.contains("playground")) return PlaceType.PARK;
        if (c.contains("natural") || c.contains("forest") || c.contains("water") || c.contains("peak")
                || c.contains("nature") || c.contains("wood")) return PlaceType.NATURE;
        if (c.contains("tourism") || c.contains("attraction") || c.contains("monument") || c.contains("historic")
                || c.contains("artwork") || c.contains("sights") || c.contains("castle") || c.contains("temple")) return PlaceType.SIGHTSEEING;
        if (c.contains("suburb") || c.contains("neighbourhood") || c.contains("quarter") || c.contains("city")
                || c.contains("town") || c.contains("village") || c.contains("hamlet") || c.contains("locality")) return PlaceType.NEIGHBORHOOD;
        return PlaceType.OTHER;
    }

    public PlaceResponse create(PlaceRequest request, String username) {
        User user = getUser(username);
        Place place = new Place();
        place.setOwner(user);
        place.setSource(PlaceSource.MANUAL);
        applyRequest(place, request);
        if (place.getVisibility() == null) place.setVisibility(PlaceVisibility.PRIVATE);
        // Geocode manual entries that lack coordinates, caching the result on the place.
        if (place.getLatitude() == null || place.getLongitude() == null) {
            geocodeInto(place);
        }
        openTripMapService.enrich(place);   // best-effort description + photo
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
        place.setVisibility(PlaceVisibility.PRIVATE);
        place.setType(inferType(r.category()));
        place.setName(r.name() != null && !r.name().isBlank() ? r.name() : request.text());
        place.setAddress(r.address());
        place.setLatitude(r.latitude());
        place.setLongitude(r.longitude());
        place.setOsmId(r.osmId());
        place.setCity(r.city());
        String country = r.country() != null ? r.country()
                : (request.country() != null && !request.country().isBlank() ? request.country().toUpperCase() : null);
        place.setCountry(country);
        openTripMapService.enrich(place);   // best-effort description + photo
        return toResponse(placeRepository.save(place), user, null);
    }

    /** Import a place from a Google Maps share link (resolves redirect, parses, geocodes). */
    public PlaceResponse importFromUrl(PlaceImportRequest request, String username) {
        User user = getUser(username);
        MapLinkService.ParsedLink parsed = mapLinkService.parse(request.url());
        if (parsed == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Couldn't read that link — paste a Google Maps or Tripadvisor place link");
        }
        if (parsed.isList()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "That link opens a list or destination page, not a single place. Open a specific place and share its link.");
        }

        GeocodingService.GeocodeResult r = null;
        if (parsed.lat() != null && parsed.lon() != null) {
            r = geocodingService.reverseGeocode(parsed.lat(), parsed.lon());
        }
        if (r == null && parsed.name() != null) {
            // geoQuery carries location context (e.g. "Eiffel Tower, Paris") for
            // links that don't embed coordinates, like Tripadvisor ones.
            r = geocodingService.geocode(
                    parsed.geoQuery() != null ? parsed.geoQuery() : parsed.name(), null);
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
        PlaceType type = inferType(r != null ? r.category() : null);
        if (type == PlaceType.OTHER && parsed.description() != null) type = inferType(parsed.description());

        Place place = new Place();
        place.setOwner(user);
        place.setSource(PlaceSource.IMPORTED);
        place.setVisibility(PlaceVisibility.PRIVATE);
        place.setType(type);
        place.setName(parsed.name() != null ? parsed.name()
                : (r != null && r.name() != null ? r.name() : "Imported place"));
        // Prefer the link's exact marker coordinates; fall back to the geocoder's.
        place.setLatitude(parsed.lat() != null ? parsed.lat() : (r != null ? r.latitude() : null));
        place.setLongitude(parsed.lon() != null ? parsed.lon() : (r != null ? r.longitude() : null));
        if (r != null) {
            place.setAddress(r.address());
            place.setOsmId(r.osmId());
            place.setCity(r.city());
            place.setCountry(r.country());
        }
        if (parsed.description() != null) place.setDescription(parsed.description());
        if (parsed.photo() != null) place.getPhotos().add(parsed.photo());
        addSourceLink(place, request.url());   // keep the Google Maps link the place came from
        openTripMapService.enrich(place);   // fills whatever the link didn't provide
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
        Place place = findOwned(id, user);   // visibility change & edits are owner-only
        applyRequest(place, request);
        Place saved = placeRepository.save(place);
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
        placeRepository.delete(place);
    }

    // ---- helpers ----

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
        if (request.visibility() != null) place.setVisibility(parseVisibility(request.visibility()));
        if (request.priority() != null) place.setPriority(parsePriority(request.priority()));
        if (request.needsBooking() != null) place.setNeedsBooking(request.needsBooking());
    }

    private PlacePriority parsePriority(String value) {
        try {
            return PlacePriority.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid priority: " + value);
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

    private PlaceVisibility parseVisibility(String s) {
        try { return PlaceVisibility.valueOf(s); }
        catch (IllegalArgumentException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid visibility: " + s); }
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
        return new PlaceResponse(
                p.getId(), p.getName(),
                p.getType() != null ? p.getType().name() : null,
                p.getCountry(), p.getCity(), p.getAddress(),
                p.getLatitude(), p.getLongitude(), p.getDescription(),
                p.getPhotos(), p.getLinks(), p.getOsmId(),
                p.getVisibility() != null ? p.getVisibility().name() : null,
                p.getSource() != null ? p.getSource().name() : null,
                p.getPriority() != null ? p.getPriority().name() : PlacePriority.OPTIONAL.name(),
                p.isNeedsBooking(),
                p.getOwner().getId().equals(currentUser.getId()),
                folderId
        );
    }
}
