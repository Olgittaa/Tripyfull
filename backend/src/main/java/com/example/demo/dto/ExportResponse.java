package com.example.demo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record ExportResponse(
        String title,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        String baseCurrency,
        List<ExportDay> days,
        List<ExportBooking> bookings
) {
    public record ExportDay(
            int dayNumber,
            LocalDate date,
            String city,
            List<ExportActivity> activities
    ) {}

    public record ExportActivity(
            String name,
            String type,
            LocalTime startTime,
            LocalTime endTime,
            String address,
            BigDecimal costEstimate,
            String notes
    ) {}

    public record ExportBooking(
            String name,
            String category,
            String vendor,
            BigDecimal fullPrice,
            String notes
    ) {}
}
