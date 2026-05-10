-- Promote hull_display_code to a unique constraint so concurrent vessel inserts
-- can't allocate the same MAX(...)+1 value (allocation now retries on P2002).

DROP INDEX IF EXISTS "vessels_hull_display_code_idx";

CREATE UNIQUE INDEX "vessels_hull_display_code_key"
  ON "vessels" ("hull_display_code");
