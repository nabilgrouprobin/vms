-- Laytime summary report: minimum allowed laytime and grace time (decimal hours).
ALTER TABLE "statements_of_fact"
  ADD COLUMN IF NOT EXISTS "laytime_minimum_allowed_hours" DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS "laytime_grace_hours" DECIMAL(12, 2);
