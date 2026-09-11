/** Earth's mean radius, metres. */
const EARTH_RADIUS_M = 6_371_000;

/**
 * Great-circle distance in metres between two [lat, lon] points — good enough
 * to tell "round the corner" from "another town", which is all the planner asks.
 */
export function distanceMeters([lat1, lon1], [lat2, lon2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
