package com.tripyfull.service;

import com.tripyfull.dto.ActivityRequest;
import com.tripyfull.dto.ActivityResponse;
import com.tripyfull.dto.PlannedPlaceResponse;
import com.tripyfull.dto.ReorderRequest;
import com.tripyfull.mapper.ActivityMapper;
import com.tripyfull.model.Activity;
import com.tripyfull.model.Booking;
import com.tripyfull.model.Day;
import com.tripyfull.model.Place;
import com.tripyfull.model.PlaceVisibility;
import com.tripyfull.model.Trip;
import com.tripyfull.model.User;
import com.tripyfull.repository.ActivityRepository;
import com.tripyfull.repository.BookingRepository;
import com.tripyfull.repository.PlaceRepository;
import com.tripyfull.repository.TripRepository;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final PlaceRepository placeRepository;
    private final TripRepository tripRepository;
    private final BookingRepository bookingRepository;
    private final OwnershipGuard guard;
    private final TravelLegService travelLegs;

    public ActivityService(ActivityRepository activityRepository, PlaceRepository placeRepository,
                           TripRepository tripRepository, BookingRepository bookingRepository,
                           OwnershipGuard guard, TravelLegService travelLegs) {
        this.activityRepository = activityRepository;
        this.placeRepository = placeRepository;
        this.tripRepository = tripRepository;
        this.bookingRepository = bookingRepository;
        this.guard = guard;
        this.travelLegs = travelLegs;
    }

    /** The day's stops in order, with every leg to the next stop brought up to date. */
    private List<Activity> dayInOrder(UUID dayId) {
        List<Activity> list = activityRepository.findByDayIdOrderByOrderIndexAscIdAsc(dayId);
        travelLegs.refresh(list);
        return list;
    }

    /** A stop as it stands after its day's legs were refreshed. */
    private ActivityResponse freshResponse(Activity saved) {
        dayInOrder(saved.getDay().getId());
        return toResponse(activityRepository.findById(saved.getId()).orElse(saved));
    }

    /** Responses with their source bookings attached — one query for the whole list. */
    private List<ActivityResponse> toResponses(List<Activity> activities) {
        Set<UUID> ids = activities.stream()
                .map(Activity::getSourceBookingId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<UUID, Booking> bookings = ids.isEmpty() ? Map.of()
                : bookingRepository.findAllById(ids).stream().collect(Collectors.toMap(Booking::getId, b -> b));
        return activities.stream()
                .map(a -> ActivityMapper.toResponse(a, a.getSourceBookingId() != null ? bookings.get(a.getSourceBookingId()) : null))
                .toList();
    }

    private ActivityResponse toResponse(Activity a) {
        Booking source = a.getSourceBookingId() != null
                ? bookingRepository.findById(a.getSourceBookingId()).orElse(null) : null;
        return ActivityMapper.toResponse(a, source);
    }

    public List<ActivityResponse> getActivities(UUID dayId, String username) {
        Day day = findDayForUser(dayId, username);
        return toResponses(dayInOrder(day.getId()));
    }

    /**
     * Which places of the trip are already planned, and on which day. Day numbers
     * follow the itinerary's own numbering (dated days first, reserve days last),
     * so "Day 3" on the map is the same "Day 3" as in the plan.
     */
    public List<PlannedPlaceResponse> getPlannedPlaces(UUID tripId, String username) {
        Trip trip = guard.requireTrip(tripId, username);
        List<Day> days = trip.getDays().stream()
                .sorted(Comparator.comparing(Day::getDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        Map<UUID, Integer> numberOf = new HashMap<>();
        for (int i = 0; i < days.size(); i++) numberOf.put(days.get(i).getId(), i + 1);

        return activityRepository.findByDayTripIdAndPlaceIsNotNull(tripId).stream()
                .sorted(Comparator.comparing((Activity a) -> numberOf.getOrDefault(a.getDay().getId(), 0))
                        .thenComparing(Activity::getOrderIndex))
                .map(a -> new PlannedPlaceResponse(
                        a.getPlace().getId(),
                        a.getDay().getId(),
                        numberOf.getOrDefault(a.getDay().getId(), 0),
                        a.getDay().getDate(),
                        a.getDay().isBuffer(),
                        a.getName(),
                        a.getStartTime()))
                .toList();
    }

    public ActivityResponse create(UUID dayId, ActivityRequest request, String username) {
        Day day = findDayForUser(dayId, username);
        Activity activity = ActivityMapper.toEntity(request);
        activity.setDay(day);
        activity.setOrderIndex(nextOrderIndex(dayId));
        applyPlace(activity, request, guard.requireUser(username));
        return freshResponse(activityRepository.save(activity));
    }

    public ActivityResponse update(UUID activityId, ActivityRequest request, String username) {
        Activity activity = findActivityForUser(activityId, username);
        UUID dayBefore = activity.getDay().getId();
        // Optional move to another day of the same trip; appended at the target's end.
        if (request.dayId() != null && !request.dayId().equals(activity.getDay().getId())) {
            Day target = findDayForUser(request.dayId(), username);
            if (!target.getTrip().getId().equals(activity.getDay().getTrip().getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Target day belongs to a different trip");
            }
            int nextIndex = nextOrderIndex(target.getId());
            activity.setDay(target);
            activity.setOrderIndex(nextIndex);
        }
        ActivityMapper.updateEntity(activity, request);
        applyPlace(activity, request, guard.requireUser(username));
        Activity saved = activityRepository.save(activity);
        if (!saved.getDay().getId().equals(dayBefore)) dayInOrder(dayBefore); // the day it left closes its gap
        return freshResponse(saved);
    }

    /** Append position: one past the day's current highest orderIndex (count would collide after deletes). */
    private int nextOrderIndex(UUID dayId) {
        List<Activity> existing = activityRepository.findByDayIdOrderByOrderIndexAscIdAsc(dayId);
        return existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getOrderIndex() + 1;
    }

    /** Links/unlinks a library Place; inherits the place address when the activity has none. */
    private void applyPlace(Activity activity, ActivityRequest request, User user) {
        if (Boolean.TRUE.equals(request.clearPlace())) {
            activity.setPlace(null);
            return;
        }
        if (request.placeId() == null) return;
        Place place = placeRepository.findById(request.placeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
        boolean visible = place.getOwner().getId().equals(user.getId())
                || place.getVisibility() == PlaceVisibility.PUBLIC;
        if (!visible) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found");
        activity.setPlace(place);
        if (activity.getAddress() == null || activity.getAddress().isBlank()) {
            activity.setAddress(place.getAddress());
        }
        // Scheduling a place implies it belongs to the trip's own place list.
        Trip trip = activity.getDay().getTrip();
        if (trip.getPlaces().add(place)) tripRepository.save(trip);
    }

    public void delete(UUID activityId, String username) {
        Activity activity = findActivityForUser(activityId, username);
        UUID dayId = activity.getDay().getId();
        activityRepository.delete(activity);
        dayInOrder(dayId); // the stops around the gap meet each other now
    }

    public List<ActivityResponse> reorder(UUID dayId, ReorderRequest request, String username) {
        findDayForUser(dayId, username);
        List<UUID> orderedIds = request.orderedIds();
        for (int i = 0; i < orderedIds.size(); i++) {
            Activity activity = activityRepository.findById(orderedIds.get(i))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));
            // The day was ownership-checked above; every reordered activity must
            // belong to it — otherwise arbitrary ids could mutate other users' data.
            if (!activity.getDay().getId().equals(dayId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found");
            }
            activity.setOrderIndex(i);
            activityRepository.save(activity);
        }
        return toResponses(dayInOrder(dayId));
    }

    private Day findDayForUser(UUID dayId, String username) {
        return guard.requireDay(dayId, username);
    }

    private Activity findActivityForUser(UUID activityId, String username) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));
        findDayForUser(activity.getDay().getId(), username);
        return activity;
    }
}
