import { CreateMasterOrganizationDto } from "./dto/create-master-organization.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterOrganizationDto } from "./dto/update-master-organization.dto";
import { MasterOrganizationsService } from "./master-organizations.service";
export declare class MasterOrganizationsController {
    private readonly organizations;
    constructor(organizations: MasterOrganizationsService);
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
    getOne(id: string): Promise<{
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
    patch(id: string, dto: UpdateMasterOrganizationDto): Promise<{
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
    remove(id: string): Promise<{
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
