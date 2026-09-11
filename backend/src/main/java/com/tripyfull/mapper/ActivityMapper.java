package com.tripyfull.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripyfull.dto.ActivityRequest;
import com.tripyfull.dto.ActivityResponse;
import com.tripyfull.model.Activity;
import com.tripyfull.model.Booking;
import com.tripyfull.model.ActivityType;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

public final class ActivityMapper {

    // A flight is a booking, not a way between two stops.
    private static final Set<String> TRAVEL_MODES = Set.of("foot", "taxi", "bus", "train", "car");

    private ActivityMapper() {}

    public static Activity toEntity(ActivityRequest req) {
        Activity a = new Activity();
        a.setName(req.name());
        if (req.type() != null) a.setType(ActivityType.valueOf(req.type()));
        a.setStartTime(req.startTime());
        a.setEndTime(req.endTime());
        a.setAddress(req.address());
        a.setLatitude(req.latitude());
        a.setLongitude(req.longitude());
        a.setCostEstimate(req.costEstimate());
        a.setCostCurrency(req.costCurrency());
        a.setNotes(req.notes());
        a.setTravelModeToNext(validTravelMode(req.travelModeToNext()));
        if (req.needsBooking() != null) a.setNeedsBooking(req.needsBooking());
        return a;
    }

    public static void updateEntity(Activity a, ActivityRequest req) {
        if (req.name() != null) a.setName(req.name());
        if (req.type() != null) a.setType(ActivityType.valueOf(req.type()));
        if (req.startTime() != null) a.setStartTime(req.startTime());
        if (req.endTime() != null) a.setEndTime(req.endTime());
        if (req.address() != null) a.setAddress(req.address());
        if (Boolean.TRUE.equals(req.clearCoords())) {
            a.setLatitude(null);
            a.setLongitude(null);
        } else {
            if (req.latitude() != null) a.setLatitude(req.latitude());
            if (req.longitude() != null) a.setLongitude(req.longitude());
        }
        if (req.costEstimate() != null) a.setCostEstimate(req.costEstimate());
        if (req.costCurrency() != null) a.setCostCurrency(req.costCurrency());
        if (req.notes() != null) a.setNotes(req.notes());
        if (req.travelModeToNext() != null) a.setTravelModeToNext(validTravelMode(req.travelModeToNext()));
        if (req.needsBooking() != null) a.setNeedsBooking(req.needsBooking());
    }

    private static String validTravelMode(String mode) {
        if (mode == null) return null;
        if (!TRAVEL_MODES.contains(mode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid travel mode: " + mode);
        }
        return mode;
    }

    public static ActivityResponse toResponse(Activity a) {
        return toResponse(a, null);
    }

    /** With the booking the stop was written from, when the caller has it at hand. */
    public static ActivityResponse toResponse(Activity a, Booking source) {
        return new ActivityResponse(
                a.getId(),
                a.getName(),
                a.getType() != null ? a.getType().name() : null,
                a.getStartTime(),
                a.getEndTime(),
                a.getAddress(),
                a.getCostEstimate(),
                a.getCostCurrency(),
                a.getNotes(),
                a.getOrderIndex(),
                a.getPlace() != null ? a.getPlace().getId() : null,
                a.getPlace() != null ? a.getPlace().getName() : null,
                a.getPlace() != null ? a.getPlace().getLatitude() : null,
                a.getPlace() != null ? a.getPlace().getLongitude() : null,
                a.getTravelModeToNext(),
                a.isNeedsBooking(),
                a.getLatitude(),
                a.getLongitude(),
                a.getSourceBookingId() != null,
                source != null && source.getTransportMode() != null ? source.getTransportMode().name() : null,
                source != null ? source.getDepartureAt() : null,
                source != null ? source.getArrivalAt() : null,
                source != null ? source.getToLatitude() : null,
                source != null ? source.getToLongitude() : null,
                a.getTravelKey() != null,
                travelMode(a.getTravelKey()),
                a.getTravelSeconds(),
                a.getTravelMeters(),
                geometry(a.getTravelGeometry()),
                a.isTravelEstimated(),
                a.getTravelNote()
        );
    }

    /** The key reads "mode|lat,lon;lat,lon". */
    private static String travelMode(String key) {
        if (key == null) return null;
        int bar = key.indexOf('|');
        return bar > 0 ? key.substring(0, bar) : null;
    }

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final TypeReference<List<List<Double>>> POINTS = new TypeReference<>() {};

    /** The stored leg line, [lat, lon] pairs; nothing when there is none or it is unreadable. */
    private static List<List<Double>> geometry(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return JSON.readValue(json, POINTS);
        } catch (Exception e) {
            return List.of();
        }
    }
}
