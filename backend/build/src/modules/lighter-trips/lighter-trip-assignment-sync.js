"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lighterTripStatusToAssignmentStatus = lighterTripStatusToAssignmentStatus;
exports.buildLighterAssignmentSyncData = buildLighterAssignmentSyncData;
const client_1 = require("@prisma/client");
function lighterTripStatusToAssignmentStatus(tripStatus) {
    const m = {
        PLANNED: client_1.LighterStatus.ASSIGNED,
        ASSIGNED: client_1.LighterStatus.ASSIGNED,
        NOT_READY: client_1.LighterStatus.ASSIGNED,
        READY_TO_SAIL: client_1.LighterStatus.READY_FOR_DEPARTURE,
        OUTBOUND_AT_SEA: client_1.LighterStatus.EN_ROUTE_TO_MV,
        AT_CHECKPOINT: client_1.LighterStatus.EN_ROUTE_TO_MV,
        ALONGSIDE: client_1.LighterStatus.ALONGSIDE_MV,
        PREPARING_TO_LOAD: client_1.LighterStatus.WAITING_ALONGSIDE,
        LOADING: client_1.LighterStatus.LOADING,
        LOADED: client_1.LighterStatus.LOADING_COMPLETE,
        DRAFT_SURVEY_STAGING: client_1.LighterStatus.LOADING_COMPLETE,
        DRAFT_SURVEY_IN_PROGRESS: client_1.LighterStatus.LOADING_COMPLETE,
        DRAFT_SURVEY_COMPLETED: client_1.LighterStatus.RETURNING_TO_GHAT,
        RETURNING_AT_SEA: client_1.LighterStatus.RETURNING_TO_GHAT,
        ARRIVED_GHAT: client_1.LighterStatus.WAITING_AT_GHAT,
        WAITING_UNLOAD: client_1.LighterStatus.WAITING_AT_GHAT,
        UNLOADING: client_1.LighterStatus.UNLOADING_AT_GHAT,
        PARTIAL_UNLOADED: client_1.LighterStatus.UNLOADING_AT_GHAT,
        UNLOADED: client_1.LighterStatus.UNLOADING_COMPLETE,
        CLOSED: client_1.LighterStatus.COMPLETED,
        ON_HOLD: client_1.LighterStatus.ON_HOLD,
        CANCELLED: client_1.LighterStatus.ON_HOLD
    };
    return m[tripStatus];
}
function buildLighterAssignmentSyncData(trip) {
    const nextStatus = lighterTripStatusToAssignmentStatus(trip.status);
    const data = {
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
//# sourceMappingURL=lighter-trip-assignment-sync.js.map