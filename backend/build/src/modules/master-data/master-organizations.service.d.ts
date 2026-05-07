import { PrismaService } from "../../prisma/prisma.service";
import { CreateMasterOrganizationDto } from "./dto/create-master-organization.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterOrganizationDto } from "./dto/update-master-organization.dto";
export declare class MasterOrganizationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private requireAssignableOrganizationType;
    private parseLimit;
    listOptions(): Promise<{
        id: string;
        code: string;
        name: string;
        type: string;
    }[]>;
    list(query: ListMasterReferenceQueryDto): Promise<{
        data: {
            id: string;
            email: string | null;
            isActive: boolean;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            _count: {
                users: number;
            };
            name: string;
            code: string;
            address: string | null;
            contactPerson: string | null;
            contactNo: string | null;
            organizationType: {
                id: string;
                name: string;
                code: string;
            };
        }[];
        nextCursor: string | null;
        limit: number;
    }>;
    getById(id: string): Promise<{
        id: string;
        email: string | null;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            users: number;
        };
        name: string;
        code: string;
        address: string | null;
        contactPerson: string | null;
        contactNo: string | null;
        organizationType: {
            id: string;
            name: string;
            code: string;
        };
    } | null>;
    create(dto: CreateMasterOrganizationDto): Promise<{
        id: string;
        email: string | null;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            users: number;
        };
        name: string;
        code: string;
        address: string | null;
        contactPerson: string | null;
        contactNo: string | null;
        organizationType: {
            id: string;
            name: string;
            code: string;
        };
    }>;
    update(id: string, dto: UpdateMasterOrganizationDto): Promise<{
        id: string;
        email: string | null;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            users: number;
        };
        name: string;
        code: string;
        address: string | null;
        contactPerson: string | null;
        contactNo: string | null;
        organizationType: {
            id: string;
            name: string;
            code: string;
        };
    }>;
    softDelete(id: string): Promise<{
        id: string;
        email: string | null;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            users: number;
        };
        name: string;
        code: string;
        address: string | null;
        contactPerson: string | null;
        contactNo: string | null;
        organizationType: {
            id: string;
            name: string;
            code: string;
        };
    }>;
}
