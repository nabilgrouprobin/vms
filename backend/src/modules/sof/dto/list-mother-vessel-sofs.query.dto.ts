import { SOFStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ListMotherVesselSofsQueryDto {
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
  vesselCallId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
