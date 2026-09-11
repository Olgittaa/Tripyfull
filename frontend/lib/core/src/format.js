/**
 * Numbers as the plan says them: a leg's time, a stop's stay, a distance.
 * One voice for the itinerary, the overview and the printed route book.
 */

/** Seconds → "25 min", "1 h 40 min", "2 h". Never less than a minute. */
export function formatDuration(seconds) {
  return formatMinutes(Math.max(1, Math.round((seconds || 0) / 60)));
}

/** Minutes → "25 min", "1 h 40 min", "2 h". */
export function formatMinutes(minutes) {
  const m = Math.max(0, Math.round(minutes || 0));
  if (m < 60) return `${m} min`;
  const rest = m % 60;
  return rest ? `${Math.floor(m / 60)} h ${rest} min` : `${Math.floor(m / 60)} h`;
}

/** Metres → "350 m", "12.4 km". */
export function formatDistance(metres) {
  const m = metres || 0;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
