-- Folders belong to a trip (since V5), but rows created while the "New folder"
-- form omitted the trip id ended up with trip_id IS NULL. Such a folder is
-- invisible in the trip's list, and filing a place into it does not add the
-- place to the trip — so the place seemed to vanish.
--
-- The service now refuses to create a trip-less folder. This attaches the ones
-- already stored to their owner's trip, but only when that owner has exactly
-- one trip: with none there is nothing to attach to, and with several the right
-- trip cannot be inferred, so those rows are left for the owner to sort out.

UPDATE place_folders f
SET trip_id = (SELECT t.id FROM trips t WHERE t.owner_id = f.owner_id)
WHERE f.trip_id IS NULL
  AND (SELECT count(*) FROM trips t WHERE t.owner_id = f.owner_id) = 1;
