-- The leg from a stop to the next one, computed on the server and kept on the
-- stop it leaves from. travel_key names what it was computed for (mode and both
-- endpoints); a key with null seconds means "no route between these two".
alter table activities
    add column travel_key       varchar(160),
    add column travel_seconds   integer,
    add column travel_meters    integer,
    add column travel_geometry  text,
    add column travel_estimated boolean not null default false;

-- A flight is a booking with its own row and its real times, not a way between
-- two stops: legs that were "by plane" fall back to the default.
update activities set travel_mode_to_next = null where travel_mode_to_next = 'plane';
