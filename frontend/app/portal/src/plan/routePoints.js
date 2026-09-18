/**
 * What the printed maps draw: every stop with coordinates, in visiting order.
 * Pure functions — nothing here touches the network or the DOM.
 */
import { isHotelRow, isJourneyRow } from './stops.js';

const located = (a) => a.latitude != null && a.longitude != null;

// Getting to the airport is not the trip: on the first day the stops before the
// outbound journey stay off the map, on the last day the stops after the return one.
function routeStops(activities, { first, last }) {
  let rows = activities;
  if (first) {
    const out = rows.findIndex(isJourneyRow);
    if (out > 0) rows = rows.slice(out);
  }
  if (last) {
    const back = rows.map(isJourneyRow).lastIndexOf(true);
    if (back >= 0) rows = rows.slice(0, back);
  }
  return rows.filter((a) => located(a) && !isJourneyRow(a));
}

/**
 * The running numbers the book prints beside a day's stops: every stop that is
 * not a hotel or a journey, whether or not it has a pin — those rows are not
 * stops you chose. A reserve day's ideas are offers, not an order, so none.
 *
 * @returns {Map<object, string>} activity → its number, for the numbered ones only
 */
export function stopNumbers(activities, reserve) {
  const numbers = new Map();
  if (reserve) return numbers;
  let n = 0;
  for (const a of activities) {
    if (!isHotelRow(a) && !isJourneyRow(a)) numbers.set(a, String(++n));
  }
  return numbers;
}

/** The route map on page two: the whole trip, day after day. */
export function collectMapPoints(d) {
  const days = (d.days || []).filter((day) => day.date);
  return days.flatMap((day, i) =>
    routeStops(day.activities || [], { first: i === 0, last: i === days.length - 1 }).map((a) => ({
      lat: Number(a.latitude),
      lon: Number(a.longitude),
      kind: isHotelRow(a) ? 'hotel' : 'stop',
      dayNumber: day.dayNumber,
    })),
  );
}

/**
 * One small map per page of the book: the day's own stops, each dot carrying
 * the number the list beside it prints, so the two read as one. The numbers
 * are counted before the first and last day lose their airport runs, so a stop
 * keeps its number when its neighbour is left off the map. A reserve day's
 * ideas are dotted without numbers, and the caller draws no line between them.
 *
 * @returns {Array<{reserve: boolean, points: Array<{lat: number, lon: number, kind: 'stop'|'hotel', label?: string}>}>}
 *          one entry per day of `d.days`, in the same order; `points` is empty when
 *          there is nothing to draw
 */
export function collectDayMaps(d) {
  const days = d.days || [];
  const dated = days.filter((day) => day.date);
  return days.map((day) => {
    const reserve = !!day.buffer || !day.date;
    const acts = day.activities || [];
    const numbers = stopNumbers(acts, reserve);
    const rows = reserve
      ? acts.filter((a) => located(a) && !isJourneyRow(a))
      : routeStops(acts, { first: day === dated[0], last: day === dated[dated.length - 1] });
    return {
      reserve,
      points: rows.map((a) => ({
        lat: Number(a.latitude),
        lon: Number(a.longitude),
        kind: isHotelRow(a) ? 'hotel' : 'stop',
        ...(numbers.has(a) ? { label: numbers.get(a) } : {}),
      })),
    };
  });
}
