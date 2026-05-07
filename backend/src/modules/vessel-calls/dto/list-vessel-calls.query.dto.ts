import { MotherVesselStatus } from "@prisma/client";

export class ListVesselCallsQueryDto {
  cursor?: string;
  limit?: string;
  status?: MotherVesselStatus;
  search?: string;
  motherVesselOnly?: string;
}
