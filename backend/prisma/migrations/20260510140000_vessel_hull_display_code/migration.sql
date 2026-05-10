-- Stable 3-digit hull segment for auto call/trip numbers (YY-MM-DD-{hull}-{seq}).
ALTER TABLE "vessels" ADD COLUMN "hull_display_code" INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS rn
  FROM "vessels"
  WHERE is_mother_vessel = TRUE OR is_lighter = TRUE
)
UPDATE "vessels" v
SET hull_display_code = ranked.rn
FROM ranked
WHERE v.id = ranked.id;

CREATE INDEX "vessels_hull_display_code_idx" ON "vessels" ("hull_display_code");
