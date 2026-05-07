import { CreateMasterLocationDto } from "./dto/create-master-location.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterLocationDto } from "./dto/update-master-location.dto";
import { MasterLocationsService } from "./master-locations.service";
export declare class MasterLocationsController {
    private readonly locations;
    constructor(locations: MasterLocationsService);
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
    getOne(id: string): Promise<{
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
    patch(id: string, dto: UpdateMasterLocationDto): Promise<{
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
    remove(id: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
}
