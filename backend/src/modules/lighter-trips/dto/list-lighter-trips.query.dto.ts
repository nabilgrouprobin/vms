import { LighterTripStatus } from "@prisma/client";
import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ListLighterTripsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  cursor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  limit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  vesselCallId?: string;

  /** Registry lighter hull — narrows trips to this vessel (any mother call). */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  lighterVesselId?: string;

  @IsOptional()
  @IsEnum(LighterTripStatus)
  status?: LighterTripStatus;

  /** When `ghat-aging`, response includes assignment, ghat, cargo, and dates for reporting. Requires `vesselCallId`. */
  @IsOptional()
  @IsIn(["ghat-aging"])
  report?: "ghat-aging";
}
