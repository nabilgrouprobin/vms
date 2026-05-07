import { MotherVesselStatus } from "@prisma/client";
export declare class ListVesselCallsQueryDto {
    cursor?: string;
    limit?: string;
    status?: MotherVesselStatus;
    search?: string;
    motherVesselOnly?: string;
}
