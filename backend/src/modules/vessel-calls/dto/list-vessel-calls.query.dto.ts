import { MotherVesselStatus } from "@prisma/client";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ListVesselCallsQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  status?: MotherVesselStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  motherVesselOnly?: string;

  /** `mother` (default when omitted), `lighter`, or `all` (also when `motherVesselOnly=false`). */
  @IsOptional()
  @IsString()
  @IsIn(["mother", "lighter", "all"])
  hullKind?: string;

  /** When set, return calls for this hull only (ignores mother/lighter filter unless combined). */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  vesselId?: string;
}
