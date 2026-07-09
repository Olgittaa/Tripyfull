package com.example.demo.service;

import com.example.demo.dto.ActivityRequest;
import com.example.demo.dto.ActivityResponse;
import com.example.demo.dto.ReorderRequest;
import com.example.demo.mapper.ActivityMapper;
import com.example.demo.model.Activity;
import com.example.demo.model.Day;
import com.example.demo.model.Place;
import com.example.demo.model.PlaceVisibility;
import com.example.demo.model.User;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.DayRepository;
import com.example.demo.repository.PlaceRepository;
import com.example.demo.repository.TripRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final DayRepository dayRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;

    public ActivityService(ActivityRepository activityRepository, DayRepository dayRepository,
                           TripRepository tripRepository, UserRepository userRepository,
                           PlaceRepository placeRepository) {
        this.activityRepository = activityRepository;
        this.dayRepository = dayRepository;
        this.tripRepository = tripRepository;
        this.userRepository = userRepository;
        this.placeRepository = placeRepository;
    }

    public List<ActivityResponse> getActivities(UUID dayId, String username) {
        Day day = findDayForUser(dayId, username);
        return activityRepository.findByDayIdOrderByStartTimeAscOrderIndexAsc(day.getId()).stream()
                .map(ActivityMapper::toResponse)
                .toList();
    }

    public ActivityResponse create(UUID dayId, ActivityRequest request, String username) {
        Day day = findDayForUser(dayId, username);
        Activity activity = ActivityMapper.toEntity(request);
        activity.setDay(day);
        activity.setOrderIndex(activityRepository.countByDayId(dayId));
        applyPlace(activity, request, getUser(username));
        return ActivityMapper.toResponse(activityRepository.save(activity));
    }

    public ActivityResponse update(UUID activityId, ActivityRequest request, String username) {
        Activity activity = findActivityForUser(activityId, username);
        ActivityMapper.updateEntity(activity, request);
        applyPlace(activity, request, getUser(username));
        return ActivityMapper.toResponse(activityRepository.save(activity));
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
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    public void delete(UUID activityId, String username) {
        Activity activity = findActivityForUser(activityId, username);
        activityRepository.delete(activity);
    }

    public List<ActivityResponse> reorder(UUID dayId, ReorderRequest request, String username) {
        findDayForUser(dayId, username);
        List<UUID> orderedIds = request.orderedIds();
        for (int i = 0; i < orderedIds.size(); i++) {
            Activity activity = activityRepository.findById(orderedIds.get(i))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));
            activity.setOrderIndex(i);
            activityRepository.save(activity);
        }
        return activityRepository.findByDayIdOrderByStartTimeAscOrderIndexAsc(dayId).stream()
                .map(ActivityMapper::toResponse)
                .toList();
    }

    private Day findDayForUser(UUID dayId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Day day = dayRepository.findById(dayId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Day not found"));
        tripRepository.findByIdAndOwnerId(day.getTrip().getId(), user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
        return day;
    }

    private Activity findActivityForUser(UUID activityId, String username) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found"));
        findDayForUser(activity.getDay().getId(), username);
        return activity;
    }
}
