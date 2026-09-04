-- Buffer days kept outside the dated sequence: a reserve day belongs to the trip
-- but has no date, so it never consumes one of the trip's days. When the plan
-- changes, its content is swapped into a real day.
ALTER TABLE days ALTER COLUMN date DROP NOT NULL;
