// Feature flags for the portal. Flip a value and rebuild — no other changes needed.
export const FEATURES = {
  // External place autocomplete (Google Places, Photon/OSM as fallback, both
  // behind /api/geo/places): the address search in the place drawer, the
  // "find a new place" field in the activity drawer, the Find dialog in the
  // Places library, and hotel / from–to / activity-location search in bookings.
  geoPlaceSearch: true,
};
