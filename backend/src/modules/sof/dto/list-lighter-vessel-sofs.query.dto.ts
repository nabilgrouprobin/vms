import { SOFStatus } from "@prisma/client";

export class ListLighterVesselSofsQueryDto {
  cursor?: string;
  limit?: string;
  status?: SOFStatus;
  lighterTripId?: string;
  vesselCallId?: string;
  search?: string;
}
