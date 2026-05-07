import { CreateMasterOrganizationTypeDto } from "./dto/create-master-organization-type.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterOrganizationTypeDto } from "./dto/update-master-organization-type.dto";
import { MasterOrganizationTypesService } from "./master-organization-types.service";
export declare class MasterOrganizationTypesController {
    private readonly types;
    constructor(types: MasterOrganizationTypesService);
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
    getOne(id: string): Promise<{
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
    patch(id: string, dto: UpdateMasterOrganizationTypeDto): Promise<{
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
    remove(id: string): Promise<{
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
