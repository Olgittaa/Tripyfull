package com.tripyfull.mapper;

import com.tripyfull.dto.TripFile;
import com.tripyfull.dto.TripFile.FileActivity;
import com.tripyfull.dto.TripFile.FileAttachment;
import com.tripyfull.dto.TripFile.FileBooking;
import com.tripyfull.dto.TripFile.FileDay;
import com.tripyfull.dto.TripFile.FileFolder;
import com.tripyfull.dto.TripFile.FilePayment;
import com.tripyfull.dto.TripFile.FilePlace;
import com.tripyfull.dto.TripFile.FileTodo;
import com.tripyfull.model.Activity;
import com.tripyfull.model.ActivityType;
import com.tripyfull.model.Attachment;
import com.tripyfull.model.Booking;
import com.tripyfull.model.BookingCategory;
import com.tripyfull.model.Day;
import com.tripyfull.model.Payment;
import com.tripyfull.model.Place;
import com.tripyfull.model.PlaceAudience;
import com.tripyfull.model.PlaceFolder;
import com.tripyfull.model.PlaceSource;
import com.tripyfull.model.PlaceType;
import com.tripyfull.model.TodoItem;
import com.tripyfull.model.TransportMode;
import com.tripyfull.model.Trip;
import com.tripyfull.model.TripStatus;
import com.tripyfull.model.User;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

/**
 * Between the trip as the database holds it and the trip as a file holds it.
 * Pure: nothing here reads a disk or a repository. The bytes of photos and
 * tickets are the service's business — this side only says where in the
 * archive they go ({@link #toFile}) or where in the archive to find them
 * ({@link #toTrip}, which leaves archive paths in place for the service to
 * store and replace).
 */
public final class TripFileMapper {

    private TripFileMapper() {}

    /** Where stored files go inside the archive. */
    public static final String PHOTOS_DIR = "files/photos/";
    public static final String ATTACHMENTS_DIR = "files/attachments/";

    /** The file, and every stored file it points at: archive path → storage key. */
    public record Packed(TripFile file, Map<String, String> entries) {}

    /**
     * @param photoKey the storage key behind one of the app's own photo URLs, or
     *                 null for a URL that lives elsewhere and travels as a link
     */
    public static Packed toFile(Trip trip, List<TodoItem> todos, List<PlaceFolder> folders,
                                Function<String, String> photoKey) {
        Map<String, String> entries = new LinkedHashMap<>();

        // Every place the trip touches: its shortlist, what its stops point at, what
        // its folders hold. One entry each, in a steady order, so the same trip
        // exports to the same file.
        Map<UUID, Place> places = new LinkedHashMap<>();
        trip.getPlaces().stream()
                .sorted(Comparator.comparing(Place::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(Place::getName, Comparator.nullsLast(Comparator.naturalOrder())))
                .forEach(p -> places.put(p.getId(), p));
        for (Day d : trip.getDays()) {
            for (Activity a : d.getActivities()) {
                if (a.getPlace() != null) places.putIfAbsent(a.getPlace().getId(), a.getPlace());
            }
        }
        for (PlaceFolder f : folders) {
            for (Place p : f.getPlaces()) places.putIfAbsent(p.getId(), p);
        }

        List<FilePlace> filePlaces = new ArrayList<>();
        for (Place p : places.values()) {
            List<String> photos = new ArrayList<>();
            for (String url : p.getPhotos()) {
                String key = photoKey.apply(url);
                if (key == null) {
                    photos.add(url);
                    continue;
                }
                String path = PHOTOS_DIR + p.getId() + "/" + url.substring(url.lastIndexOf('/') + 1);
                entries.put(path, key);
                photos.add(path);
            }
            filePlaces.add(new FilePlace(id(p.getId()), p.getName(), name(p.getType()), p.getCountry(),
                    p.getCity(), p.getAddress(), p.getLatitude(), p.getLongitude(), p.getDescription(),
                    photos, new ArrayList<>(p.getLinks()), p.getOsmId(), p.getRating(), p.getRatingComment(),
                    p.getVisitMinutes(), name(p.getAudience()), p.isNeedsPreparation(), p.isNeedsBooking(),
                    name(p.getSource()), trip.getPlaces().contains(p)));
        }

        // Dated days by date, then the reserve days as they come.
        List<Day> days = trip.getDays().stream()
                .sorted(Comparator.comparing(Day::getDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        List<FileDay> fileDays = new ArrayList<>();
        for (Day d : days) {
            List<FileActivity> acts = d.getActivities().stream()
                    .sorted(Comparator.comparingInt(Activity::getOrderIndex))
                    .map(a -> new FileActivity(id(a.getId()), a.getName(), name(a.getType()), a.getStartTime(),
                            a.getEndTime(), a.getAddress(), a.getCostEstimate(), a.getCostCurrency(), a.getNotes(),
                            a.getPlace() != null ? id(a.getPlace().getId()) : null, a.getOrderIndex(),
                            a.getTravelModeToNext(), a.isNeedsBooking(), id(a.getSourceBookingId()),
                            a.getLatitude(), a.getLongitude(), a.getTravelKey(), a.getTravelSeconds(),
                            a.getTravelMeters(), a.getTravelGeometry(), a.isTravelEstimated(), a.getTravelNote()))
                    .toList();
            fileDays.add(new FileDay(id(d.getId()), d.getDate(), d.getCity(), d.getOvernightStay(),
                    id(d.getLinkedBookingId()), d.getNotes(), d.isBuffer(), acts));
        }

        List<FileBooking> fileBookings = new ArrayList<>();
        for (Booking b : trip.getBookings().stream()
                .sorted(Comparator.comparing(Booking::getName, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList()) {
            List<FilePayment> payments = b.getPayments().stream()
                    .sorted(Comparator.comparingInt(Payment::getSequence))
                    .map(p -> new FilePayment(p.getSequence(), p.getAmount(), p.getDueDate(), p.isPaid(), p.getPaidDate()))
                    .toList();
            List<FileAttachment> attachments = new ArrayList<>();
            for (Attachment att : b.getAttachments()) {
                String path = ATTACHMENTS_DIR + b.getId() + "/" + att.getId() + "/" + att.getFileName();
                entries.put(path, att.getStorageKey());
                attachments.add(new FileAttachment(att.getFileName(), att.getContentType(), att.getSize(), path));
            }
            fileBookings.add(new FileBooking(id(b.getId()), b.getName(), name(b.getCategory()), b.getVendor(),
                    b.getConfirmationNumber(), b.getBookingUrl(), b.getFullPrice(), b.getPriceCurrency(),
                    b.getExchangeRate(), b.getNotes(), id(b.getLinkedDayId()), b.getFlightNumber(), b.getFromPlace(),
                    b.getToPlace(), b.getFromLatitude(), b.getFromLongitude(), b.getToLatitude(), b.getToLongitude(),
                    b.getDepartureAt(), b.getArrivalAt(), name(b.getTransportMode()), b.getFromIata(), b.getToIata(),
                    b.getDepartureTerminal(), b.getArrivalTerminal(), b.getSeat(), b.getVesselName(), b.getCabin(),
                    b.getCarClass(), b.getAccommodationCity(), b.getCheckIn(), b.getCheckOut(), b.getCheckInTime(),
                    b.getCheckOutTime(), b.getRoomType(), b.getGuests(), b.getAddress(), b.getLatitude(),
                    b.getLongitude(), b.isPaidSimple(), payments, attachments));
        }

        List<FileTodo> fileTodos = todos.stream()
                .map(t -> new FileTodo(t.getTitle(), t.getNotes(), t.getGroupName(), t.getDueDate(), t.isDone(),
                        t.getOrderIndex(), t.getTemplateKey()))
                .toList();

        List<FileFolder> fileFolders = folders.stream()
                .map(f -> new FileFolder(f.getName(), f.getColor(),
                        f.getPlaces().stream().map(p -> id(p.getId())).sorted().toList()))
                .toList();

        TripFile file = new TripFile(TripFile.FORMAT, TripFile.VERSION, Instant.now(),
                new TripFile.Details(trip.getTitle(), trip.getDestination(), trip.getStartDate(), trip.getEndDate(),
                        trip.getBaseCurrency(), trip.getCoverImage(), name(trip.getStatus())),
                fileDays, fileBookings, fileTodos, filePlaces, fileFolders);
        return new Packed(file, entries);
    }

    /**
     * What {@link #toTrip} hands back: the new trip with its days, stops, bookings,
     * payments and attachments already hung on it, the to-dos and folders that go
     * beside it, and two things the service finishes after the first save gives
     * the bookings their ids — which day is linked to which booking, and which
     * stop came from which booking. Attachments still carry their archive path as
     * storage key, and a new place its archive paths as photos.
     */
    public record Built(Trip trip, List<TodoItem> todos, List<PlaceFolder> folders,
                        Map<String, Place> places, Map<String, Booking> bookings,
                        Map<Day, String> dayLinks, Map<Activity, String> stopSources) {}

    /**
     * @param resolvePlace the place to use for one in the file — an existing one
     *                     from the importer's library, or a new one from
     *                     {@link #newPlace}; the caller decides, and remembers which
     * @throws IllegalArgumentException when this is not a trip file we can read
     */
    public static Built toTrip(TripFile file, User owner, Function<FilePlace, Place> resolvePlace) {
        if (file == null || !TripFile.FORMAT.equals(file.format())) {
            throw new IllegalArgumentException("Not a Tripyfull trip file");
        }
        if (file.version() > TripFile.VERSION) {
            throw new IllegalArgumentException("This trip file was made by a newer Tripyfull — update first");
        }
        TripFile.Details d = file.trip() != null ? file.trip()
                : new TripFile.Details("Imported trip", null, null, null, "EUR", null, null);

        Trip trip = new Trip();
        trip.setOwner(owner);
        trip.setTitle(d.title() != null && !d.title().isBlank() ? d.title() : "Imported trip");
        trip.setDestination(d.destination());
        trip.setStartDate(d.startDate());
        trip.setEndDate(d.endDate());
        trip.setBaseCurrency(d.baseCurrency() != null && !d.baseCurrency().isBlank() ? d.baseCurrency() : "EUR");
        trip.setCoverImage(d.coverImage());
        trip.setStatus(parse(TripStatus.class, d.status(), TripStatus.DRAFT));

        Map<String, Place> places = new HashMap<>();
        for (FilePlace fp : list(file.places())) {
            Place place = resolvePlace.apply(fp);
            places.put(fp.id(), place);
            if (fp.shortlisted()) trip.getPlaces().add(place);
        }

        Map<String, Booking> bookings = new LinkedHashMap<>();
        for (FileBooking fb : list(file.bookings())) {
            Booking b = new Booking();
            b.setTrip(trip);
            b.setName(fb.name());
            b.setCategory(parse(BookingCategory.class, fb.category(), null));
            if (b.getCategory() == null) {
                throw new IllegalArgumentException("Not a Tripyfull trip file: a booking without a category");
            }
            b.setVendor(fb.vendor());
            b.setConfirmationNumber(fb.confirmationNumber());
            b.setBookingUrl(fb.bookingUrl());
            b.setFullPrice(fb.fullPrice());
            b.setPriceCurrency(fb.priceCurrency());
            b.setExchangeRate(fb.exchangeRate());
            b.setNotes(fb.notes());
            b.setFlightNumber(fb.flightNumber());
            b.setFromPlace(fb.fromPlace());
            b.setToPlace(fb.toPlace());
            b.setFromLatitude(fb.fromLatitude());
            b.setFromLongitude(fb.fromLongitude());
            b.setToLatitude(fb.toLatitude());
            b.setToLongitude(fb.toLongitude());
            b.setDepartureAt(fb.departureAt());
            b.setArrivalAt(fb.arrivalAt());
            b.setTransportMode(parse(TransportMode.class, fb.transportMode(), null));
            b.setFromIata(fb.fromIata());
            b.setToIata(fb.toIata());
            b.setDepartureTerminal(fb.departureTerminal());
            b.setArrivalTerminal(fb.arrivalTerminal());
            b.setSeat(fb.seat());
            b.setVesselName(fb.vesselName());
            b.setCabin(fb.cabin());
            b.setCarClass(fb.carClass());
            b.setAccommodationCity(fb.accommodationCity());
            b.setCheckIn(fb.checkIn());
            b.setCheckOut(fb.checkOut());
            b.setCheckInTime(fb.checkInTime());
            b.setCheckOutTime(fb.checkOutTime());
            b.setRoomType(fb.roomType());
            b.setGuests(fb.guests());
            b.setAddress(fb.address());
            b.setLatitude(fb.latitude());
            b.setLongitude(fb.longitude());
            b.setPaidSimple(fb.paidSimple());
            for (FilePayment fp : list(fb.payments())) {
                Payment p = new Payment();
                p.setBooking(b);
                p.setSequence(fp.sequence());
                p.setAmount(fp.amount());
                p.setDueDate(fp.dueDate());
                p.setPaid(fp.paid());
                p.setPaidDate(fp.paidDate());
                b.getPayments().add(p);
            }
            for (FileAttachment fa : list(fb.attachments())) {
                Attachment att = new Attachment();
                att.setBooking(b);
                att.setFileName(fa.fileName());
                att.setContentType(fa.contentType());
                att.setSize(fa.size());
                att.setStorageKey(fa.path());   // the service swaps this for a real key
                b.getAttachments().add(att);
            }
            trip.getBookings().add(b);
            bookings.put(fb.id(), b);
        }

        Map<Day, String> dayLinks = new IdentityHashMap<>();
        Map<Activity, String> stopSources = new IdentityHashMap<>();
        Map<String, Day> days = new HashMap<>();
        for (FileDay fd : list(file.days())) {
            Day day = new Day();
            day.setTrip(trip);
            day.setDate(fd.date());
            day.setCity(fd.city());
            day.setOvernightStay(fd.overnightStay());
            day.setNotes(fd.notes());
            day.setBuffer(fd.buffer());
            if (fd.linkedBookingId() != null && bookings.containsKey(fd.linkedBookingId())) {
                dayLinks.put(day, fd.linkedBookingId());
            }
            int order = 0;
            for (FileActivity fa : list(fd.activities())) {
                Activity a = new Activity();
                a.setDay(day);
                a.setName(fa.name());
                a.setType(parse(ActivityType.class, fa.type(), ActivityType.OTHER));
                a.setStartTime(fa.startTime());
                a.setEndTime(fa.endTime());
                a.setAddress(fa.address());
                a.setCostEstimate(fa.costEstimate());
                a.setCostCurrency(fa.costCurrency());
                a.setNotes(fa.notes());
                a.setPlace(fa.placeId() != null ? places.get(fa.placeId()) : null);
                a.setOrderIndex(order++);
                a.setTravelModeToNext(fa.travelModeToNext());
                a.setNeedsBooking(fa.needsBooking());
                a.setLatitude(fa.latitude());
                a.setLongitude(fa.longitude());
                a.setTravelKey(fa.travelKey());
                a.setTravelSeconds(fa.travelSeconds());
                a.setTravelMeters(fa.travelMeters());
                a.setTravelGeometry(fa.travelGeometry());
                a.setTravelEstimated(fa.travelEstimated());
                a.setTravelNote(fa.travelNote());
                if (fa.sourceBookingId() != null && bookings.containsKey(fa.sourceBookingId())) {
                    stopSources.put(a, fa.sourceBookingId());
                }
                day.getActivities().add(a);
            }
            trip.getDays().add(day);
            if (fd.id() != null) days.put(fd.id(), day);
        }
        // A booking that knew its day: the day is found by the file id it carried.
        for (FileBooking fb : list(file.bookings())) {
            Booking b = bookings.get(fb.id());
            Day day = fb.linkedDayId() != null ? days.get(fb.linkedDayId()) : null;
            if (b != null && day != null) b.setLinkedDayId(day.getId());
        }

        List<TodoItem> todos = new ArrayList<>();
        for (FileTodo ft : list(file.todos())) {
            TodoItem t = new TodoItem();
            t.setTrip(trip);
            t.setTitle(ft.title());
            t.setNotes(ft.notes());
            t.setGroupName(ft.groupName());
            t.setDueDate(ft.dueDate());
            t.setDone(ft.done());
            t.setOrderIndex(ft.orderIndex());
            t.setTemplateKey(ft.templateKey());
            todos.add(t);
        }

        List<PlaceFolder> folders = new ArrayList<>();
        for (FileFolder ff : list(file.folders())) {
            PlaceFolder f = new PlaceFolder();
            f.setOwner(owner);
            f.setTrip(trip);
            f.setName(ff.name());
            f.setColor(ff.color());
            for (String pid : list(ff.placeIds())) {
                Place p = places.get(pid);
                if (p != null) {
                    f.getPlaces().add(p);
                    trip.getPlaces().add(p);   // a folder of the trip holds trip places, as FolderService keeps it
                }
            }
            folders.add(f);
        }

        return new Built(trip, todos, folders, places, bookings, dayLinks, stopSources);
    }

    /** A place as the file describes it, for an importer whose library does not have it. */
    public static Place newPlace(FilePlace fp, User owner) {
        Place p = new Place();
        p.setOwner(owner);
        p.setName(fp.name() != null && !fp.name().isBlank() ? fp.name() : "Imported place");
        p.setType(parse(PlaceType.class, fp.type(), PlaceType.OTHER));
        p.setCountry(fp.country());
        p.setCity(fp.city());
        p.setAddress(fp.address());
        p.setLatitude(fp.latitude());
        p.setLongitude(fp.longitude());
        p.setDescription(fp.description());
        p.setPhotos(new ArrayList<>(list(fp.photos())));   // archive paths included, for the service to store
        p.setLinks(new ArrayList<>(list(fp.links())));
        p.setOsmId(fp.osmId());
        p.setRating(fp.rating() >= 1 && fp.rating() <= 5 ? fp.rating() : 3);
        p.setRatingComment(fp.ratingComment());
        p.setVisitMinutes(fp.visitMinutes());
        p.setAudience(parse(PlaceAudience.class, fp.audience(), PlaceAudience.ALL));
        p.setNeedsPreparation(fp.needsPreparation());
        p.setNeedsBooking(fp.needsBooking());
        p.setSource(parse(PlaceSource.class, fp.source(), PlaceSource.IMPORTED));
        return p;
    }

    /**
     * The raw-id links, once the bookings have ids to be linked to: a day's hotel
     * booking, and the booking a stop was written from.
     */
    public static void wireLinks(Built built) {
        built.dayLinks().forEach((day, fileId) -> {
            Booking b = built.bookings().get(fileId);
            if (b != null) {
                day.setLinkedBookingId(b.getId());
                b.setLinkedDayId(day.getId());
            }
        });
        built.stopSources().forEach((stop, fileId) -> {
            Booking b = built.bookings().get(fileId);
            if (b != null) stop.setSourceBookingId(b.getId());
        });
    }

    /* ---- helpers ---- */

    private static String id(UUID id) {
        return id == null ? null : id.toString();
    }

    private static String name(Enum<?> e) {
        return e == null ? null : e.name();
    }

    private static <T> List<T> list(List<T> l) {
        return l == null ? List.of() : l;
    }

    private static <E extends Enum<E>> E parse(Class<E> type, String value, E fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return Enum.valueOf(type, value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            if (fallback != null) return fallback;
            throw new IllegalArgumentException("Not a Tripyfull trip file: unknown " + type.getSimpleName() + " \"" + value + "\"");
        }
    }
}
