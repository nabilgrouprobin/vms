import { AppRole } from "@prisma/client";
export declare class BatchUserRoleAssignmentsDto {
    roles: AppRole[];
    locationId?: string | null;
}
