package com.tripyfull.service;

import com.tripyfull.dto.*;
import com.tripyfull.mapper.BookingMapper;
import com.tripyfull.model.Attachment;
import com.tripyfull.model.Booking;
import com.tripyfull.model.BookingCategory;
import com.tripyfull.model.Payment;
import com.tripyfull.model.Trip;
import com.tripyfull.model.User;
import com.tripyfull.repository.AttachmentRepository;
import com.tripyfull.repository.BookingRepository;
import com.tripyfull.repository.PaymentRepository;
import com.tripyfull.security.OwnershipGuard;
import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ExchangeRateService exchangeRateService;
    private final GeoSearchService geoSearchService;
    private final FileStorageService fileStorageService;
    private final AttachmentRepository attachmentRepository;
    private final OwnershipGuard guard;

    public BookingService(BookingRepository bookingRepository, PaymentRepository paymentRepository,
                          ExchangeRateService exchangeRateService, GeoSearchService geoSearchService,
                          FileStorageService fileStorageService, AttachmentRepository attachmentRepository,
                          OwnershipGuard guard) {
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.exchangeRateService = exchangeRateService;
        this.geoSearchService = geoSearchService;
        this.fileStorageService = fileStorageService;
        this.attachmentRepository = attachmentRepository;
        this.guard = guard;
    }

    public List<BookingResponse> getBookings(UUID tripId, String username) {
        findTripForUser(tripId, username);
        return bookingRepository.findByTripIdOrderByNameAsc(tripId).stream()
                .map(BookingMapper::toResponse)
                .toList();
    }

    public BookingResponse create(UUID tripId, BookingRequest request, String username) {
        User user = findUser(username);
        Trip trip = findTripForUser(tripId, user);
        validateAccommodation(request);
        validateBookingDates(request, trip);
        Booking booking = BookingMapper.toEntity(request);
        booking.setTrip(trip);
        autoFillExchangeRate(booking, user.getBaseCurrency());
        autoFillLocation(booking);
        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    public BookingResponse update(UUID bookingId, BookingRequest request, String username) {
        User user = findUser(username);
        Booking booking = findBookingForUser(bookingId, user);
        validateAccommodation(request);
        validateBookingDates(request, booking.getTrip());
        BookingMapper.updateEntity(booking, request);
        autoFillExchangeRate(booking, user.getBaseCurrency());
        autoFillLocation(booking);
        return BookingMapper.toResponse(bookingRepository.save(booking));
    }

    public void delete(UUID bookingId, String username) {
        Booking booking = findBookingForUser(bookingId, username);
        // Remove stored files before the rows cascade-delete.
        for (Attachment a : booking.getAttachments()) {
            fileStorageService.delete(a.getStorageKey());
        }
        bookingRepository.delete(booking);
    }

    public BookingResponse addAttachment(UUID bookingId, MultipartFile file, String username) {
        Booking booking = findBookingForUser(bookingId, username);
        String key = fileStorageService.store(file, booking.getId());
        Attachment a = new Attachment();
        a.setBooking(booking);
        String name = file.getOriginalFilename();
        a.setFileName(name != null && !name.isBlank() ? name : "file");
        a.setContentType(file.getContentType());
        a.setSize(file.getSize());
        a.setStorageKey(key);
        booking.getAttachments().add(a);
        bookingRepository.save(booking);
        return BookingMapper.toResponse(booking);
    }

    public Attachment getAttachmentForUser(UUID attachmentId, String username) {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));
        findBookingForUser(a.getBooking().getId(), username);
        return a;
    }

    public BookingResponse deleteAttachment(UUID attachmentId, String username) {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment not found"));
        Booking booking = findBookingForUser(a.getBooking().getId(), username);
        booking.getAttachments().remove(a);
        attachmentRepository.delete(a);
        fileStorageService.delete(a.getStorageKey());
        return BookingMapper.toResponse(booking);
    }

    public BookingResponse addPayment(UUID bookingId, PaymentRequest request, String username) {
        Booking booking = findBookingForUser(bookingId, username);

        // Validate total payments don't exceed full price
        if (booking.getFullPrice() != null) {
            BigDecimal currentTotal = booking.getPayments().stream()
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal newTotal = currentTotal.add(request.amount());
            if (newTotal.compareTo(booking.getFullPrice()) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Payment total (" + newTotal + ") would exceed full price (" + booking.getFullPrice() + ")");
            }
        }

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setSequence(booking.getPayments().size() + 1);
        payment.setAmount(request.amount());
        payment.setDueDate(request.dueDate());
        booking.getPayments().add(payment);
        bookingRepository.save(booking);
        return BookingMapper.toResponse(booking);
    }

    public BookingResponse updatePayment(UUID paymentId, PaymentRequest request, String username) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        Booking booking = payment.getBooking();
        findBookingForUser(booking.getId(), username);

        // Validate new total won't exceed full price
        if (booking.getFullPrice() != null && request.amount() != null) {
            BigDecimal otherPayments = booking.getPayments().stream()
                    .filter(p -> !p.getId().equals(paymentId))
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal newTotal = otherPayments.add(request.amount());
            if (newTotal.compareTo(booking.getFullPrice()) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Payment total (" + newTotal + ") would exceed full price (" + booking.getFullPrice() + ")");
            }
        }

        if (request.amount() != null) payment.setAmount(request.amount());
        if (Boolean.TRUE.equals(request.clearDueDate())) payment.setDueDate(null);
        else if (request.dueDate() != null) payment.setDueDate(request.dueDate());
        paymentRepository.save(payment);
        return BookingMapper.toResponse(booking);
    }

    public BookingResponse deletePayment(UUID paymentId, String username) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        Booking booking = payment.getBooking();
        findBookingForUser(booking.getId(), username);
        booking.getPayments().remove(payment);
        paymentRepository.delete(payment);
        return BookingMapper.toResponse(booking);
    }

    public BookingResponse markPaymentPaid(UUID paymentId, String username) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        findBookingForUser(payment.getBooking().getId(), username);
        payment.setPaid(true);
        payment.setPaidDate(LocalDate.now());
        paymentRepository.save(payment);
        return BookingMapper.toResponse(payment.getBooking());
    }

    public BookingResponse markPaymentUnpaid(UUID paymentId, String username) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        findBookingForUser(payment.getBooking().getId(), username);
        payment.setPaid(false);
        payment.setPaidDate(null);
        paymentRepository.save(payment);
        return BookingMapper.toResponse(payment.getBooking());
    }

    private void autoFillExchangeRate(Booking booking, String baseCurrency) {
        String priceCur = booking.getPriceCurrency();
        if (priceCur != null && baseCurrency != null && !priceCur.equalsIgnoreCase(baseCurrency)
                && booking.getExchangeRate() == null) {
            try {
                var rate = exchangeRateService.getRate(priceCur, baseCurrency);
                if (rate != null) booking.setExchangeRate(rate);
            } catch (Exception ignored) {}
        }
    }

    /**
     * Coordinates for whatever the booking is about, when the form did not
     * already supply them: name + city for a stay, the two endpoint names for a
     * journey. Without this a booking typed in by hand — or imported — had no
     * pin, and the map beside it stayed empty.
     */
    private void autoFillLocation(Booking booking) {
        if (booking.getCategory() == BookingCategory.TRANSPORTATION) {
            autoFillRoute(booking);
            return;
        }
        if (booking.getCategory() == BookingCategory.ACTIVITY) {
            // Where the activity happens is typed into the location field; a name
            // typed rather than picked deserves a pin too.
            if (booking.getLatitude() == null && notBlank(booking.getFromPlace())) {
                GeoSearchService.PlaceResult place = geocodeQuietly(booking.getFromPlace());
                if (place != null) {
                    booking.setLatitude(place.lat());
                    booking.setLongitude(place.lon());
                    if (!notBlank(booking.getAddress())) booking.setAddress(place.displayName());
                }
            }
            return;
        }
        if (booking.getCategory() != BookingCategory.ACCOMMODATION) return;
        if (booking.getLatitude() != null && booking.getLongitude() != null) return; // coords already supplied
        String name = booking.getName();
        if (name == null || name.isBlank()) return;
        String city = booking.getAccommodationCity();
        String query = (city != null && !city.isBlank()) ? name + ", " + city : name;
        try {
            GeoSearchService.PlaceResult place = geoSearchService.geocodeOne(query);
            if (place != null) {
                booking.setLatitude(place.lat());
                booking.setLongitude(place.lon());
                if (booking.getAddress() == null || booking.getAddress().isBlank()) {
                    booking.setAddress(place.displayName());
                }
            }
        } catch (Exception ignored) {
            // geocoding is best-effort; never block a save on it
        }
    }

    /** Both ends of a journey, each geocoded once and then kept. */
    private void autoFillRoute(Booking booking) {
        if (booking.getFromLatitude() == null && notBlank(booking.getFromPlace())) {
            GeoSearchService.PlaceResult from = geocodeQuietly(booking.getFromPlace());
            if (from != null) {
                booking.setFromLatitude(from.lat());
                booking.setFromLongitude(from.lon());
            }
        }
        if (booking.getToLatitude() == null && notBlank(booking.getToPlace())) {
            GeoSearchService.PlaceResult to = geocodeQuietly(booking.getToPlace());
            if (to != null) {
                booking.setToLatitude(to.lat());
                booking.setToLongitude(to.lon());
            }
        }
    }

    private boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private GeoSearchService.PlaceResult geocodeQuietly(String query) {
        try {
            return geoSearchService.geocodeOne(query);
        } catch (Exception ignored) {
            return null; // best-effort; never block a save on geocoding
        }
    }

    private void validateBookingDates(BookingRequest request, Trip trip) {
        if (trip.getStartDate() == null || trip.getEndDate() == null) return;
        LocalDate tripStart = trip.getStartDate();
        LocalDate tripEnd = trip.getEndDate();

        if (request.checkIn() != null && request.checkIn().isBefore(tripStart)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Check-in date " + request.checkIn() + " is before trip start " + tripStart);
        }
        if (request.checkOut() != null && request.checkOut().isAfter(tripEnd.plusDays(1))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Check-out date " + request.checkOut() + " is after trip end " + tripEnd);
        }
    }

    private void validateAccommodation(BookingRequest request) {
        if ("ACCOMMODATION".equals(request.category())
                && (request.accommodationCity() == null || request.accommodationCity().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "City is required for accommodation bookings");
        }
    }

    private User findUser(String username) {
        return guard.requireUser(username);
    }

    private Trip findTripForUser(UUID tripId, String username) {
        return guard.requireTrip(tripId, username);
    }

    private Trip findTripForUser(UUID tripId, User user) {
        return guard.requireTrip(tripId, user);
    }

    private Booking findBookingForUser(UUID bookingId, String username) {
        return findBookingForUser(bookingId, findUser(username));
    }

    private Booking findBookingForUser(UUID bookingId, User user) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        findTripForUser(booking.getTrip().getId(), user);
        return booking;
    }
}
