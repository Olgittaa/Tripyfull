package com.tripyfull.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * A whole trip as one file — the {@code trip.json} inside the archive Export
 * produces and Import reads. Everything the trip owns is here in full: days and
 * their stops, bookings with their payments and tickets, to-dos, the places the
 * trip draws on and the folders they sit in. Photos the app stores itself and
 * the attachments of bookings travel beside it in the archive under
 * {@code files/…}; this file points at them by path. Photos found elsewhere
 * (Google, Wikipedia) stay links.
 *
 * Ids are the ones the exporting server had. They mean nothing to the server
 * that imports — it gives everything new ids — but they are how a stop finds
 * its place and a day its hotel booking inside the file.
 */
public record TripFile(
        String format,
        int version,
        Instant exportedAt,
        Details trip,
        List<FileDay> days,
        List<FileBooking> bookings,
        List<FileTodo> todos,
        List<FilePlace> places,
        List<FileFolder> folders
) {
    public static final String FORMAT = "tripyfull-trip";
    public static final int VERSION = 1;

    public record Details(
            String title,
            String destination,
            LocalDate startDate,
            LocalDate endDate,
            String baseCurrency,
            String coverImage,
            String status
    ) {}

    public record FileDay(
            String id,
            LocalDate date,
            String city,
            String overnightStay,
            String linkedBookingId,
            String notes,
            boolean buffer,
            List<FileActivity> activities
    ) {}

    public record FileActivity(
            String id,
            String name,
            String type,
            LocalTime startTime,
            LocalTime endTime,
            String address,
            BigDecimal costEstimate,
            String costCurrency,
            String notes,
            String placeId,
            int orderIndex,
            String travelModeToNext,
            boolean needsBooking,
            String sourceBookingId,
            Double latitude,
            Double longitude,
            // The way to the next stop, as the server last computed it — carried so
            // the importing server need not ask the router again for the same road.
            String travelKey,
            Integer travelSeconds,
            Integer travelMeters,
            String travelGeometry,
            boolean travelEstimated,
            String travelNote
    ) {}

    public record FileBooking(
            String id,
            String name,
            String category,
            String vendor,
            String confirmationNumber,
            String bookingUrl,
            BigDecimal fullPrice,
            String priceCurrency,
            BigDecimal exchangeRate,
            String notes,
            String linkedDayId,
            String flightNumber,
            String fromPlace,
            String toPlace,
            Double fromLatitude,
            Double fromLongitude,
            Double toLatitude,
            Double toLongitude,
            LocalDateTime departureAt,
            LocalDateTime arrivalAt,
            String transportMode,
            String fromIata,
            String toIata,
            String departureTerminal,
            String arrivalTerminal,
            String seat,
            String vesselName,
            String cabin,
            String carClass,
            String accommodationCity,
            LocalDate checkIn,
            LocalDate checkOut,
            LocalTime checkInTime,
            LocalTime checkOutTime,
            String roomType,
            Integer guests,
            String address,
            Double latitude,
            Double longitude,
            boolean paidSimple,
            List<FilePayment> payments,
            List<FileAttachment> attachments
    ) {}

    public record FilePayment(int sequence, BigDecimal amount, LocalDate dueDate, boolean paid, LocalDate paidDate) {}

    /** {@code path} is where the bytes sit inside the archive. */
    public record FileAttachment(String fileName, String contentType, long size, String path) {}

    public record FileTodo(
            String title,
            String notes,
            String groupName,
            LocalDate dueDate,
            boolean done,
            int orderIndex,
            String templateKey
    ) {}

    /**
     * {@code shortlisted} says whether the place was on the trip's own shortlist,
     * as opposed to only being pointed at by a stop or filed in a folder.
     * {@code photos} holds archive paths for the app's own photos and URLs for the rest.
     */
    public record FilePlace(
            String id,
            String name,
            String type,
            String country,
            String city,
            String address,
            BigDecimal latitude,
            BigDecimal longitude,
            String description,
            List<String> photos,
            List<String> links,
            String osmId,
            int rating,
            String ratingComment,
            Integer visitMinutes,
            String audience,
            boolean needsPreparation,
            boolean needsBooking,
            String source,
            boolean shortlisted
    ) {}

    public record FileFolder(String name, String color, List<String> placeIds) {}
}
