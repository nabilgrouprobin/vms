import { LighterTripStatus } from "@prisma/client";
export declare class ListLighterTripsQueryDto {
    cursor?: string;
    limit?: string;
    search?: string;
    vesselCallId?: string;
    lighterVesselId?: string;
    status?: LighterTripStatus;
    report?: "ghat-aging";
}
