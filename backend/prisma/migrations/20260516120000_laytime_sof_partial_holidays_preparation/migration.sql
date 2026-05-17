-- Partial cargo on SOF, per-SOF laytime holidays, PREPARATION event category.

ALTER TYPE "SofEventTypeCategory" ADD VALUE 'PREPARATION';

ALTER TABLE "statements_of_fact"
  ADD COLUMN "laytime_partial_cargo_mt" DECIMAL(18, 3);

CREATE TABLE "sof_laytime_holidays" (
  "id" TEXT NOT NULL,
  "statement_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "holiday_start_at" TIMESTAMP(3) NOT NULL,
  "holiday_end_at" TIMESTAMP(3) NOT NULL,
  "eve_contact_end_hm" VARCHAR(5),
  "post_contact_start_hm" VARCHAR(5),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sof_laytime_holidays_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sof_laytime_holidays_statement_id_idx"
  ON "sof_laytime_holidays" ("statement_id");

ALTER TABLE "sof_laytime_holidays"
  ADD CONSTRAINT "sof_laytime_holidays_statement_id_fkey"
  FOREIGN KEY ("statement_id") REFERENCES "statements_of_fact" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
