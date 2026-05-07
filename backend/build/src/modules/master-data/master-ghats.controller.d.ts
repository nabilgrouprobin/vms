import { CreateMasterGhatDto } from "./dto/create-master-ghat.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterGhatDto } from "./dto/update-master-ghat.dto";
import { MasterGhatsService } from "./master-ghats.service";
export declare class MasterGhatsController {
    private readonly ghats;
    constructor(ghats: MasterGhatsService);
    list(query: ListMasterReferenceQueryDto): Promise<{
        data: {
            unloadingCapacityMtPerDay: string | null;
            warehouseCapacityMt: string | null;
            location: {
                id: string;
                name: string;
                code: string;
                type: import(".prisma/client").$Enums.LocationType;
            };
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            locationId: string;
            code: string;
            contactPerson: string | null;
            contactNo: string | null;
            numberOfJetties: number;
            hasWarehouseStorage: boolean;
            hasTruckScale: boolean;
            workingStartHour: string | null;
            workingEndHour: string | null;
        }[];
        nextCursor: string | null;
        limit: number;
    }>;
    getOne(id: string): Promise<{
        unloadingCapacityMtPerDay: string | null;
        warehouseCapacityMt: string | null;
        location: {
            id: string;
            name: string;
            code: string;
            type: import(".prisma/client").$Enums.LocationType;
        };
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        locationId: string;
        code: string;
        contactPerson: string | null;
        contactNo: string | null;
        numberOfJetties: number;
        hasWarehouseStorage: boolean;
        hasTruckScale: boolean;
        workingStartHour: string | null;
        workingEndHour: string | null;
    }>;
    create(dto: CreateMasterGhatDto): Promise<{
        unloadingCapacityMtPerDay: string | null;
        warehouseCapacityMt: string | null;
        location: {
            id: string;
            name: string;
            code: string;
            type: import(".prisma/client").$Enums.LocationType;
        };
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        locationId: string;
        code: string;
        contactPerson: string | null;
        contactNo: string | null;
        numberOfJetties: number;
        hasWarehouseStorage: boolean;
        hasTruckScale: boolean;
        workingStartHour: string | null;
        workingEndHour: string | null;
    }>;
    patch(id: string, dto: UpdateMasterGhatDto): Promise<{
        unloadingCapacityMtPerDay: string | null;
        warehouseCapacityMt: string | null;
        location: {
            id: string;
            name: string;
            code: string;
            type: import(".prisma/client").$Enums.LocationType;
        };
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        locationId: string;
        code: string;
        contactPerson: string | null;
        contactNo: string | null;
        numberOfJetties: number;
        hasWarehouseStorage: boolean;
        hasTruckScale: boolean;
        workingStartHour: string | null;
        workingEndHour: string | null;
    } | null>;
    remove(id: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
}
