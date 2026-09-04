-- Two place lists:
--   * global library — grouped by the trips a place belongs to;
--   * a trip's own list — grouped by folders the user creates inside that trip.
-- So folders become trip-scoped, and a place joins a trip's list explicitly
-- (candidates collected before anything is scheduled).

CREATE TABLE public.trip_places (
    trip_id uuid NOT NULL REFERENCES public.trips(id),
    place_id uuid NOT NULL REFERENCES public.places(id),
    PRIMARY KEY (trip_id, place_id)
);

CREATE INDEX idx_trip_places_place ON public.trip_places (place_id);

ALTER TABLE public.place_folders ADD COLUMN trip_id uuid REFERENCES public.trips(id);

-- Existing folders were global; attach them to their owner's trip when that is
-- unambiguous (exactly one trip). Anything left with trip_id IS NULL stays
-- reachable from the global list as an unassigned folder.
UPDATE public.place_folders f
SET trip_id = t.id
FROM public.trips t
WHERE t.owner_id = f.owner_id
  AND (SELECT count(*) FROM public.trips t2 WHERE t2.owner_id = f.owner_id) = 1;

-- Seed each trip's list: places already scheduled in its itinerary…
INSERT INTO public.trip_places (trip_id, place_id)
SELECT DISTINCT d.trip_id, a.place_id
FROM public.activities a
JOIN public.days d ON d.id = a.day_id
WHERE a.place_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- …plus everything filed into that trip's folders.
INSERT INTO public.trip_places (trip_id, place_id)
SELECT DISTINCT f.trip_id, fp.place_id
FROM public.folder_places fp
JOIN public.place_folders f ON f.id = fp.folder_id
WHERE f.trip_id IS NOT NULL
ON CONFLICT DO NOTHING;
