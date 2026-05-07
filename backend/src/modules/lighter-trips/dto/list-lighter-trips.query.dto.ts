import { LighterTripStatus } from "@prisma/client";

export class ListLighterTripsQueryDto {
  cursor?: string;
  limit?: string;
  search?: string;
  vesselCallId?: string;
  /** Registry lighter hull — narrows trips to this vessel (any mother call). */
  lighterVesselId?: string;
  status?: LighterTripStatus;
  /** When `ghat-aging`, response includes assignment, ghat, cargo, and dates for reporting. Requires `vesselCallId`. */
  report?: "ghat-aging";
}
