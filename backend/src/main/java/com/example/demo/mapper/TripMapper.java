package com.example.demo.mapper;

import com.example.demo.dto.TripRequest;
import com.example.demo.dto.TripResponse;
import com.example.demo.model.Trip;
import com.example.demo.model.TripStatus;

public final class TripMapper {

    private TripMapper() {}

    public static Trip toEntity(TripRequest req) {
        Trip trip = new Trip();
        trip.setTitle(req.title());
        trip.setDestination(req.destination());
        trip.setStartDate(req.startDate());
        trip.setEndDate(req.endDate());
        if (req.baseCurrency() != null) trip.setBaseCurrency(req.baseCurrency());
        trip.setCoverImage(req.coverImage());
        if (req.status() != null) trip.setStatus(TripStatus.valueOf(req.status()));
        return trip;
    }

    public static void updateEntity(Trip trip, TripRequest req) {
        if (req.title() != null) trip.setTitle(req.title());
        if (req.destination() != null) trip.setDestination(req.destination());
        if (req.startDate() != null) trip.setStartDate(req.startDate());
        if (req.endDate() != null) trip.setEndDate(req.endDate());
        if (req.baseCurrency() != null) trip.setBaseCurrency(req.baseCurrency());
        if (req.coverImage() != null) trip.setCoverImage(req.coverImage());
        if (req.status() != null) trip.setStatus(TripStatus.valueOf(req.status()));
    }

    public static TripResponse toResponse(Trip trip) {
        return new TripResponse(
                trip.getId(),
                trip.getTitle(),
                trip.getDestination(),
                trip.getStartDate(),
                trip.getEndDate(),
                trip.getBaseCurrency(),
                trip.getCoverImage(),
                trip.getStatus().name()
        );
    }
}
