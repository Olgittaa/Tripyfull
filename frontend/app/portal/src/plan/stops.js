/**
 * A day's stops as the plan reads them: where a stop is pinned, how the day
 * moves from one to the next, and what the server knows about each leg.
 * Pure functions — nothing here touches the network or the DOM.
 */

/** A stop written from a hotel booking: where you wake up or sleep. */
export const isHotelRow = (a) => a.type === 'ACCOMMODATION';
/** A stop written from a journey booking: a flight, a train, a pick-up. */
export const isJourneyRow = (a) => !!a.fromBooking && a.type === 'TRANSPORT';

// A stop is on the map either through its linked place or, for one written from
// a booking (a hotel, an airport), through coordinates of its own.
export const stopLat = (a) => a.placeLatitude ?? a.latitude;
export const stopLon = (a) => a.placeLongitude ?? a.longitude;
export const hasCoords = (a) => stopLat(a) != null && stopLon(a) != null;

/* A journey row is pinned where it departs. When it lands the same day, the
   day continues from the arrival airport or station — the next leg starts
   there, and the map shows where that is. An overnight journey has its own
   "Arrive" row the next morning instead. */
export const landsSameDay = (a) =>
  isJourneyRow(a) &&
  a.bookingToLatitude != null &&
  a.bookingToLongitude != null &&
  !!a.bookingDepartureAt &&
  !!a.bookingArrivalAt &&
  a.bookingDepartureAt.slice(0, 10) === a.bookingArrivalAt.slice(0, 10);

/** Where the leg to the next stop begins: the stop's pin, or where its journey lands. */
export const legStart = (a) =>
  landsSameDay(a)
    ? [Number(a.bookingToLatitude), Number(a.bookingToLongitude)]
    : [Number(stopLat(a)), Number(stopLon(a))];

/**
 * How you get to the next stop. Walking and driving are routed for real; a bus
 * or train leg is looked up in Google's timetables for the stop's own time and
 * names its line, and is an estimate only where no service is listed; a taxi
 * is an estimate — the row says so. A flight is a booking with its own row and
 * its real times, not a way between two stops.
 */
export const TRAVEL_MODES = [
  { key: 'foot', icon: '🚶', label: 'on foot', hint: 'Walk to the next stop' },
  {
    key: 'taxi',
    icon: '🚕',
    label: 'by taxi',
    hint: 'Taxi / ride-hailing — road time plus hailing',
  },
  {
    key: 'bus',
    icon: '🚌',
    label: 'by bus',
    hint: 'Bus — by timetable where Google has one, else road time plus stops (estimate)',
  },
  {
    key: 'train',
    icon: '🚆',
    label: 'by train',
    hint: 'Train — by timetable where Google has one, else an estimate',
  },
  { key: 'car', icon: '🚗', label: 'by car', hint: 'Drive yourself to the next stop' },
];
const MODE_KEYS = TRAVEL_MODES.map((m) => m.key);
export const modeLabel = (key) => TRAVEL_MODES.find((m) => m.key === key)?.label || '';

/* The way the leg was computed for — the chosen mode, or the day's default
   (a short hop on foot, a longer one by car when a rental is at hand, else by
   taxi) — as the server reports it. */
export const legMode = (a) =>
  a.travelMode || (MODE_KEYS.includes(a.travelModeToNext) ? a.travelModeToNext : 'foot');

/** What the server sends back about a leg when a stop is saved. */
export const TRAVEL_FIELDS = [
  'travelModeToNext',
  'travelMode',
  'travelKnown',
  'travelSeconds',
  'travelMeters',
  'travelGeometry',
  'travelEstimated',
  'travelNote',
];

/** What the server knows about a stop's leg: undefined while it is not known
    yet, null when there is no route, else the numbers and the line. */
export const legData = (a) => {
  if (!a.travelKnown) return undefined;
  if (a.travelSeconds == null) return null;
  return {
    durationSec: a.travelSeconds,
    distanceM: a.travelMeters,
    geometry: a.travelGeometry,
    estimated: a.travelEstimated,
    note: a.travelNote, // the line, when a timetable answered
  };
};

/** One leg per consecutive pair of pinned stops, owned by the departing stop. */
export function buildLegs(activities) {
  const stops = activities.filter(hasCoords);
  const legs = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    legs.push({
      fromId: from.id,
      mode: legMode(from),
      from: legStart(from),
      to: [Number(stopLat(to)), Number(stopLon(to))],
      data: legData(from),
    });
  }
  return legs;
}

/** Whole-day totals, or null until every leg has real numbers. */
export function legTotals(legs) {
  if (!legs.length) return null;
  let durationSec = 0;
  let distanceM = 0;
  for (const l of legs) {
    if (!l.data) return null;
    durationSec += l.data.durationSec;
    distanceM += l.data.distanceM;
  }
  return { durationSec, distanceM };
}

/** Lines for the map: the road where routed, a straight segment otherwise, and
    a journey's own crow-flies line between its two pins. */
export function mapSegments(activities, legs) {
  const out = legs.map((l) => ({
    mode: l.mode,
    points: l.data?.geometry?.length >= 2 ? l.data.geometry : [l.from, l.to],
  }));
  for (const a of activities) {
    if (landsSameDay(a) && hasCoords(a)) {
      out.push({ mode: 'plane', points: [[Number(stopLat(a)), Number(stopLon(a))], legStart(a)] });
    }
  }
  return out;
}

/**
 * The night is already on the page when a stay has its evening row in the plan
 * ("Check in", "Overnight", or a hotel stop of your own) or a journey lands on
 * the next day; an overnight fact would say it twice. A "Check out" row is the
 * morning after — it says nothing about where this night is spent.
 */
export function nightShownInPlan(activities, date) {
  return activities.some(
    (a) =>
      (isHotelRow(a) && !(a.fromBooking && /^Check out · /.test(a.name || ''))) ||
      (isJourneyRow(a) &&
        !!date &&
        !!a.bookingArrivalAt &&
        String(a.bookingArrivalAt).slice(0, 10) > date),
  );
}
