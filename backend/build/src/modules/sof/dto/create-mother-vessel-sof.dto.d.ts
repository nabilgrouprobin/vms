import { SOFStatus } from "@prisma/client";
export declare class CreateMotherVesselSofDto {
    sofNo?: string;
    vesselCallId: string;
    startedAt?: string;
    completedAt?: string;
    status?: SOFStatus;
    laytimeAllowedHours?: string | number;
    laytimeUsedHours?: string | number;
    laytimeExcludedHours?: string | number;
    laytimeBalanceHours?: string | number;
    demurrageAmount?: string | number;
    dispatchAmount?: string | number;
    netAmount?: string | number;
    verifiedBy?: string;
    verifiedAt?: string;
    approvedBy?: string;
    approvedAt?: string;
    remarks?: string;
}
