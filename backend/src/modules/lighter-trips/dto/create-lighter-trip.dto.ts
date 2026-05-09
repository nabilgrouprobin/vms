export class CreateLighterTripDto {
  /** Optional carrier allocation to attach this trip to (must not already have a trip). */
  lighterAssignmentId?: string;
  /** Mother vessel call used when allocation is auto-selected. */
  vesselCallId?: string;
  /** Physical lighter hull (`Vessel` with `isLighter`). */
  lighterVesselId!: string;
  remarks?: string | null;
}
