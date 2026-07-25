// Feature flags for the portal. Flip a value and rebuild — no other changes needed.
export const FEATURES = {
  // External place autocomplete (Photon/OSM behind /api/geo/places): the
  // "find a new place" field in the activity drawer, the Find dialog in the
  // Places library, and hotel / from–to / activity-location search in bookings.
  // Disabled for now — result quality isn't good enough yet and we don't want
  // to hammer the free service. Saved places, Google Maps import, manual entry
  // and city search keep working; re-enable by setting this to true.
  geoPlaceSearch: false,
};
