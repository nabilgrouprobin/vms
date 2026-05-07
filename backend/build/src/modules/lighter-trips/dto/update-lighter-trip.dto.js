"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLighterTripDto = exports.LighterTripCargoQtyUpdateDto = void 0;
class LighterTripCargoQtyUpdateDto {
    id;
    estimatedQtyTon;
    loadedQtyTon;
    dischargedQtyTon;
}
exports.LighterTripCargoQtyUpdateDto = LighterTripCargoQtyUpdateDto;
class UpdateLighterTripDto {
    remarks;
    status;
    holdReason;
    syncLighterAssignment;
    vesselCallId;
    lighterVesselId;
    carrierConfirmedAt;
    assignmentSurveyorLoadedQtyMt;
    assignmentActualDischargedQtyMt;
    statusChangeRemarks;
    laytimeCommenceAt;
    wayToMVReadyAt;
    wayToMVStartedAt;
    wayToMVCompletedAt;
    alongsideDate;
    loadingStartedAt;
    loadingCompletedAt;
    departedMvDate;
    wayToGhatStartedAt;
    wayToGhatCompletedAt;
    arrivedGhatDate;
    unloadStartedAt;
    unloadCompletedAt;
    cargoQtyUpdates;
}
exports.UpdateLighterTripDto = UpdateLighterTripDto;
//# sourceMappingURL=update-lighter-trip.dto.js.map