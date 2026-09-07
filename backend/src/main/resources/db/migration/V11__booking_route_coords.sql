-- Endpoints of a travel booking. The single latitude/longitude pair holds a
-- hotel or an activity; a journey has two ends, and picking them in the editor
-- already yields coordinates — they were simply dropped on save, so the route
-- map was empty every time a booking was reopened.
ALTER TABLE bookings ADD COLUMN from_latitude double precision;
ALTER TABLE bookings ADD COLUMN from_longitude double precision;
ALTER TABLE bookings ADD COLUMN to_latitude double precision;
ALTER TABLE bookings ADD COLUMN to_longitude double precision;
