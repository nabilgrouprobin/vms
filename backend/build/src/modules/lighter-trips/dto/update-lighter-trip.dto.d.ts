import { LighterTripStatus } from "@prisma/client";
export declare class LighterTripCargoQtyUpdateDto {
    id: string;
    estimatedQtyTon?: string | null;
    loadedQtyTon?: string | null;
    dischargedQtyTon?: string | null;
}
export declare class UpdateLighterTripDto {
    remarks?: string | null;
    status?: LighterTripStatus;
    holdReason?: string | null;
    syncLighterAssignment?: boolean;
    vesselCallId?: string;
    lighterVesselId?: string;
    carrierConfirmedAt?: string | null;
    assignmentSurveyorLoadedQtyMt?: string | null;
    assignmentActualDischargedQtyMt?: string | null;
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
