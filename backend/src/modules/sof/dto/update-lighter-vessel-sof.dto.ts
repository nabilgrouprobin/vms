import { SOFStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { Allow, IsArray, IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";

import { SofLaytimeHolidayRowDto } from "./sof-laytime-holiday-row.dto";

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

  @Allow()
  laytimePartialCargoMt?: string | number | null;

  @Allow()
  laytimeDischargeRateMtPerDay?: string | number | null;

  @Allow()
  laytimeMinimumAllowedHours?: string | number | null;

  @Allow()
  laytimeGraceHours?: string | number | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  laytimeExcludedTimePeriod?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  laytimeExcludedDays?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SofLaytimeHolidayRowDto)
  laytimeHolidays?: SofLaytimeHolidayRowDto[];

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
