-- Dynamic SOF event types (replaces SOFEventType enum on events / hourly statuses)

DROP INDEX IF EXISTS "sof_events_event_type_idx";
DROP INDEX IF EXISTS "sof_events_event_type_event_time_idx";
DROP INDEX IF EXISTS "sof_events_statement_id_event_type_event_time_idx";

DROP INDEX IF EXISTS "sof_hourly_statuses_event_type_idx";
DROP INDEX IF EXISTS "sof_hourly_statuses_event_type_hour_start_at_idx";
DROP INDEX IF EXISTS "sof_hourly_statuses_statement_id_event_type_hour_start_at_idx";

CREATE TYPE "SofEventTypeScope" AS ENUM ('MOTHER_VESSEL', 'LIGHTER_VESSEL', 'BOTH');

CREATE TABLE "sof_event_type_definitions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "SofEventTypeScope" NOT NULL DEFAULT 'BOTH',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sof_event_type_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sof_event_type_definitions_code_key" ON "sof_event_type_definitions"("code");
CREATE INDEX "sof_event_type_definitions_scope_is_active_idx" ON "sof_event_type_definitions"("scope", "is_active");
CREATE INDEX "sof_event_type_definitions_is_active_idx" ON "sof_event_type_definitions"("is_active");

INSERT INTO "sof_event_type_definitions" ("id", "code", "name", "scope", "is_active", "created_at", "updated_at") VALUES
('sofetype_legacy_anchor_dropped', 'EVT-LEGACY-ANCHOR-DROPPED', 'Anchor dropped', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_nor_tendered', 'EVT-LEGACY-NOR-TENDERED', 'NOR tendered', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_nor_accepted', 'EVT-LEGACY-NOR-ACCEPTED', 'NOR accepted', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_lc_released', 'EVT-LEGACY-LC-RELEASED', 'LC released', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_discharge_started', 'EVT-LEGACY-DISCHARGE-STARTED', 'Discharge started', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_discharge_stopped', 'EVT-LEGACY-DISCHARGE-STOPPED', 'Discharge stopped', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_hold', 'EVT-LEGACY-HOLD', 'Hold', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_shifting', 'EVT-LEGACY-SHIFTING', 'Shifting', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_breakdown', 'EVT-LEGACY-BREAKDOWN', 'Breakdown', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_completed', 'EVT-LEGACY-COMPLETED', 'Completed', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_anchor_up', 'EVT-LEGACY-ANCHOR-UP', 'Anchor up', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_lc_hold', 'EVT-LEGACY-LC-HOLD', 'LC hold', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_legacy_other', 'EVT-LEGACY-OTHER', 'Other', 'BOTH', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "sof_events" ADD COLUMN "event_type_id" TEXT;

UPDATE "sof_events" SET "event_type_id" = CASE "event_type"::text
  WHEN 'ANCHOR_DROPPED' THEN 'sofetype_legacy_anchor_dropped'
  WHEN 'NOR_TENDERED' THEN 'sofetype_legacy_nor_tendered'
  WHEN 'NOR_ACCEPTED' THEN 'sofetype_legacy_nor_accepted'
  WHEN 'LC_RELEASED' THEN 'sofetype_legacy_lc_released'
  WHEN 'DISCHARGE_STARTED' THEN 'sofetype_legacy_discharge_started'
  WHEN 'DISCHARGE_STOPPED' THEN 'sofetype_legacy_discharge_stopped'
  WHEN 'HOLD' THEN 'sofetype_legacy_hold'
  WHEN 'SHIFTING' THEN 'sofetype_legacy_shifting'
  WHEN 'BREAKDOWN' THEN 'sofetype_legacy_breakdown'
  WHEN 'COMPLETED' THEN 'sofetype_legacy_completed'
  WHEN 'ANCHOR_UP' THEN 'sofetype_legacy_anchor_up'
  WHEN 'LC_HOLD' THEN 'sofetype_legacy_lc_hold'
  WHEN 'OTHER' THEN 'sofetype_legacy_other'
  ELSE 'sofetype_legacy_other'
END;

ALTER TABLE "sof_events" DROP COLUMN "event_type";
ALTER TABLE "sof_events" ALTER COLUMN "event_type_id" SET NOT NULL;

ALTER TABLE "sof_events" ADD CONSTRAINT "sof_events_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "sof_event_type_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "sof_events_event_type_id_idx" ON "sof_events"("event_type_id");
CREATE INDEX "sof_events_event_type_id_event_time_idx" ON "sof_events"("event_type_id", "event_time");
CREATE INDEX "sof_events_statement_id_event_type_id_event_time_idx" ON "sof_events"("statement_id", "event_type_id", "event_time");

ALTER TABLE "sof_hourly_statuses" ADD COLUMN "event_type_id" TEXT;

UPDATE "sof_hourly_statuses" SET "event_type_id" = CASE "event_type"::text
  WHEN 'ANCHOR_DROPPED' THEN 'sofetype_legacy_anchor_dropped'
  WHEN 'NOR_TENDERED' THEN 'sofetype_legacy_nor_tendered'
  WHEN 'NOR_ACCEPTED' THEN 'sofetype_legacy_nor_accepted'
  WHEN 'LC_RELEASED' THEN 'sofetype_legacy_lc_released'
  WHEN 'DISCHARGE_STARTED' THEN 'sofetype_legacy_discharge_started'
  WHEN 'DISCHARGE_STOPPED' THEN 'sofetype_legacy_discharge_stopped'
  WHEN 'HOLD' THEN 'sofetype_legacy_hold'
  WHEN 'SHIFTING' THEN 'sofetype_legacy_shifting'
  WHEN 'BREAKDOWN' THEN 'sofetype_legacy_breakdown'
  WHEN 'COMPLETED' THEN 'sofetype_legacy_completed'
  WHEN 'ANCHOR_UP' THEN 'sofetype_legacy_anchor_up'
  WHEN 'LC_HOLD' THEN 'sofetype_legacy_lc_hold'
  WHEN 'OTHER' THEN 'sofetype_legacy_other'
  ELSE NULL
END
WHERE "event_type" IS NOT NULL;

ALTER TABLE "sof_hourly_statuses" DROP COLUMN "event_type";

ALTER TABLE "sof_hourly_statuses" ADD CONSTRAINT "sof_hourly_statuses_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "sof_event_type_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "sof_hourly_statuses_event_type_id_idx" ON "sof_hourly_statuses"("event_type_id");
CREATE INDEX "sof_hourly_statuses_event_type_id_hour_start_at_idx" ON "sof_hourly_statuses"("event_type_id", "hour_start_at");
CREATE INDEX "sof_hourly_statuses_statement_id_event_type_id_hour_start_at_idx" ON "sof_hourly_statuses"("statement_id", "event_type_id", "hour_start_at");

DROP TYPE "SOFEventType";
