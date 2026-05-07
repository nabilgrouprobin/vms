import { PrismaService } from "../../prisma/prisma.service";
import { CreateMasterOrganizationTypeDto } from "./dto/create-master-organization-type.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterOrganizationTypeDto } from "./dto/update-master-organization-type.dto";
export declare class MasterOrganizationTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private parseLimit;
    listOptions(): Promise<{
        id: string;
        name: string;
        code: string;
    }[]>;
    list(query: ListMasterReferenceQueryDto): Promise<{
        data: {
            id: string;
            isActive: boolean;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            _count: {
                organizations: number;
            };
            name: string;
            code: string;
        }[];
        nextCursor: string | null;
        limit: number;
    }>;
    getById(id: string): Promise<{
        id: string;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            organizations: number;
        };
        name: string;
        code: string;
    } | null>;
    create(dto: CreateMasterOrganizationTypeDto): Promise<{
        id: string;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            organizations: number;
        };
        name: string;
        code: string;
    }>;
    update(id: string, dto: UpdateMasterOrganizationTypeDto): Promise<{
        id: string;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            organizations: number;
        };
        name: string;
        code: string;
    }>;
    softDelete(id: string): Promise<{
        id: string;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            organizations: number;
        };
        name: string;
        code: string;
    }>;
}
