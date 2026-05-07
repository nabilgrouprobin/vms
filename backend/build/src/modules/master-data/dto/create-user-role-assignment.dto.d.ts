import { AppRole } from "@prisma/client";
export declare class CreateUserRoleAssignmentDto {
    role: AppRole;
    locationId?: string | null;
}
