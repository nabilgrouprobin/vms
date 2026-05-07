export class CreateLighterTripDto {
  /** Carrier allocation to attach this trip to (must not already have a trip). */
  lighterAssignmentId!: string;
  /** Physical lighter hull (`Vessel` with `isLighter`). */
  lighterVesselId!: string;
  remarks?: string | null;
}
