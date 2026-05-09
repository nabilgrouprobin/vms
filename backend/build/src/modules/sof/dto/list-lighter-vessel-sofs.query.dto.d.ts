import { SOFStatus } from "@prisma/client";
export declare class ListLighterVesselSofsQueryDto {
    cursor?: string;
    limit?: string;
    status?: SOFStatus;
    lighterTripId?: string;
    vesselCallId?: string;
    lighterVesselId?: string;
    search?: string;
}
