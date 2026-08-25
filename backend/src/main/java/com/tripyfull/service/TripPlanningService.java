package com.tripyfull.service;

import com.tripyfull.dto.PlanApplyRequest;
import com.tripyfull.dto.PlanRequest;
import com.tripyfull.dto.PlanResponse;
import com.tripyfull.dto.DayResponse;
import com.tripyfull.mapper.DayMapper;
import com.tripyfull.model.Activity;
import com.tripyfull.model.ActivityType;
import com.tripyfull.model.Day;
import com.tripyfull.model.Place;
import com.tripyfull.model.PlacePriority;
import com.tripyfull.model.PlaceType;
import com.tripyfull.model.PlaceVisibility;
import com.tripyfull.model.Trip;
import com.tripyfull.model.User;
import com.tripyfull.repository.ActivityRepository;
import com.tripyfull.repository.DayRepository;
import com.tripyfull.repository.PlaceRepository;
import com.tripyfull.security.OwnershipGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Auto-plans a trip: clusters saved places into days by geography (greedy Haversine
 * k-clustering anchored at a base point), balances activity types within a day, and
 * orders each day's stops as a route (nearest-neighbor + 2-opt). No external APIs —
 * straight-line distances are good enough for grouping and ordering.
 */
@Service
@Transactional
public class TripPlanningService {

    /** More of one place type than this per day gets rebalanced to another day. */
    private static final int MAX_SAME_TYPE_PER_DAY = 3;

    private final PlaceRepository placeRepository;
    private final DayRepository dayRepository;
    private final ActivityRepository activityRepository;
    private final OwnershipGuard guard;

    public TripPlanningService(PlaceRepository placeRepository, DayRepository dayRepository,
                               ActivityRepository activityRepository, OwnershipGuard guard) {
        this.placeRepository = placeRepository;
        this.dayRepository = dayRepository;
        this.activityRepository = activityRepository;
        this.guard = guard;
    }

    // ---- plan (read-only computation) ----

    public PlanResponse plan(UUID tripId, PlanRequest request, String username) {
        User user = guard.requireUser(username);
        Trip trip = guard.requireTrip(tripId, user);

        List<Day> planDays = dayRepository.findByTripIdOrderByDateAsc(trip.getId()).stream()
                .filter(d -> !d.isBuffer())
                .toList();
        if (planDays.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "No plannable days — generate the trip days first (buffer days are skipped)");
        }
        if (request.placeIds() == null || request.placeIds().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No places selected");
        }

        List<Place> visible = placeRepository.findAllById(new LinkedHashSet<>(request.placeIds())).stream()
                .filter(p -> isVisible(p, user))
                .toList();

        List<Place> unassigned = new ArrayList<>(visible.stream()
                .filter(p -> p.getLatitude() == null || p.getLongitude() == null)
                .toList());
        List<Place> candidates = new ArrayList<>(visible.stream()
                .filter(p -> p.getLatitude() != null && p.getLongitude() != null)
                .toList());

        double[] base = basePoint(request, candidates);
        int dayCount = planDays.size();
        int capacity = request.maxPerDay() != null && request.maxPerDay() > 0
                ? request.maxPerDay()
                : Math.max(1, (int) Math.ceil((double) candidates.size() / dayCount));

        List<Cluster> clusters = cluster(candidates, dayCount, capacity, base, unassigned);
        balanceTypes(clusters, capacity, unassigned);
        clusters = orderClustersFromBase(clusters, base);

        List<PlanResponse.PlanDay> days = new ArrayList<>();
        // Day numbers must reflect ALL trip days (buffers included), so recount.
        List<Day> allDays = dayRepository.findByTripIdOrderByDateAsc(trip.getId());
        for (int i = 0; i < planDays.size(); i++) {
            Day day = planDays.get(i);
            List<Place> route = i < clusters.size() ? routeOrder(clusters.get(i).places, base) : List.of();
            days.add(new PlanResponse.PlanDay(
                    day.getId(),
                    allDays.indexOf(day) + 1,
                    day.getDate(),
                    route.stream().map(TripPlanningService::toPlanPlace).toList(),
                    round1(routeKm(route, base))
            ));
        }
        return new PlanResponse(days, unassigned.stream().map(TripPlanningService::toPlanPlace).toList());
    }

    // ---- apply (materialize a plan as activities) ----

    public List<DayResponse> apply(UUID tripId, PlanApplyRequest request, String username) {
        User user = guard.requireUser(username);
        Trip trip = guard.requireTrip(tripId, user);
        if (request.days() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No plan supplied");
        }

        for (PlanApplyRequest.DayAssignment assignment : request.days()) {
            if (assignment.placeIds() == null || assignment.placeIds().isEmpty()) continue;
            Day day = dayRepository.findByIdAndTripId(assignment.dayId(), trip.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Day not found"));

            List<Activity> existing = activityRepository.findByDayIdOrderByOrderIndexAscIdAsc(day.getId());
            int nextIndex = existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getOrderIndex() + 1;

            for (UUID placeId : assignment.placeIds()) {
                Place place = placeRepository.findById(placeId)
                        .filter(p -> isVisible(p, user))
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Place not found"));
                Activity activity = new Activity();
                activity.setDay(day);
                activity.setName(place.getName());
                activity.setType(toActivityType(place.getType()));
                activity.setAddress(place.getAddress());
                activity.setPlace(place);
                activity.setNeedsBooking(place.isNeedsBooking());
                activity.setOrderIndex(nextIndex++);
                activityRepository.save(activity);
            }
        }
        return DayMapper.toResponseList(dayRepository.findByTripIdOrderByDateAsc(trip.getId()));
    }

    // ---- clustering ----

    private static final class Cluster {
        final List<Place> places = new ArrayList<>();
        double lat, lng;   // centroid

        void add(Place p) {
            places.add(p);
            lat = places.stream().mapToDouble(x -> x.getLatitude().doubleValue()).average().orElse(0);
            lng = places.stream().mapToDouble(x -> x.getLongitude().doubleValue()).average().orElse(0);
        }
    }

    /**
     * Greedy capacity-bounded clustering: seeds via farthest-point sampling, then each
     * place (MUST_SEE first, so they always get a seat) joins the nearest cluster with
     * room. Over-capacity leftovers go to the unassigned pool, OPTIONAL first.
     */
    private List<Cluster> cluster(List<Place> places, int dayCount, int capacity,
                                  double[] base, List<Place> unassigned) {
        int k = Math.min(dayCount, Math.max(1, places.size()));
        List<Cluster> clusters = new ArrayList<>();
        if (places.isEmpty()) return clusters;

        // Seeds: first the place farthest from base, then repeatedly the place
        // farthest from every existing seed — spreads clusters across the map.
        List<Place> pool = new ArrayList<>(places);
        Place first = pool.stream()
                .max(Comparator.comparingDouble(p -> haversine(base[0], base[1], lat(p), lng(p))))
                .orElseThrow();
        List<Place> seeds = new ArrayList<>(List.of(first));
        while (seeds.size() < k) {
            Place next = pool.stream()
                    .filter(p -> !seeds.contains(p))
                    .max(Comparator.comparingDouble(p -> seeds.stream()
                            .mapToDouble(s -> haversine(lat(s), lng(s), lat(p), lng(p)))
                            .min().orElse(0)))
                    .orElse(null);
            if (next == null) break;
            seeds.add(next);
        }
        for (Place seed : seeds) {
            Cluster c = new Cluster();
            c.add(seed);
            clusters.add(c);
        }

        List<Place> rest = pool.stream()
                .filter(p -> !seeds.contains(p))
                .sorted(Comparator.comparing((Place p) -> p.getPriority() != PlacePriority.MUST_SEE))
                .toList();
        for (Place p : rest) {
            Cluster best = clusters.stream()
                    .filter(c -> c.places.size() < capacity)
                    .min(Comparator.comparingDouble(c -> haversine(c.lat, c.lng, lat(p), lng(p))))
                    .orElse(null);
            if (best != null) {
                best.add(p);
            } else {
                unassigned.add(p);   // everything is full
            }
        }
        // OPTIONAL places bump before MUST_SEE in the pool listing.
        unassigned.sort(Comparator.comparing((Place p) -> p.getPriority() == PlacePriority.MUST_SEE));
        return clusters;
    }

    /**
     * A day with too many places of one type (5 temples in a row) gets the surplus
     * moved to the nearest day that still has room and appetite for that type;
     * OPTIONAL surplus that fits nowhere drops to the unassigned pool.
     */
    private void balanceTypes(List<Cluster> clusters, int capacity, List<Place> unassigned) {
        for (Cluster cluster : clusters) {
            Map<PlaceType, List<Place>> byType = new HashMap<>();
            for (Place p : cluster.places) {
                byType.computeIfAbsent(p.getType() != null ? p.getType() : PlaceType.OTHER,
                        t -> new ArrayList<>()).add(p);
            }
            for (List<Place> group : byType.values()) {
                if (group.size() <= MAX_SAME_TYPE_PER_DAY) continue;
                // Move OPTIONAL surplus first; keep MUST_SEE in place.
                List<Place> surplus = group.stream()
                        .sorted(Comparator.comparing((Place p) -> p.getPriority() == PlacePriority.MUST_SEE))
                        .limit(group.size() - MAX_SAME_TYPE_PER_DAY)
                        .filter(p -> p.getPriority() != PlacePriority.MUST_SEE)
                        .toList();
                for (Place p : surplus) {
                    Cluster target = clusters.stream()
                            .filter(c -> c != cluster && c.places.size() < capacity)
                            .filter(c -> c.places.stream()
                                    .filter(x -> (x.getType() != null ? x.getType() : PlaceType.OTHER)
                                            == (p.getType() != null ? p.getType() : PlaceType.OTHER))
                                    .count() < MAX_SAME_TYPE_PER_DAY)
                            .min(Comparator.comparingDouble(c -> haversine(c.lat, c.lng, lat(p), lng(p))))
                            .orElse(null);
                    cluster.places.remove(p);
                    if (target != null) target.add(p);
                    else unassigned.add(p);
                }
            }
        }
    }

    /** Chains clusters day by day: start with the one nearest the base, then hop to the nearest next. */
    private List<Cluster> orderClustersFromBase(List<Cluster> clusters, double[] base) {
        List<Cluster> remaining = new ArrayList<>(clusters);
        List<Cluster> ordered = new ArrayList<>();
        double curLat = base[0], curLng = base[1];
        while (!remaining.isEmpty()) {
            final double fLat = curLat, fLng = curLng;
            Cluster next = remaining.stream()
                    .min(Comparator.comparingDouble(c -> haversine(fLat, fLng, c.lat, c.lng)))
                    .orElseThrow();
            remaining.remove(next);
            ordered.add(next);
            curLat = next.lat;
            curLng = next.lng;
        }
        return ordered;
    }

    // ---- in-day routing ----

    /** Visiting order: nearest-neighbor from the base point, improved with 2-opt. */
    private List<Place> routeOrder(List<Place> places, double[] base) {
        if (places.size() < 2) return new ArrayList<>(places);
        List<Place> remaining = new ArrayList<>(places);
        List<Place> route = new ArrayList<>();
        double curLat = base[0], curLng = base[1];
        while (!remaining.isEmpty()) {
            final double fLat = curLat, fLng = curLng;
            Place next = remaining.stream()
                    .min(Comparator.comparingDouble(p -> haversine(fLat, fLng, lat(p), lng(p))))
                    .orElseThrow();
            remaining.remove(next);
            route.add(next);
            curLat = lat(next);
            curLng = lng(next);
        }
        twoOpt(route, base);
        return route;
    }

    private void twoOpt(List<Place> route, double[] base) {
        boolean improved = true;
        while (improved) {
            improved = false;
            for (int i = 0; i < route.size() - 1; i++) {
                for (int j = i + 1; j < route.size(); j++) {
                    double before = segmentKm(route, base, i - 1, i) + segmentKm(route, base, j, j + 1);
                    double after = segmentKm(route, base, i - 1, j) + segmentKm(route, base, i, j + 1);
                    if (after + 1e-9 < before) {
                        // Reverse the segment [i..j].
                        for (int a = i, b = j; a < b; a++, b--) {
                            Place tmp = route.get(a);
                            route.set(a, route.get(b));
                            route.set(b, tmp);
                        }
                        improved = true;
                    }
                }
            }
        }
    }

    /** Distance of the edge from stop {@code from} to stop {@code to}; -1 = base, size = open end (0 km). */
    private double segmentKm(List<Place> route, double[] base, int from, int to) {
        if (to >= route.size()) return 0;   // open-ended route: no return leg
        double aLat = from < 0 ? base[0] : lat(route.get(from));
        double aLng = from < 0 ? base[1] : lng(route.get(from));
        return haversine(aLat, aLng, lat(route.get(to)), lng(route.get(to)));
    }

    private double routeKm(List<Place> route, double[] base) {
        double km = 0;
        for (int i = 0; i < route.size(); i++) km += segmentKm(route, base, i - 1, i);
        return km;
    }

    // ---- helpers ----

    private double[] basePoint(PlanRequest request, List<Place> candidates) {
        if (request.baseLatitude() != null && request.baseLongitude() != null) {
            return new double[]{request.baseLatitude().doubleValue(), request.baseLongitude().doubleValue()};
        }
        if (candidates.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "None of the selected places have coordinates");
        }
        return new double[]{
                candidates.stream().mapToDouble(TripPlanningService::lat).average().orElse(0),
                candidates.stream().mapToDouble(TripPlanningService::lng).average().orElse(0)
        };
    }

    private boolean isVisible(Place p, User user) {
        return p.getOwner().getId().equals(user.getId()) || p.getVisibility() == PlaceVisibility.PUBLIC;
    }

    static ActivityType toActivityType(PlaceType type) {
        if (type == null) return ActivityType.OTHER;
        return switch (type) {
            case SIGHTSEEING, MUSEUM, VIEWPOINT -> ActivityType.SIGHTSEEING;
            case BEACH -> ActivityType.BEACH;
            case NATURE, PARK -> ActivityType.NATURE;
            case RESTAURANT -> ActivityType.RESTAURANT;
            case SHOP -> ActivityType.SHOPPING;
            case NEIGHBORHOOD -> ActivityType.NEIGHBORHOOD;
            case PORT, AIRPORT -> ActivityType.TRANSPORT;
            default -> ActivityType.OTHER;
        };
    }

    private static PlanResponse.PlanPlace toPlanPlace(Place p) {
        return new PlanResponse.PlanPlace(
                p.getId(), p.getName(),
                p.getType() != null ? p.getType().name() : null,
                p.getPriority() != null ? p.getPriority().name() : PlacePriority.OPTIONAL.name(),
                p.isNeedsBooking());
    }

    private static double lat(Place p) { return p.getLatitude().doubleValue(); }
    private static double lng(Place p) { return p.getLongitude().doubleValue(); }

    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }

    static double haversine(double lat1, double lng1, double lat2, double lng2) {
        double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * r * Math.asin(Math.sqrt(a));
    }
}
