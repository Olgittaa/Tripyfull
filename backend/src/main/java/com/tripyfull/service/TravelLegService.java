package com.tripyfull.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripyfull.model.Activity;
import com.tripyfull.model.ActivityType;
import com.tripyfull.model.Booking;
import com.tripyfull.model.BookingCategory;
import com.tripyfull.model.Day;
import com.tripyfull.model.TransportMode;
import com.tripyfull.repository.ActivityRepository;
import com.tripyfull.repository.BookingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/**
 * The time and distance from each stop to the next, kept on the stop itself.
 *
 * A day is routed once per change, not once per look: every stop with a pin
 * carries the leg to the following pinned stop — seconds, metres, the line for
 * the map, the mode — together with a key naming what that leg was computed
 * for. On every read of a day the keys are compared with the day as it now
 * stands; only a leg whose order, pin or mode moved is routed again. Reordering
 * five stops re-routes the two or three legs whose neighbours changed and no
 * others, and a day that nobody touched costs nothing to open.
 */
@Service
public class TravelLegService {

    private static final Logger log = LoggerFactory.getLogger(TravelLegService.class);

    /** Up to this far, as the crow flies, the default is to walk. */
    private static final double WALK_M = 1500;

    /** Enough for a smooth line on the map; a long drive would otherwise be thousands of points. */
    private static final int MAX_POINTS = 300;

    private final RoutingService routing;
    private final ActivityRepository activityRepository;
    private final BookingRepository bookingRepository;
    private final ObjectMapper json = new ObjectMapper();

    public TravelLegService(RoutingService routing, ActivityRepository activityRepository,
                            BookingRepository bookingRepository) {
        this.routing = routing;
        this.activityRepository = activityRepository;
        this.bookingRepository = bookingRepository;
    }

    /** Brings every leg of the day (given in its order) up to date and saves what changed. */
    public void refresh(List<Activity> ordered) {
        if (ordered == null || ordered.isEmpty()) return;
        Set<UUID> bookingIds = ordered.stream()
                .map(Activity::getSourceBookingId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<UUID, Booking> bookings = bookingIds.isEmpty() ? Map.of()
                : bookingRepository.findAllById(bookingIds).stream().collect(Collectors.toMap(Booking::getId, b -> b));

        List<Activity> stops = ordered.stream().filter(TravelLegService::hasCoords).toList();
        Set<UUID> withLeg = new HashSet<>();
        Boolean carDay = null; // whether a rented car is at hand this day; looked up once, when first needed
        for (int i = 0; i < stops.size() - 1; i++) {
            Activity from = stops.get(i);
            Activity to = stops.get(i + 1);
            double[] start = legStart(from, bookings.get(from.getSourceBookingId()));
            double[] end = coords(to);
            String mode = from.getTravelModeToNext();
            if (mode == null) {
                if (carDay == null) carDay = hasCarOn(from.getDay());
                mode = defaultMode(start, end, carDay);
            }
            // A bus or train leg is asked of the timetable for its own departure
            // time, so the time is part of what the leg was computed for.
            Instant departAt = GoogleRoutesService.TRANSIT_MODES.containsKey(mode) ? departureOf(from, start) : null;
            String key = mode + "|" + fmt(start) + ";" + fmt(end)
                    + (departAt != null ? "|" + departAt.getEpochSecond() / 60 : "");
            withLeg.add(from.getId());
            if (key.equals(from.getTravelKey())) continue;

            RoutingService.RouteResult r;
            try {
                r = routing.route(List.of(start, end), mode, departAt);
            } catch (Exception e) {
                log.warn("Routing failed for leg from '{}': {}", from.getName(), e.getMessage());
                r = null;
            }
            if (r == null) {
                // The router was unreachable: forget the old leg rather than show a stale one,
                // and leave no key so the next read tries again.
                if (from.getTravelKey() != null) { clear(from); activityRepository.save(from); }
                continue;
            }
            from.setTravelKey(key);
            if (r == RoutingService.NO_ROUTE) {
                from.setTravelSeconds(null);
                from.setTravelMeters(null);
                from.setTravelGeometry(null);
                from.setTravelEstimated(false);
                from.setTravelNote(null);
            } else {
                from.setTravelSeconds((int) Math.round(r.durationSec()));
                from.setTravelMeters((int) Math.round(r.distanceM()));
                from.setTravelGeometry(toJson(thin(r.geometry())));
                from.setTravelEstimated(r.estimated());
                from.setTravelNote(r.note());
            }
            activityRepository.save(from);
        }
        // The last stop, and stops without a pin, lead nowhere.
        for (Activity a : ordered) {
            if (!withLeg.contains(a.getId()) && a.getTravelKey() != null) {
                clear(a);
                activityRepository.save(a);
            }
        }
    }

    /**
     * The way to the next stop when none was chosen: a short hop is walked; a
     * longer one is driven when a rented car is at hand that day, else taken by
     * taxi. Nothing is written down for it — the choice follows the day as it
     * changes, while a mode the user picked stays put.
     */
    static String defaultMode(double[] start, double[] end, boolean carDay) {
        if (distanceMetres(start, end) <= WALK_M) return "foot";
        return carDay ? "car" : "taxi";
    }

    /** A car-rental booking whose pick-up and drop-off bracket the day. */
    private boolean hasCarOn(Day day) {
        if (day == null || day.getDate() == null || day.getTrip() == null) return false;
        for (Booking b : bookingRepository.findByTripIdOrderByNameAsc(day.getTrip().getId())) {
            if (b.getCategory() != BookingCategory.TRANSPORTATION || b.getTransportMode() != TransportMode.CAR_RENTAL
                    || b.getDepartureAt() == null) continue;
            boolean pickedUp = !day.getDate().isBefore(b.getDepartureAt().toLocalDate());
            boolean notYetReturned = b.getArrivalAt() == null || !day.getDate().isAfter(b.getArrivalAt().toLocalDate());
            if (pickedUp && notYetReturned) return true;
        }
        return false;
    }

    private static double distanceMetres(double[] a, double[] b) {
        double dLat = Math.toRadians(b[0] - a[0]), dLon = Math.toRadians(b[1] - a[1]);
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(a[0])) * Math.cos(Math.toRadians(b[0])) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    private static void clear(Activity a) {
        a.setTravelKey(null);
        a.setTravelSeconds(null);
        a.setTravelMeters(null);
        a.setTravelGeometry(null);
        a.setTravelEstimated(false);
        a.setTravelNote(null);
    }

    /**
     * When the leg sets off: the stop's end (else its start, else 09:00) on the
     * day's date, read as local time where the stop is — the zone is taken from
     * the longitude, fifteen degrees to the hour, which is right for Thailand,
     * Europe and most places with one zone. Timetables are for the future: a day
     * without a date takes the coming Monday, a date already past the same
     * weekday of the coming week.
     */
    static Instant departureOf(Activity from, double[] start) {
        LocalDate today = LocalDate.now();
        LocalDate date = from.getDay() != null ? from.getDay().getDate() : null;
        if (date == null) date = today.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        while (date.isBefore(today)) date = date.plusWeeks(1);
        LocalTime time = from.getEndTime() != null ? from.getEndTime()
                : from.getStartTime() != null ? from.getStartTime() : LocalTime.of(9, 0);
        int offsetHours = Math.max(-12, Math.min(14, (int) Math.round(start[1] / 15.0)));
        return date.atTime(time).toInstant(ZoneOffset.ofHours(offsetHours));
    }

    /** The stop's pin: the saved place's, else its own. */
    static Double lat(Activity a) {
        if (a.getPlace() != null && a.getPlace().getLatitude() != null) return a.getPlace().getLatitude().doubleValue();
        return a.getLatitude();
    }

    static Double lon(Activity a) {
        if (a.getPlace() != null && a.getPlace().getLongitude() != null) return a.getPlace().getLongitude().doubleValue();
        return a.getLongitude();
    }

    static boolean hasCoords(Activity a) {
        return lat(a) != null && lon(a) != null;
    }

    static double[] coords(Activity a) {
        return new double[]{lat(a), lon(a)};
    }

    /**
     * Where the leg to the next stop begins. A journey row is pinned where it
     * departs; when it lands the same day, the day continues from where it
     * lands. An overnight journey has its own "Arrive" row the next morning.
     */
    static double[] legStart(Activity a, Booking source) {
        if (source != null && a.getType() == ActivityType.TRANSPORT
                && source.getDepartureAt() != null && source.getArrivalAt() != null
                && source.getDepartureAt().toLocalDate().equals(source.getArrivalAt().toLocalDate())
                && source.getToLatitude() != null && source.getToLongitude() != null) {
            return new double[]{source.getToLatitude(), source.getToLongitude()};
        }
        return coords(a);
    }

    private static String fmt(double[] p) {
        return String.format(Locale.ROOT, "%.6f,%.6f", p[0], p[1]);
    }

    /** Every n-th point, first and last kept, when the line is long. */
    private static List<List<Double>> thin(List<List<Double>> g) {
        if (g == null || g.size() <= MAX_POINTS) return g == null ? List.of() : g;
        List<List<Double>> out = new ArrayList<>(MAX_POINTS + 1);
        double step = (g.size() - 1) / (double) (MAX_POINTS - 1);
        for (int i = 0; i < MAX_POINTS - 1; i++) out.add(g.get((int) Math.round(i * step)));
        out.add(g.get(g.size() - 1));
        return out;
    }

    private String toJson(List<List<Double>> g) {
        try {
            // Six decimals (~0.1 m) is plenty and keeps the text short.
            List<List<Double>> rounded = new ArrayList<>(g.size());
            for (List<Double> p : g) rounded.add(List.of(round6(p.get(0)), round6(p.get(1))));
            return json.writeValueAsString(rounded);
        } catch (Exception e) {
            return null;
        }
    }

    private static double round6(double v) {
        return Math.round(v * 1_000_000d) / 1_000_000d;
    }
}
