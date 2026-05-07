import { PrismaService } from "../../prisma/prisma.service";
import { CreateMasterVesselDto } from "./dto/create-master-vessel.dto";
import { ListMasterVesselsQueryDto } from "./dto/list-master-vessels.query.dto";
import { UpdateMasterVesselDto } from "./dto/update-master-vessel.dto";
export type MasterVesselKind = "mother" | "lighter";
export declare class MasterVesselsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private parseLimit;
    private kindWhere;
    private mapVessel;
    list(kind: MasterVesselKind, query: ListMasterVesselsQueryDto): Promise<{
        data: {
            id: string;
            name: string;
            imoNo: string | null;
            flag: string | null;
            vesselType: string | null;
            yearBuilt: number | null;
            deadweightTon: string | null;
            maxDraftMeters: string | null;
            lengthOverallM: string | null;
            beamM: string | null;
            isActive: boolean;
            isMotherVessel: boolean;
            isLighter: boolean;
            createdAt: Date;
            updatedAt: Date;
            _count: {
                motherCalls: number;
            } | {
                lighterTrips: number;
            };
        }[];
        nextCursor: string | null;
        limit: number;
    }>;
    getById(kind: MasterVesselKind, id: string): Promise<{
        id: string;
        name: string;
        imoNo: string | null;
        flag: string | null;
        vesselType: string | null;
        yearBuilt: number | null;
        deadweightTon: string | null;
        maxDraftMeters: string | null;
        lengthOverallM: string | null;
        beamM: string | null;
        isActive: boolean;
        isMotherVessel: boolean;
        isLighter: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            motherCalls: number;
        } | {
            lighterTrips: number;
        };
    } | null>;
    create(kind: MasterVesselKind, dto: CreateMasterVesselDto): Promise<{
        id: string;
        name: string;
        imoNo: string | null;
        flag: string | null;
        vesselType: string | null;
        yearBuilt: number | null;
        deadweightTon: string | null;
        maxDraftMeters: string | null;
        lengthOverallM: string | null;
        beamM: string | null;
        isActive: boolean;
        isMotherVessel: boolean;
        isLighter: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            motherCalls: number;
        } | {
            lighterTrips: number;
        };
    }>;
    update(kind: MasterVesselKind, id: string, dto: UpdateMasterVesselDto): Promise<{
        id: string;
        name: string;
        imoNo: string | null;
        flag: string | null;
        vesselType: string | null;
        yearBuilt: number | null;
        deadweightTon: string | null;
        maxDraftMeters: string | null;
        lengthOverallM: string | null;
        beamM: string | null;
        isActive: boolean;
        isMotherVessel: boolean;
        isLighter: boolean;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            motherCalls: number;
        } | {
            lighterTrips: number;
        };
    } | null>;
    softDelete(kind: MasterVesselKind, id: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
}
