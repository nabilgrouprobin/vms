-- Track Hold/Delay vs Normal as a property of the SOF event type definition.
-- Existing event types default to NORMAL; backfill the well-known hold/delay
-- definitions that historically used `is_hold = true` in operations.

CREATE TYPE "SofEventTypeCategory" AS ENUM ('NORMAL', 'HOLD_DELAY');

ALTER TABLE "sof_event_type_definitions"
  ADD COLUMN "category" "SofEventTypeCategory" NOT NULL DEFAULT 'NORMAL';

CREATE INDEX "sof_event_type_definitions_category_is_active_idx"
  ON "sof_event_type_definitions" ("category", "is_active");

UPDATE "sof_event_type_definitions"
SET "category" = 'HOLD_DELAY'
WHERE "code" IN (
    'EVT-LEGACY-HOLD',
    'EVT-LEGACY-LC-HOLD',
    'EVT-LEGACY-BREAKDOWN'
);
