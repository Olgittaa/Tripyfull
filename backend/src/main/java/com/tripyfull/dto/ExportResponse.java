package com.tripyfull.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Everything the printed plan needs, in one read. The document is built on the
 * client; this is the trip as prose would tell it: days with their stops (and
 * what the shortlist knows about each place), the bookings with their dates,
 * and the to-dos still open.
 */
public record ExportResponse(
        String title,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        String baseCurrency,
        List<ExportDay> days,
        List<ExportBooking> bookings,
        List<ExportTodo> todos,
        /** The trip's shortlist, planned or not — the cover and the map draw on it. */
        List<ExportPlace> places
) {
    public record ExportPlace(
            String name,
            String type,
            int rating,
            String city,
            Double latitude,
            Double longitude,
            List<String> photos
    ) {}

    public record ExportDay(
            int dayNumber,
            LocalDate date,
            String city,
            String overnightStay,
            boolean buffer,
            String notes,
            List<ExportActivity> activities
    ) {}

    public record ExportActivity(
            String name,
            String type,
            LocalTime startTime,
            LocalTime endTime,
            String address,
            BigDecimal costEstimate,
            String costCurrency,
            String notes,
            boolean needsBooking,
            boolean fromBooking,
            String travelModeToNext,
            Integer travelSeconds,
            // Where the stop is: the linked place's coordinates, else its own
            Double latitude,
            Double longitude,
            // From the linked place, when there is one
            String placeType,
            Integer placeRating,
            String placeRatingComment,
            String placeDescription,
            Integer placeVisitMinutes,
            List<String> placePhotos,
            String placeLink
    ) {}

    public record ExportBooking(
            String name,
            String category,
            String transportMode,
            String vendor,
            String confirmationNumber,
            String bookingUrl,
            BigDecimal fullPrice,
            String priceCurrency,
            boolean paidSimple,
            BigDecimal paidTotal,
            String notes,
            String fromPlace,
            String toPlace,
            LocalDateTime departureAt,
            LocalDateTime arrivalAt,
            String flightNumber,
            String seat,
            String accommodationCity,
            String address,
            LocalDate checkIn,
            LocalDate checkOut,
            LocalTime checkInTime,
            LocalTime checkOutTime
    ) {}

    public record ExportTodo(String title, String groupName, LocalDate dueDate, boolean done) {}
}
