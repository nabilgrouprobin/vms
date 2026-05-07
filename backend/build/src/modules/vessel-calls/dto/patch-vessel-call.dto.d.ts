import { MotherVesselStatus } from "@prisma/client";
export declare class PatchVesselCallDto {
    laytimeTimeZone?: string | null;
    importContractId?: string | null;
    approxTotalWeightTon?: number | null;
    status?: MotherVesselStatus;
}
