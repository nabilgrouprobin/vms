import { LighterStatus, LighterTripStatus, Prisma } from "@prisma/client";
export declare function lighterTripStatusToAssignmentStatus(tripStatus: LighterTripStatus): LighterStatus | undefined;
export declare function buildLighterAssignmentSyncData(trip: {
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
}): Prisma.LighterAssignmentUpdateInput;
