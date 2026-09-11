import { isHotelRow, isJourneyRow } from './stops.js';

/**
 * How full a day is: the stops you go to, the time at them, the time between
 * them. Hotel rows are where you sleep, not a stop; a journey is time on the
 * move. Pure functions of plain stop objects.
 */

/** Minutes a stop lasts by its own clock; 0 without both times. */
export const minutesBetween = (a) => {
  if (!a.startTime || !a.endTime) return 0;
  const [h1, m1] = a.startTime.split(':').map(Number);
  const [h2, m2] = a.endTime.split(':').map(Number);
  const span = h2 * 60 + m2 - (h1 * 60 + m1);
  return span > 0 ? span : 0;
};

/**
 * Minutes of a booked journey that fall on the day (ISO date): an overnight
 * flight leaving at 20:55 is three hours of this day and seven of the next.
 * Without the booking's real times, the stop's own start–end has to do.
 */
export const journeyMinutesOn = (a, date) => {
  if (!date || !a.bookingDepartureAt || !a.bookingArrivalAt) return minutesBetween(a);
  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const from = Math.max(new Date(a.bookingDepartureAt).getTime(), dayStart.getTime());
  const to = Math.min(new Date(a.bookingArrivalAt).getTime(), dayEnd.getTime());
  return to > from ? Math.round((to - from) / 60000) : 0;
};

/**
 * @param activities     the day's stops in order
 * @param date           the day's ISO date, for journeys that cross midnight
 * @param routeSeconds   time on the move between stops, from the legs (or null while unknown)
 * @param visitMinutesFor  a stop's usual visit length from its saved place, when the stop has no clock
 * @returns { stops, visitMin, travelMin, untimed } — untimed: stops with neither a clock nor an estimate
 */
export function dayLoad({ activities, date, routeSeconds, visitMinutesFor = () => null }) {
  let visitMin = 0;
  let travelMin = routeSeconds ? Math.round(routeSeconds / 60) : 0;
  let stops = 0;
  let untimed = 0;
  const seenJourneys = new Set();
  for (const a of activities) {
    if (isHotelRow(a)) continue;
    if (isJourneyRow(a)) {
      // A departure and its "Arrive" row are one journey; count it once.
      const key = a.bookingDepartureAt ? `${a.bookingDepartureAt}|${a.bookingArrivalAt}` : a.id;
      if (!seenJourneys.has(key)) {
        seenJourneys.add(key);
        travelMin += journeyMinutesOn(a, date);
      }
      continue;
    }
    stops += 1;
    const span = minutesBetween(a);
    const estimate = span ? 0 : visitMinutesFor(a);
    if (span) visitMin += span;
    else if (estimate) visitMin += estimate;
    else untimed += 1; // no time, no estimate: say so instead of inventing an hour
  }
  return { stops, visitMin, travelMin, untimed };
}
