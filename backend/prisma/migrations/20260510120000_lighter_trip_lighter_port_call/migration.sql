-- Optional lighter-hull port visit on each lighter trip (for workspace deep-links).

ALTER TABLE "lighter_trips" ADD COLUMN "lighter_port_call_id" TEXT;

CREATE INDEX "lighter_trips_lighter_port_call_id_idx" ON "lighter_trips"("lighter_port_call_id");

ALTER TABLE "lighter_trips" ADD CONSTRAINT "lighter_trips_lighter_port_call_id_fkey" FOREIGN KEY ("lighter_port_call_id") REFERENCES "vessel_calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;
