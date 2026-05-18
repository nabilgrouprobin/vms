import { SOFStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { Allow, IsArray, IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";

import { SofLaytimeHolidayRowDto } from "./sof-laytime-holiday-row.dto";

export class UpdateMotherVesselSofDto {
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

  /** Optional partial cargo (MT) for discharge-rate allowance; null clears. */
  @Allow()
  laytimePartialCargoMt?: string | number | null;

  /** Discharge rate (MT/day) on this SOF; null clears. Used when contract rate is absent. */
  @Allow()
  laytimeDischargeRateMtPerDay?: string | number | null;

  /** Minimum allowed laytime (hours) for laytime summary; null clears. */
  @Allow()
  laytimeMinimumAllowedHours?: string | number | null;

  /** Grace time (hours) before demurrage in laytime summary; null clears. */
  @Allow()
  laytimeGraceHours?: string | number | null;

  /** Working week marker line for laytime calendar; null clears. */
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  laytimeExcludedTimePeriod?: string | null;

  /** Weekday codes excluded from segment counting when SOF week is set. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  laytimeExcludedDays?: string[];

  /**
   * When present (including `[]`), replaces all SOF laytime holidays for this statement.
   * Omit the field to leave existing holidays unchanged.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SofLaytimeHolidayRowDto)
  laytimeHolidays?: SofLaytimeHolidayRowDto[];

  /** Snapshot commence instant on the SOF (ISO string or null to clear). */
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
