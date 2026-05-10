import { SOFStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ListLighterVesselSofsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  cursor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  limit?: string;

  @IsOptional()
  @IsEnum(SOFStatus)
  status?: SOFStatus;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  lighterTripId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  vesselCallId?: string;

  /** Filter SOFs whose trip uses this lighter-class vessel (hull). */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  lighterVesselId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
