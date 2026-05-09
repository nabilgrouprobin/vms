import { SOFStatus } from "@prisma/client";

export class ListLighterVesselSofsQueryDto {
  cursor?: string;
  limit?: string;
  status?: SOFStatus;
  lighterTripId?: string;
  vesselCallId?: string;
  /** Filter SOFs whose trip uses this lighter-class vessel (hull). */
  lighterVesselId?: string;
  search?: string;
}
