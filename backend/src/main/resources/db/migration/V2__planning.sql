-- Trip planning support: place priority (must-see vs optional), booking-required
-- flags on places/activities, and buffer days without a fixed plan.

ALTER TABLE public.places ADD COLUMN priority character varying(16) NOT NULL DEFAULT 'OPTIONAL';
ALTER TABLE public.places ADD COLUMN needs_booking boolean NOT NULL DEFAULT false;
ALTER TABLE public.activities ADD COLUMN needs_booking boolean NOT NULL DEFAULT false;
ALTER TABLE public.days ADD COLUMN is_buffer boolean NOT NULL DEFAULT false;
