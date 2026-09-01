// Feature flags for the portal. Flip a value and rebuild — no other changes needed.
export const FEATURES = {
  // External place autocomplete (Photon/OSM behind /api/geo/places): the
  // "find a new place" field in the activity drawer, the Find dialog in the
  // Places library, and hotel / from–to / activity-location search in bookings.
  geoPlaceSearch: true,
};
