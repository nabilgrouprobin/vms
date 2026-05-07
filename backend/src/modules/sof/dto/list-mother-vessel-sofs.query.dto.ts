import { SOFStatus } from "@prisma/client";

export class ListMotherVesselSofsQueryDto {
  cursor?: string;
  limit?: string;
  status?: SOFStatus;
  vesselCallId?: string;
  search?: string;
}
