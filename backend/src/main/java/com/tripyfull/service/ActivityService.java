package com.tripyfull.service;

import com.tripyfull.dto.ActivityRequest;
import com.tripyfull.dto.ActivityResponse;
import com.tripyfull.dto.ReorderRequest;
import com.tripyfull.mapper.ActivityMapper;
import com.tripyfull.model.Activity;
import com.tripyfull.model.Day;
import com.tripyfull.model.Place;
import com.tripyfull.model.PlaceVisibility;
import com.tripyfull.model.User;
import com.tripyfull.repository.ActivityRepository;
import com.tripyfull.repository.PlaceRepository;
import com.tripyfull.security.OwnershipGuard;
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
    private final PlaceRepository placeRepository;
    private final OwnershipGuard guard;

    public ActivityService(ActivityRepository activityRepository, PlaceRepository placeRepository,
                           OwnershipGuard guard) {
        this.activityRepository = activityRepository;
        this.placeRepository = placeRepository;
        this.guard = guard;
    }

    public List<ActivityResponse> getActivities(UUID dayId, String username) {
        Day day = findDayForUser(dayId, username);
        return activityRepository.findByDayIdOrderByOrderIndexAscIdAsc(day.getId()).stream()
                .map(ActivityMapper::toResponse)
                .toList();
    }

    public ActivityResponse create(UUID dayId, ActivityRequest request, String username) {
        Day day = findDayForUser(dayId, username);
        Activity activity = ActivityMapper.toEntity(request);
        activity.setDay(day);
        activity.setOrderIndex(nextOrderIndex(dayId));
        applyPlace(activity, request, guard.requireUser(username));
        return ActivityMapper.toResponse(activityRepository.save(activity));
    }

    public ActivityResponse update(UUID activityId, ActivityRequest request, String username) {
        Activity activity = findActivityForUser(activityId, username);
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
        return ActivityMapper.toResponse(activityRepository.save(activity));
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
            // The day was ownership-checked above; every reordered activity must
            // belong to it — otherwise arbitrary ids could mutate other users' data.
            if (!activity.getDay().getId().equals(dayId)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Activity not found");
            }
            activity.setOrderIndex(i);
            activityRepository.save(activity);
        }
        return activityRepository.findByDayIdOrderByOrderIndexAscIdAsc(dayId).stream()
                .map(ActivityMapper::toResponse)
                .toList();
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
