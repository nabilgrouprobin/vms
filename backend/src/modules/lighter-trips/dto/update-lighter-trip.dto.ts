import { LighterTripStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  Allow,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested
} from "class-validator";

/** Partial cargo line updates (MT); only send fields you want to change. */
export class LighterTripCargoQtyUpdateDto {
  @IsString()
  @MaxLength(40)
  id!: string;

  @Allow()
  estimatedQtyTon?: string | null;

  @Allow()
  loadedQtyTon?: string | null;

  @Allow()
  dischargedQtyTon?: string | null;
}

export class UpdateLighterTripDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string | null;

  @IsOptional()
  @IsEnum(LighterTripStatus)
  status?: LighterTripStatus;

  /** Operational hold / delay reason (e.g. loading stopped). Cleared when omitted and you PATCH null explicitly. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  holdReason?: string | null;

  /** When false, skips mirroring milestones/status to the linked lighter assignment. Default: sync. */
  @IsOptional()
  @IsBoolean()
  syncLighterAssignment?: boolean;

  /** Mother vessel call (only when the trip has no linked lighter assignment). */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  vesselCallId?: string;

  /** Lighter hull (`Vessel` with `isLighter`); only when the trip has no linked lighter assignment. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  lighterVesselId?: string;

  /** Lighter-hull port visit; omit to leave unchanged, null to clear. Must match the trip lighter hull when set. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  lighterPortCallId?: string | null;

  /** Sets linked assignment `carrierConfirmedDate` (carrier accepted the allocation). */
  @IsOptional()
  @IsString()
  carrierConfirmedAt?: string | null;

  /** Surveyor-reported loaded quantity on the linked assignment (MT). */
  @Allow()
  assignmentSurveyorLoadedQtyMt?: string | null;

  /** Actual discharged quantity at ghat on the linked assignment (MT). */
  @Allow()
  assignmentActualDischargedQtyMt?: string | null;

  /** Log text on the trip event row when `status` changes (default: generic message). */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  statusChangeRemarks?: string | null;

  @IsOptional()
  @IsString()
  laytimeCommenceAt?: string | null;

  @IsOptional()
  @IsString()
  wayToMVReadyAt?: string | null;

  @IsOptional()
  @IsString()
  wayToMVStartedAt?: string | null;

  @IsOptional()
  @IsString()
  wayToMVCompletedAt?: string | null;

  @IsOptional()
  @IsString()
  alongsideDate?: string | null;

  @IsOptional()
  @IsString()
  loadingStartedAt?: string | null;

  @IsOptional()
  @IsString()
  loadingCompletedAt?: string | null;

  @IsOptional()
  @IsString()
  departedMvDate?: string | null;

  @IsOptional()
  @IsString()
  wayToGhatStartedAt?: string | null;

  @IsOptional()
  @IsString()
  wayToGhatCompletedAt?: string | null;

  @IsOptional()
  @IsString()
  arrivedGhatDate?: string | null;

  @IsOptional()
  @IsString()
  unloadStartedAt?: string | null;

  @IsOptional()
  @IsString()
  unloadCompletedAt?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LighterTripCargoQtyUpdateDto)
  cargoQtyUpdates?: LighterTripCargoQtyUpdateDto[];
}
