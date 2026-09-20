package com.tripyfull.mapper;

import com.tripyfull.dto.TripFile;
import com.tripyfull.mapper.TripFileMapper.Built;
import com.tripyfull.mapper.TripFileMapper.Packed;
import com.tripyfull.model.Activity;
import com.tripyfull.model.ActivityType;
import com.tripyfull.model.Attachment;
import com.tripyfull.model.Booking;
import com.tripyfull.model.BookingCategory;
import com.tripyfull.model.Day;
import com.tripyfull.model.Payment;
import com.tripyfull.model.Place;
import com.tripyfull.model.PlaceFolder;
import com.tripyfull.model.PlaceType;
import com.tripyfull.model.TodoItem;
import com.tripyfull.model.TransportMode;
import com.tripyfull.model.Trip;
import com.tripyfull.model.TripStatus;
import com.tripyfull.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * A trip goes out as a file and comes back as the same trip. The graph built
 * here is the seeded consultant's trip in miniature: two dated days and a
 * reserve day, a stop on a library place with one of our photos and one of
 * Google's, a hotel booking that writes a stop and owns a night, two
 * instalments and a ticket, a to-do, a folder. The file is written to JSON and
 * read back in between, the way the archive carries it.
 */
class TripFileMapperTest {

    // Jackson 3, as the server uses: java.time is understood without a module.
    private static final ObjectMapper JSON = JsonMapper.builder().build();

    private static final String OWN_PHOTO = "/api/place-photos/11111111-1111-1111-1111-111111111111/a1.jpg";
    private static final String GOOGLE_PHOTO = "https://lh3.googleusercontent.com/p/x=s4800-w1200";

    private User owner;
    private Trip trip;
    private Place alcazar;
    private Booking hotel;
    private Day day1;
    private Day day2;
    private Day spare;
    private PlaceFolder folder;
    private TodoItem todo;

    /** Entities get their ids from the database; here they get them from us. */
    private static void setId(Object entity, UUID id) throws Exception {
        Field f = entity.getClass().getDeclaredField("id");
        f.setAccessible(true);
        f.set(entity, id);
    }

    @BeforeEach
    void aTripInMiniature() throws Exception {
        owner = new User();

        alcazar = new Place();
        setId(alcazar, UUID.fromString("11111111-1111-1111-1111-111111111111"));
        alcazar.setOwner(owner);
        alcazar.setName("Real Alcázar");
        alcazar.setType(PlaceType.SIGHTSEEING);
        alcazar.setCountry("ES");
        alcazar.setCity("Seville");
        alcazar.setLatitude(new BigDecimal("37.3831"));
        alcazar.setLongitude(new BigDecimal("-5.9902"));
        alcazar.setOsmId("g:ChIJalcazar");
        alcazar.setRating(5);
        alcazar.setRatingComment("Book the first slot");
        alcazar.getPhotos().add(OWN_PHOTO);
        alcazar.getPhotos().add(GOOGLE_PHOTO);
        alcazar.getLinks().add("https://www.alcazarsevilla.org");

        trip = new Trip();
        setId(trip, UUID.randomUUID());
        trip.setOwner(owner);
        trip.setTitle("Andalusia — Familie Ortmann");
        trip.setDestination("Seville");
        trip.setStartDate(LocalDate.of(2027, 5, 3));
        trip.setEndDate(LocalDate.of(2027, 5, 4));
        trip.setBaseCurrency("CHF");
        trip.setStatus(TripStatus.PLANNED);
        trip.getPlaces().add(alcazar);

        hotel = new Booking();
        setId(hotel, UUID.randomUUID());
        hotel.setTrip(trip);
        hotel.setName("Hotel Alfonso XIII");
        hotel.setCategory(BookingCategory.ACCOMMODATION);
        hotel.setAccommodationCity("Seville");
        hotel.setCheckIn(LocalDate.of(2027, 5, 3));
        hotel.setCheckOut(LocalDate.of(2027, 5, 4));
        hotel.setCheckInTime(LocalTime.of(15, 0));
        hotel.setFullPrice(new BigDecimal("420.00"));
        hotel.setPriceCurrency("EUR");
        hotel.setExchangeRate(new BigDecimal("0.9612"));
        Payment first = new Payment();
        first.setBooking(hotel);
        first.setSequence(1);
        first.setAmount(new BigDecimal("120.00"));
        first.setDueDate(LocalDate.of(2027, 1, 10));
        first.setPaid(true);
        first.setPaidDate(LocalDate.of(2027, 1, 9));
        Payment second = new Payment();
        second.setBooking(hotel);
        second.setSequence(2);
        second.setAmount(new BigDecimal("300.00"));
        second.setDueDate(LocalDate.of(2027, 4, 20));
        hotel.getPayments().add(second);   // out of order on purpose
        hotel.getPayments().add(first);
        Attachment ticket = new Attachment();
        setId(ticket, UUID.randomUUID());
        ticket.setBooking(hotel);
        ticket.setFileName("voucher.pdf");
        ticket.setContentType("application/pdf");
        ticket.setSize(12345);
        ticket.setStorageKey(hotel.getId() + "/abc_voucher.pdf");
        hotel.getAttachments().add(ticket);
        trip.getBookings().add(hotel);

        Booking train = new Booking();
        setId(train, UUID.randomUUID());
        train.setTrip(trip);
        train.setName("Madrid to Seville");
        train.setCategory(BookingCategory.TRANSPORTATION);
        train.setTransportMode(TransportMode.TRAIN);
        train.setDepartureAt(LocalDateTime.of(2027, 5, 3, 9, 0));
        train.setArrivalAt(LocalDateTime.of(2027, 5, 3, 11, 32));
        train.setFullPrice(new BigDecimal("89.00"));
        train.setPriceCurrency("EUR");
        trip.getBookings().add(train);

        day1 = new Day();
        setId(day1, UUID.randomUUID());
        day1.setTrip(trip);
        day1.setDate(LocalDate.of(2027, 5, 3));
        day1.setCity("Seville");
        day1.setOvernightStay("Hotel Alfonso XIII");
        day1.setLinkedBookingId(hotel.getId());
        hotel.setLinkedDayId(day1.getId());
        Activity visit = new Activity();
        setId(visit, UUID.randomUUID());
        visit.setDay(day1);
        visit.setName("Real Alcázar");
        visit.setType(ActivityType.SIGHTSEEING);
        visit.setPlace(alcazar);
        visit.setStartTime(LocalTime.of(9, 30));
        visit.setOrderIndex(0);
        visit.setTravelModeToNext("walk");
        visit.setTravelKey("walk|37.3831,-5.9902;37.3858,-5.9931");
        visit.setTravelSeconds(600);
        visit.setTravelMeters(750);
        visit.setCostEstimate(new BigDecimal("14.50"));
        visit.setCostCurrency("EUR");
        Activity checkIn = new Activity();
        setId(checkIn, UUID.randomUUID());
        checkIn.setDay(day1);
        checkIn.setName("Check in · Hotel Alfonso XIII");
        checkIn.setType(ActivityType.ACCOMMODATION);
        checkIn.setSourceBookingId(hotel.getId());
        checkIn.setOrderIndex(1);
        checkIn.setLatitude(37.3858);
        checkIn.setLongitude(-5.9931);
        day1.getActivities().add(checkIn);   // out of order on purpose
        day1.getActivities().add(visit);

        day2 = new Day();
        setId(day2, UUID.randomUUID());
        day2.setTrip(trip);
        day2.setDate(LocalDate.of(2027, 5, 4));
        day2.setCity("Seville");

        spare = new Day();
        setId(spare, UUID.randomUUID());
        spare.setTrip(trip);
        spare.setBuffer(true);
        spare.setNotes("Rain plan");
        Activity idea = new Activity();
        setId(idea, UUID.randomUUID());
        idea.setDay(spare);
        idea.setName("Italica");
        idea.setType(ActivityType.SIGHTSEEING);
        spare.getActivities().add(idea);

        trip.getDays().add(spare);   // undated first on purpose: the file must sort it last
        trip.getDays().add(day2);
        trip.getDays().add(day1);

        folder = new PlaceFolder();
        folder.setOwner(owner);
        folder.setTrip(trip);
        folder.setName("Must see");
        folder.setColor("#0e5c55");
        folder.getPlaces().add(alcazar);

        todo = new TodoItem();
        todo.setTrip(trip);
        todo.setTitle("Book Alcázar tickets");
        todo.setGroupName("Before we go");
        todo.setDueDate(LocalDate.of(2027, 4, 1));
        todo.setOrderIndex(3);
        todo.setTemplateKey("tickets");
    }

    private Packed export() {
        return TripFileMapper.toFile(trip, List.of(todo), List.of(folder),
                url -> url.startsWith("/api/place-photos/") ? "places/" + url.substring("/api/place-photos/".length()) : null);
    }

    private TripFile throughJson(TripFile file) throws Exception {
        return JSON.readValue(JSON.writeValueAsBytes(file), TripFile.class);
    }

    @Test
    @DisplayName("our own photo and the ticket travel in the archive; Google's photo stays a link")
    void storedFilesArePackedAndLinksAreLeft() {
        Packed packed = export();
        TripFile.FilePlace place = packed.file().places().get(0);

        assertThat(place.photos()).hasSize(2);
        assertThat(place.photos().get(0)).startsWith("files/photos/").endsWith("/a1.jpg");
        assertThat(place.photos().get(1)).isEqualTo(GOOGLE_PHOTO);
        assertThat(packed.entries()).containsEntry(place.photos().get(0),
                "places/11111111-1111-1111-1111-111111111111/a1.jpg");

        TripFile.FileAttachment att = packed.file().bookings().stream()
                .filter(b -> b.name().equals("Hotel Alfonso XIII")).findFirst().orElseThrow()
                .attachments().get(0);
        assertThat(att.fileName()).isEqualTo("voucher.pdf");
        assertThat(att.path()).startsWith("files/attachments/").endsWith("/voucher.pdf");
        assertThat(packed.entries()).containsEntry(att.path(), hotel.getId() + "/abc_voucher.pdf");
        assertThat(packed.entries()).hasSize(2);
    }

    @Test
    @DisplayName("the file is in a steady order: dated days by date, the reserve day last, stops and instalments by number")
    void theFileIsOrdered() {
        TripFile file = export().file();

        assertThat(file.format()).isEqualTo("tripyfull-trip");
        assertThat(file.version()).isEqualTo(1);
        assertThat(file.days()).extracting(TripFile.FileDay::date)
                .containsExactly(LocalDate.of(2027, 5, 3), LocalDate.of(2027, 5, 4), null);
        assertThat(file.days().get(2).buffer()).isTrue();
        assertThat(file.days().get(0).activities()).extracting(TripFile.FileActivity::name)
                .containsExactly("Real Alcázar", "Check in · Hotel Alfonso XIII");
        assertThat(file.bookings().get(0).payments()).extracting(TripFile.FilePayment::sequence)
                .containsExactly(1, 2);
    }

    @Test
    @DisplayName("out as a file, through JSON, and back as the same trip")
    void roundTrip() throws Exception {
        TripFile file = throughJson(export().file());
        User importer = new User();
        Map<String, Place> made = new HashMap<>();
        Built built = TripFileMapper.toTrip(file, importer, fp -> made.computeIfAbsent(fp.id(),
                k -> TripFileMapper.newPlace(fp, importer)));
        Trip t = built.trip();

        // The trip
        assertThat(t.getOwner()).isSameAs(importer);
        assertThat(t.getTitle()).isEqualTo("Andalusia — Familie Ortmann");
        assertThat(t.getBaseCurrency()).isEqualTo("CHF");
        assertThat(t.getStatus()).isEqualTo(TripStatus.PLANNED);
        assertThat(t.getStartDate()).isEqualTo(LocalDate.of(2027, 5, 3));

        // The place, once, on the shortlist and behind the stop and in the folder — the same object
        assertThat(made).hasSize(1);
        Place p = made.values().iterator().next();
        assertThat(p.getOwner()).isSameAs(importer);
        assertThat(p.getName()).isEqualTo("Real Alcázar");
        assertThat(p.getOsmId()).isEqualTo("g:ChIJalcazar");
        assertThat(p.getRating()).isEqualTo(5);
        assertThat(p.getLatitude()).isEqualByComparingTo("37.3831");
        assertThat(p.getPhotos()).hasSize(2);
        assertThat(p.getPhotos().get(0)).startsWith("files/photos/");   // for the service to store
        assertThat(p.getPhotos().get(1)).isEqualTo(GOOGLE_PHOTO);
        assertThat(t.getPlaces()).containsExactly(p);
        assertThat(built.folders()).hasSize(1);
        assertThat(built.folders().get(0).getName()).isEqualTo("Must see");
        assertThat(built.folders().get(0).getPlaces()).containsExactly(p);
        assertThat(built.folders().get(0).getTrip()).isSameAs(t);

        // Days, in order, with their stops in order
        assertThat(t.getDays()).hasSize(3);
        Day d1 = t.getDays().get(0);
        assertThat(d1.getDate()).isEqualTo(LocalDate.of(2027, 5, 3));
        assertThat(d1.getOvernightStay()).isEqualTo("Hotel Alfonso XIII");
        assertThat(d1.getActivities()).extracting(Activity::getName)
                .containsExactly("Real Alcázar", "Check in · Hotel Alfonso XIII");
        assertThat(d1.getActivities()).extracting(Activity::getOrderIndex).containsExactly(0, 1);
        Activity v = d1.getActivities().get(0);
        assertThat(v.getPlace()).isSameAs(p);
        assertThat(v.getStartTime()).isEqualTo(LocalTime.of(9, 30));
        assertThat(v.getTravelKey()).isEqualTo("walk|37.3831,-5.9902;37.3858,-5.9931");
        assertThat(v.getTravelSeconds()).isEqualTo(600);
        assertThat(v.getCostEstimate()).isEqualByComparingTo("14.50");
        assertThat(t.getDays().get(2).isBuffer()).isTrue();
        assertThat(t.getDays().get(2).getNotes()).isEqualTo("Rain plan");
        assertThat(t.getDays().get(2).getActivities()).extracting(Activity::getName).containsExactly("Italica");

        // Bookings with their instalments and the ticket still pointing into the archive
        assertThat(t.getBookings()).hasSize(2);
        Booking h = t.getBookings().stream().filter(b -> b.getName().equals("Hotel Alfonso XIII")).findFirst().orElseThrow();
        assertThat(h.getTrip()).isSameAs(t);
        assertThat(h.getCategory()).isEqualTo(BookingCategory.ACCOMMODATION);
        assertThat(h.getCheckInTime()).isEqualTo(LocalTime.of(15, 0));
        assertThat(h.getExchangeRate()).isEqualByComparingTo("0.9612");
        assertThat(h.getPayments()).hasSize(2);
        assertThat(h.getPayments().get(0).getAmount()).isEqualByComparingTo("120.00");
        assertThat(h.getPayments().get(0).isPaid()).isTrue();
        assertThat(h.getPayments().get(0).getPaidDate()).isEqualTo(LocalDate.of(2027, 1, 9));
        assertThat(h.getPayments().get(1).getAmount()).isEqualByComparingTo("300.00");
        assertThat(h.getPayments().get(1).isPaid()).isFalse();
        assertThat(h.getAttachments()).hasSize(1);
        assertThat(h.getAttachments().get(0).getFileName()).isEqualTo("voucher.pdf");
        assertThat(h.getAttachments().get(0).getStorageKey()).startsWith("files/attachments/");
        Booking tr = t.getBookings().stream().filter(b -> b.getName().equals("Madrid to Seville")).findFirst().orElseThrow();
        assertThat(tr.getTransportMode()).isEqualTo(TransportMode.TRAIN);
        assertThat(tr.getDepartureAt()).isEqualTo(LocalDateTime.of(2027, 5, 3, 9, 0));

        // The links a save must finish: the day's night and the stop's source both point at the hotel
        assertThat(built.dayLinks()).containsEntry(d1, hotel.getId().toString());
        assertThat(built.stopSources()).containsEntry(d1.getActivities().get(1), hotel.getId().toString());
        assertThat(built.bookings().get(hotel.getId().toString())).isSameAs(h);

        // The to-do
        assertThat(built.todos()).hasSize(1);
        assertThat(built.todos().get(0).getTitle()).isEqualTo("Book Alcázar tickets");
        assertThat(built.todos().get(0).getTemplateKey()).isEqualTo("tickets");
        assertThat(built.todos().get(0).getTrip()).isSameAs(t);
    }

    @Test
    @DisplayName("a place the importer's library already has is used as it is, not made again")
    void aKnownPlaceIsReused() throws Exception {
        TripFile file = throughJson(export().file());
        Place mine = new Place();
        mine.setName("Alcázar (mine, renamed)");
        Built built = TripFileMapper.toTrip(file, new User(), fp -> mine);

        assertThat(built.trip().getPlaces()).containsExactly(mine);
        assertThat(built.trip().getDays().get(0).getActivities().get(0).getPlace()).isSameAs(mine);
        assertThat(built.folders().get(0).getPlaces()).containsExactly(mine);
        assertThat(mine.getName()).isEqualTo("Alcázar (mine, renamed)");
    }

    @Test
    @DisplayName("a file that is not ours, or from a later Tripyfull, is refused in words")
    void otherFilesAreRefused() {
        TripFile other = new TripFile("somebody-elses-format", 1, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> TripFileMapper.toTrip(other, new User(), fp -> null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Not a Tripyfull trip file");
        TripFile newer = new TripFile("tripyfull-trip", 2, null, null, null, null, null, null, null);
        assertThatThrownBy(() -> TripFileMapper.toTrip(newer, new User(), fp -> null))
                .hasMessageContaining("newer Tripyfull");
    }

    @Test
    @DisplayName("an empty but honest file makes an empty trip rather than an error")
    void anEmptyFileIsAnEmptyTrip() {
        TripFile empty = new TripFile("tripyfull-trip", 1, null,
                new TripFile.Details("  ", null, null, null, null, null, "nonsense"),
                null, null, null, null, null);
        Trip t = TripFileMapper.toTrip(empty, new User(), fp -> null).trip();
        assertThat(t.getTitle()).isEqualTo("Imported trip");
        assertThat(t.getBaseCurrency()).isEqualTo("EUR");
        assertThat(t.getStatus()).isEqualTo(TripStatus.DRAFT);
        assertThat(t.getDays()).isEmpty();
    }
}
