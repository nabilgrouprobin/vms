import { PrismaService } from "../../prisma/prisma.service";
import { CreateMasterLocationDto } from "./dto/create-master-location.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterLocationDto } from "./dto/update-master-location.dto";
export declare class MasterLocationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private parseLimit;
    listOptions(): Promise<{
        id: string;
        name: string;
        code: string;
        type: import(".prisma/client").$Enums.LocationType;
    }[]>;
    list(query: ListMasterReferenceQueryDto): Promise<{
        data: {
            id: string;
            isActive: boolean;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            address: string | null;
            type: import(".prisma/client").$Enums.LocationType;
            district: string | null;
            division: string | null;
            country: string;
            postalCode: string | null;
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
        name: string;
        code: string;
        address: string | null;
        type: import(".prisma/client").$Enums.LocationType;
        district: string | null;
        division: string | null;
        country: string;
        postalCode: string | null;
    } | null>;
    create(dto: CreateMasterLocationDto): Promise<{
        id: string;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        address: string | null;
        type: import(".prisma/client").$Enums.LocationType;
        district: string | null;
        division: string | null;
        country: string;
        postalCode: string | null;
    }>;
    update(id: string, dto: UpdateMasterLocationDto): Promise<{
        id: string;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        address: string | null;
        type: import(".prisma/client").$Enums.LocationType;
        district: string | null;
        division: string | null;
        country: string;
        postalCode: string | null;
    } | null>;
    softDelete(id: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
}
