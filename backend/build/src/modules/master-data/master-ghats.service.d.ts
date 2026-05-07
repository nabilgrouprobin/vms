import { PrismaService } from "../../prisma/prisma.service";
import { CreateMasterGhatDto } from "./dto/create-master-ghat.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterGhatDto } from "./dto/update-master-ghat.dto";
export declare class MasterGhatsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private parseLimit;
    private mapGhat;
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
    getById(id: string): Promise<{
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
    update(id: string, dto: UpdateMasterGhatDto): Promise<{
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
    softDelete(id: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
}
