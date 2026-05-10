import { SOFStatus } from "@prisma/client";
import { Allow, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateLighterVesselSofDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sofNo?: string;

  @IsString()
  @MaxLength(40)
  lighterTripId!: string;

  @IsOptional()
  @IsString()
  startedAt?: string;

  @IsOptional()
  @IsString()
  completedAt?: string;

  @IsOptional()
  @IsEnum(SOFStatus)
  status?: SOFStatus;

  @Allow()
  laytimeAllowedHours?: string | number;

  @Allow()
  laytimeUsedHours?: string | number;

  @Allow()
  laytimeExcludedHours?: string | number;

  @Allow()
  laytimeBalanceHours?: string | number;

  @Allow()
  demurrageAmount?: string | number;

  @Allow()
  dispatchAmount?: string | number;

  @Allow()
  netAmount?: string | number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  verifiedBy?: string;

  @IsOptional()
  @IsString()
  verifiedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  approvedBy?: string;

  @IsOptional()
  @IsString()
  approvedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}
