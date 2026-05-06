-- AlterTable
ALTER TABLE "sof_events" ADD COLUMN "duration_minutes" INTEGER;

UPDATE "sof_events"
SET "duration_minutes" = ROUND(CAST("duration_hours" AS NUMERIC) * 60)
WHERE "duration_hours" IS NOT NULL AND CAST("duration_hours" AS NUMERIC) > 0;
