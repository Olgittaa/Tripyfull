package com.tripyfull.mapper;

import com.tripyfull.dto.AttachmentResponse;
import com.tripyfull.dto.BookingRequest;
import com.tripyfull.dto.BookingResponse;
import com.tripyfull.dto.PaymentResponse;
import com.tripyfull.model.Attachment;
import com.tripyfull.model.Booking;
import com.tripyfull.model.BookingCategory;
import com.tripyfull.model.Payment;
import com.tripyfull.model.TransportMode;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.List;

public final class BookingMapper {

    private BookingMapper() {}

    public static Booking toEntity(BookingRequest req) {
        Booking b = new Booking();
        b.setName(req.name());
        if (req.category() != null) b.setCategory(BookingCategory.valueOf(req.category()));
        b.setVendor(req.vendor());
        b.setConfirmationNumber(req.confirmationNumber());
        b.setBookingUrl(req.bookingUrl());
        b.setFullPrice(req.fullPrice());
        b.setPriceCurrency(req.priceCurrency());
        b.setExchangeRate(req.exchangeRate());
        b.setNotes(req.notes());
        b.setLinkedDayId(req.linkedDayId());
        b.setFlightNumber(req.flightNumber());
        b.setFromPlace(req.fromPlace());
        b.setToPlace(req.toPlace());
        b.setDepartureAt(req.departureAt());
        b.setArrivalAt(req.arrivalAt());
        if (req.transportMode() != null) b.setTransportMode(TransportMode.valueOf(req.transportMode()));
        b.setFromIata(req.fromIata());
        b.setToIata(req.toIata());
        b.setDepartureTerminal(req.departureTerminal());
        b.setArrivalTerminal(req.arrivalTerminal());
        b.setSeat(req.seat());
        b.setVesselName(req.vesselName());
        b.setCabin(req.cabin());
        b.setCarClass(req.carClass());
        b.setAccommodationCity(req.accommodationCity());
        b.setCheckIn(req.checkIn());
        b.setCheckOut(req.checkOut());
        b.setCheckInTime(req.checkInTime());
        b.setCheckOutTime(req.checkOutTime());
        b.setRoomType(req.roomType());
        b.setGuests(req.guests());
        b.setAddress(req.address());
        b.setLatitude(req.latitude());
        b.setLongitude(req.longitude());
        b.setFromLatitude(req.fromLatitude());
        b.setFromLongitude(req.fromLongitude());
        b.setToLatitude(req.toLatitude());
        b.setToLongitude(req.toLongitude());
        if (req.paidSimple() != null) b.setPaidSimple(req.paidSimple());
        return b;
    }

    public static void updateEntity(Booking b, BookingRequest req) {
        if (req.name() != null) b.setName(req.name());
        if (req.category() != null) b.setCategory(BookingCategory.valueOf(req.category()));
        if (req.vendor() != null) b.setVendor(req.vendor());
        if (req.confirmationNumber() != null) b.setConfirmationNumber(req.confirmationNumber());
        if (req.bookingUrl() != null) b.setBookingUrl(req.bookingUrl());
        if (req.fullPrice() != null) b.setFullPrice(req.fullPrice());
        if (req.priceCurrency() != null) b.setPriceCurrency(req.priceCurrency());
        if (Boolean.TRUE.equals(req.clearExchangeRate())) b.setExchangeRate(null);
        else if (req.exchangeRate() != null) b.setExchangeRate(req.exchangeRate());
        if (req.notes() != null) b.setNotes(req.notes());
        if (req.linkedDayId() != null) b.setLinkedDayId(req.linkedDayId());
        if (req.flightNumber() != null) b.setFlightNumber(req.flightNumber());
        if (req.fromPlace() != null) b.setFromPlace(req.fromPlace());
        if (req.toPlace() != null) b.setToPlace(req.toPlace());
        if (req.departureAt() != null) b.setDepartureAt(req.departureAt());
        if (req.arrivalAt() != null) b.setArrivalAt(req.arrivalAt());
        if (req.transportMode() != null) b.setTransportMode(TransportMode.valueOf(req.transportMode()));
        if (req.fromIata() != null) b.setFromIata(req.fromIata());
        if (req.toIata() != null) b.setToIata(req.toIata());
        if (req.departureTerminal() != null) b.setDepartureTerminal(req.departureTerminal());
        if (req.arrivalTerminal() != null) b.setArrivalTerminal(req.arrivalTerminal());
        if (req.seat() != null) b.setSeat(req.seat());
        if (req.vesselName() != null) b.setVesselName(req.vesselName());
        if (req.cabin() != null) b.setCabin(req.cabin());
        if (req.carClass() != null) b.setCarClass(req.carClass());
        if (req.accommodationCity() != null) b.setAccommodationCity(req.accommodationCity());
        if (req.checkIn() != null) b.setCheckIn(req.checkIn());
        if (req.checkOut() != null) b.setCheckOut(req.checkOut());
        if (req.checkInTime() != null) b.setCheckInTime(req.checkInTime());
        if (req.checkOutTime() != null) b.setCheckOutTime(req.checkOutTime());
        if (req.roomType() != null) b.setRoomType(req.roomType());
        if (req.guests() != null) b.setGuests(req.guests());
        if (req.address() != null) b.setAddress(req.address());
        if (req.latitude() != null) b.setLatitude(req.latitude());
        if (req.longitude() != null) b.setLongitude(req.longitude());
        if (req.fromLatitude() != null) b.setFromLatitude(req.fromLatitude());
        if (req.fromLongitude() != null) b.setFromLongitude(req.fromLongitude());
        if (req.toLatitude() != null) b.setToLatitude(req.toLatitude());
        if (req.toLongitude() != null) b.setToLongitude(req.toLongitude());
        if (req.paidSimple() != null) b.setPaidSimple(req.paidSimple());
    }

    public static BookingResponse toResponse(Booking b) {
        List<PaymentResponse> payments = b.getPayments().stream()
                .map(BookingMapper::toPaymentResponse)
                .toList();

        List<AttachmentResponse> attachments = b.getAttachments().stream()
                .map(BookingMapper::toAttachmentResponse)
                .toList();

        BigDecimal paidTotal = b.getPayments().stream()
                .filter(Payment::isPaid)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remainingTotal = b.getPayments().stream()
                .filter(p -> !p.isPaid())
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Derived fields
        Integer nights = null;
        BigDecimal pricePerNight = null;
        if (b.getCheckIn() != null && b.getCheckOut() != null) {
            long n = ChronoUnit.DAYS.between(b.getCheckIn(), b.getCheckOut());
            if (n > 0) {
                nights = (int) n;
                if (b.getFullPrice() != null) {
                    pricePerNight = b.getFullPrice().divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
                }
            }
        }
        Integer durationMinutes = null;
        if (b.getDepartureAt() != null && b.getArrivalAt() != null) {
            long mins = ChronoUnit.MINUTES.between(b.getDepartureAt(), b.getArrivalAt());
            if (mins > 0) durationMinutes = (int) mins;
        }

        return new BookingResponse(
                b.getId(), b.getName(),
                b.getCategory() != null ? b.getCategory().name() : null,
                b.getVendor(), b.getConfirmationNumber(), b.getBookingUrl(), b.getFullPrice(),
                b.getPriceCurrency(), b.getExchangeRate(), b.getNotes(),
                b.getLinkedDayId(), b.getFlightNumber(), b.getFromPlace(), b.getToPlace(),
                b.getDepartureAt(), b.getArrivalAt(),
                b.getTransportMode() != null ? b.getTransportMode().name() : null,
                b.getFromIata(), b.getToIata(),
                b.getDepartureTerminal(), b.getArrivalTerminal(), b.getSeat(),
                b.getVesselName(), b.getCabin(), b.getCarClass(),
                b.getAccommodationCity(),
                b.getCheckIn(), b.getCheckOut(),
                b.getCheckInTime(), b.getCheckOutTime(),
                b.getRoomType(), b.getGuests(),
                b.getAddress(),
                b.getFromLatitude(), b.getFromLongitude(),
                b.getToLatitude(), b.getToLongitude(),
                b.getLatitude(), b.getLongitude(),
                b.isPaidSimple(),
                payments, attachments, paidTotal, remainingTotal,
                nights, pricePerNight, durationMinutes
        );
    }

    public static PaymentResponse toPaymentResponse(Payment p) {
        return new PaymentResponse(p.getId(), p.getSequence(), p.getAmount(), p.getDueDate(), p.isPaid(), p.getPaidDate());
    }

    public static AttachmentResponse toAttachmentResponse(Attachment a) {
        return new AttachmentResponse(
                a.getId(), a.getFileName(), a.getContentType(), a.getSize(), a.getUploadedAt(),
                "/api/attachments/" + a.getId() + "/download"
        );
    }
}
