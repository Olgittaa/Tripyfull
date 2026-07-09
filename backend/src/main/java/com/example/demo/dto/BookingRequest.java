package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

public record BookingRequest(
        @NotBlank(message = "Booking name is required")
        String name,
        String category,
        String vendor,
        String confirmationNumber,
        String bookingUrl,
        BigDecimal fullPrice,
        String priceCurrency,
        BigDecimal exchangeRate,
        String notes,
        UUID linkedDayId,
        String flightNumber,
        String fromPlace,
        String toPlace,
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
        Boolean paidSimple
) {}
