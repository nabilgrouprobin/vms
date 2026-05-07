import { LighterTripStatus } from "@prisma/client";

/** Partial cargo line updates (MT); only send fields you want to change. */
export class LighterTripCargoQtyUpdateDto {
  id!: string;
  estimatedQtyTon?: string | null;
  loadedQtyTon?: string | null;
  dischargedQtyTon?: string | null;
}

export class UpdateLighterTripDto {
  remarks?: string | null;
  status?: LighterTripStatus;
  /** Operational hold / delay reason (e.g. loading stopped). Cleared when omitted and you PATCH null explicitly. */
  holdReason?: string | null;
  /** When false, skips mirroring milestones/status to the linked lighter assignment. Default: sync. */
  syncLighterAssignment?: boolean;
  /** Mother vessel call (only when the trip has no linked lighter assignment). */
  vesselCallId?: string;
  /** Lighter hull (`Vessel` with `isLighter`); only when the trip has no linked lighter assignment. */
  lighterVesselId?: string;
  /** Sets linked assignment `carrierConfirmedDate` (carrier accepted the allocation). */
  carrierConfirmedAt?: string | null;
  /** Surveyor-reported loaded quantity on the linked assignment (MT). */
  assignmentSurveyorLoadedQtyMt?: string | null;
  /** Actual discharged quantity at ghat on the linked assignment (MT). */
  assignmentActualDischargedQtyMt?: string | null;
  /** Log text on the trip event row when `status` changes (default: generic message). */
  statusChangeRemarks?: string | null;
  laytimeCommenceAt?: string | null;
  wayToMVReadyAt?: string | null;
  wayToMVStartedAt?: string | null;
  wayToMVCompletedAt?: string | null;
  alongsideDate?: string | null;
  loadingStartedAt?: string | null;
  loadingCompletedAt?: string | null;
  departedMvDate?: string | null;
  wayToGhatStartedAt?: string | null;
  wayToGhatCompletedAt?: string | null;
  arrivedGhatDate?: string | null;
  unloadStartedAt?: string | null;
  unloadCompletedAt?: string | null;
  cargoQtyUpdates?: LighterTripCargoQtyUpdateDto[];
}
