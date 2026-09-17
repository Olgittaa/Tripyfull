-- Places belong to whoever saved them and are seen by no one else: the product has
-- no sharing, so a place has nothing to be public about.
ALTER TABLE places DROP COLUMN IF EXISTS visibility;
