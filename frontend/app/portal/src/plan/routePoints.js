/**
 * What the printed route map draws: every stop with coordinates, in visiting
 * order. Pure functions — nothing here touches the network or the DOM.
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
