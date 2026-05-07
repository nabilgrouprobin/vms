import type { Request } from "express";
import type { AuthedRequestUser } from "../../auth/strategies/jwt.strategy";
import { BatchUserRoleAssignmentsDto } from "./dto/batch-user-role-assignments.dto";
import { CreateMasterUserDto } from "./dto/create-master-user.dto";
import { CreateUserRoleAssignmentDto } from "./dto/create-user-role-assignment.dto";
import { ListMasterUsersQueryDto } from "./dto/list-master-users.query.dto";
import { UpdateMasterUserDto } from "./dto/update-master-user.dto";
import { MasterUsersService } from "./master-users.service";
type AuthedRequest = Request & {
    user?: AuthedRequestUser;
};
export declare class MasterUsersController {
    private readonly users;
    constructor(users: MasterUsersService);
    list(query: ListMasterUsersQueryDto): Promise<{
        data: {
            fullName: string;
            phone: string;
            id: string;
            email: string | null;
            isActive: boolean;
            lastLoginAt: Date | null;
            organizationId: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            _count: {
                roles: number;
            };
        }[];
        nextCursor: string | null;
        limit: number;
    }>;
    listRoles(id: string): Promise<{
        location: {
            id: string;
            name: string;
            code: string;
            type: import(".prisma/client").$Enums.LocationType;
        } | null;
        id: string;
        role: import(".prisma/client").$Enums.AppRole;
        locationId: string | null;
        grantedBy: string | null;
        grantedAt: Date;
        expiresAt: Date | null;
    }[]>;
    getOne(id: string): Promise<{
        fullName: string;
        phone: string;
        id: string;
        email: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        organizationId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            roles: number;
        };
    }>;
    create(dto: CreateMasterUserDto): Promise<{
        fullName: string;
        phone: string;
        id: string;
        email: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        organizationId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            roles: number;
        };
    }>;
    patch(id: string, dto: UpdateMasterUserDto): Promise<{
        fullName: string;
        phone: string;
        id: string;
        email: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        organizationId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            roles: number;
        };
    }>;
    remove(id: string): Promise<{
        fullName: string;
        phone: string;
        id: string;
        email: string | null;
        isActive: boolean;
        lastLoginAt: Date | null;
        organizationId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            roles: number;
        };
    }>;
    addRolesBatch(id: string, dto: BatchUserRoleAssignmentsDto, req: AuthedRequest): Promise<{
        location: {
            id: string;
            name: string;
            code: string;
            type: import(".prisma/client").$Enums.LocationType;
        } | null;
        id: string;
        role: import(".prisma/client").$Enums.AppRole;
        locationId: string | null;
        grantedBy: string | null;
        grantedAt: Date;
        expiresAt: Date | null;
    }[]>;
    addRole(id: string, dto: CreateUserRoleAssignmentDto, req: AuthedRequest): Promise<{
        location: {
            id: string;
            name: string;
            code: string;
            type: import(".prisma/client").$Enums.LocationType;
        } | null;
        id: string;
        role: import(".prisma/client").$Enums.AppRole;
        locationId: string | null;
        grantedBy: string | null;
        grantedAt: Date;
        expiresAt: Date | null;
    }>;
    removeRole(id: string, assignmentId: string): Promise<{
        ok: true;
    }>;
}
export {};
