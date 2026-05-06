import { LighterStatus, LighterTripStatus, Prisma } from "@prisma/client";

/** Maps operational trip status to carrier-assignment lifecycle status. */
export function lighterTripStatusToAssignmentStatus(
  tripStatus: LighterTripStatus
): LighterStatus | undefined {
  const m: Partial<Record<LighterTripStatus, LighterStatus>> = {
    PLANNED: LighterStatus.ASSIGNED,
    ASSIGNED: LighterStatus.ASSIGNED,
    NOT_READY: LighterStatus.ASSIGNED,
    READY_TO_SAIL: LighterStatus.READY_FOR_DEPARTURE,
    OUTBOUND_AT_SEA: LighterStatus.EN_ROUTE_TO_MV,
    AT_CHECKPOINT: LighterStatus.EN_ROUTE_TO_MV,
    ALONGSIDE: LighterStatus.ALONGSIDE_MV,
    PREPARING_TO_LOAD: LighterStatus.WAITING_ALONGSIDE,
    LOADING: LighterStatus.LOADING,
    LOADED: LighterStatus.LOADING_COMPLETE,
    DRAFT_SURVEY_STAGING: LighterStatus.LOADING_COMPLETE,
    DRAFT_SURVEY_IN_PROGRESS: LighterStatus.LOADING_COMPLETE,
    DRAFT_SURVEY_COMPLETED: LighterStatus.RETURNING_TO_GHAT,
    RETURNING_AT_SEA: LighterStatus.RETURNING_TO_GHAT,
    ARRIVED_GHAT: LighterStatus.WAITING_AT_GHAT,
    WAITING_UNLOAD: LighterStatus.WAITING_AT_GHAT,
    UNLOADING: LighterStatus.UNLOADING_AT_GHAT,
    PARTIAL_UNLOADED: LighterStatus.UNLOADING_AT_GHAT,
    UNLOADED: LighterStatus.UNLOADING_COMPLETE,
    CLOSED: LighterStatus.COMPLETED,
    ON_HOLD: LighterStatus.ON_HOLD,
    CANCELLED: LighterStatus.ON_HOLD
  };
  return m[tripStatus];
}

/** Keeps assignment milestones aligned with the trip (single ops surface). */
export function buildLighterAssignmentSyncData(trip: {
  status: LighterTripStatus;
  wayToMVReadyAt: Date | null;
  wayToMVStartedAt: Date | null;
  wayToMVCompletedAt: Date | null;
  alongsideDate: Date | null;
  loadingStartedAt: Date | null;
  loadingCompletedAt: Date | null;
  departedMvDate: Date | null;
  arrivedGhatDate: Date | null;
  unloadStartedAt: Date | null;
  unloadCompletedAt: Date | null;
}): Prisma.LighterAssignmentUpdateInput {
  const nextStatus = lighterTripStatusToAssignmentStatus(trip.status);
  const data: Prisma.LighterAssignmentUpdateInput = {
    readyDate: trip.wayToMVReadyAt,
    departedDate: trip.wayToMVStartedAt,
    arrivedMvDate: trip.wayToMVCompletedAt,
    alongsideDate: trip.alongsideDate,
    loadingStartDate: trip.loadingStartedAt,
    loadingCompleteDate: trip.loadingCompletedAt,
    departedMvDate: trip.departedMvDate,
    arrivedGhatDate: trip.arrivedGhatDate,
    unloadingStartDate: trip.unloadStartedAt,
    unloadingCompleteDate: trip.unloadCompletedAt
  };
  if (nextStatus !== undefined) {
    data.status = nextStatus;
  }
  return data;
}
