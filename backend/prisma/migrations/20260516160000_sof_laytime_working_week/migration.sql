-- Working week (contact window) stored on the SOF for manual laytime sidebar input.
ALTER TABLE "statements_of_fact"
ADD COLUMN IF NOT EXISTS "laytime_excluded_time_period" TEXT;

ALTER TABLE "statements_of_fact"
ADD COLUMN IF NOT EXISTS "laytime_excluded_days" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
