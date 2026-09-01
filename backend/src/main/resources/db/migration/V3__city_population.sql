-- Full GeoNames city dataset: population drives search ranking
-- (biggest match first instead of alphabetical noise).

ALTER TABLE public.cities ADD COLUMN population bigint NOT NULL DEFAULT 0;
