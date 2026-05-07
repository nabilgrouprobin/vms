import { PrismaService } from "../../prisma/prisma.service";
import { BatchUserRoleAssignmentsDto } from "./dto/batch-user-role-assignments.dto";
import { CreateMasterUserDto } from "./dto/create-master-user.dto";
import { CreateUserRoleAssignmentDto } from "./dto/create-user-role-assignment.dto";
import { ListMasterUsersQueryDto } from "./dto/list-master-users.query.dto";
import { UpdateMasterUserDto } from "./dto/update-master-user.dto";
export declare class MasterUsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private parseLimit;
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
    getById(id: string, opts?: {
        includeDeleted?: boolean;
    }): Promise<{
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
    } | null>;
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
    update(id: string, dto: UpdateMasterUserDto): Promise<{
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
    softDelete(id: string): Promise<{
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
    listRoleAssignments(userId: string): Promise<{
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
    addRoleAssignmentsBatch(userId: string, dto: BatchUserRoleAssignmentsDto, grantedById: string): Promise<{
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
    addRoleAssignment(userId: string, dto: CreateUserRoleAssignmentDto, grantedById: string): Promise<{
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
    removeRoleAssignment(userId: string, assignmentId: string): Promise<{
        ok: true;
    }>;
    private ensureUserExists;
}
