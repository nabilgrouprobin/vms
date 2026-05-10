import { SOFStatus } from "@prisma/client";
import { Allow, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateLighterVesselSofDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sofNo?: string;

  @IsOptional()
  @IsString()
  startedAt?: string | null;

  @IsOptional()
  @IsString()
  completedAt?: string | null;

  @IsOptional()
  @IsEnum(SOFStatus)
  status?: SOFStatus;

  @Allow()
  laytimeAllowedHours?: string | number | null;

  @Allow()
  laytimeUsedHours?: string | number | null;

  @Allow()
  laytimeExcludedHours?: string | number | null;

  @Allow()
  laytimeBalanceHours?: string | number | null;

  @IsOptional()
  @IsString()
  laytimeCommenceAt?: string | null;

  @Allow()
  demurrageAmount?: string | number | null;

  @Allow()
  dispatchAmount?: string | number | null;

  @Allow()
  netAmount?: string | number | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  verifiedBy?: string | null;

  @IsOptional()
  @IsString()
  verifiedAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  approvedBy?: string | null;

  @IsOptional()
  @IsString()
  approvedAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string | null;
}
