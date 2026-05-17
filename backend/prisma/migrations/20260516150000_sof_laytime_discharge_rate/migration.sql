-- Discharge rate (MT/day) on the SOF when no import contract or as statement override input.
ALTER TABLE "statements_of_fact"
ADD COLUMN IF NOT EXISTS "laytime_discharge_rate_mt_per_day" DECIMAL(18, 2);
