-- Itinerary stops generated from a booking. The booking owns them: a re-sync
-- replaces its own stops and never touches the ones added by hand.
ALTER TABLE activities ADD COLUMN source_booking_id uuid;

-- A generated stop (a hotel, an airport) is a point on the map without being a
-- place in the curated library, so it carries its own coordinates.
ALTER TABLE activities ADD COLUMN latitude double precision;
ALTER TABLE activities ADD COLUMN longitude double precision;

CREATE INDEX idx_activities_source_booking ON activities (source_booking_id);

-- ACCOMMODATION joins the activity types: a stay written into the plan is a
-- hotel stop, not "other". The baseline schema pins the allowed values in a
-- CHECK, so the enum alone is not enough.
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;

ALTER TABLE activities ADD CONSTRAINT activities_type_check
    CHECK (type IS NULL OR type IN
        ('SIGHTSEEING', 'BEACH', 'NATURE', 'NEIGHBORHOOD', 'RESTAURANT',
         'MEAL_STOP', 'SHOPPING', 'TRANSPORT', 'ACCOMMODATION', 'OTHER'));
