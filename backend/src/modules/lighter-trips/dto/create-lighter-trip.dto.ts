import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateLighterTripDto {
  /** Optional carrier allocation to attach this trip to (must not already have a trip). */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  lighterAssignmentId?: string;

  /** Mother vessel call used when allocation is auto-selected. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  vesselCallId?: string;

  /** Physical lighter hull (`Vessel` with `isLighter`). */
  @IsString()
  @MaxLength(40)
  lighterVesselId!: string;

  /** Optional lighter-hull port visit (`VesselCall` id); must belong to `lighterVesselId`. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  lighterPortCallId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string | null;
}
