-- Planning strategy: 1–5 place rating replaces the binary MUST_SEE/OPTIONAL priority.
-- 5 = worth the whole trip (~7-8 per trip), 4 = big detour OK (~10%), 3 = small detour
-- (~20%), 2 = only if on the way (~30%), 1 = maybe skip. Plus per-place planning inputs:
-- rating comment, visit duration, audience and special-preparation flag.

ALTER TABLE public.places ADD COLUMN rating integer NOT NULL DEFAULT 3;
UPDATE public.places SET rating = 5 WHERE priority = 'MUST_SEE';
ALTER TABLE public.places DROP COLUMN priority;

ALTER TABLE public.places ADD COLUMN rating_comment character varying(500);
ALTER TABLE public.places ADD COLUMN visit_minutes integer;
ALTER TABLE public.places ADD COLUMN audience character varying(8) NOT NULL DEFAULT 'ALL';
ALTER TABLE public.places ADD COLUMN needs_preparation boolean NOT NULL DEFAULT false;
