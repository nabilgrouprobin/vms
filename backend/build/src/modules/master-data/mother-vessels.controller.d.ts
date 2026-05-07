import { CreateMasterVesselDto } from "./dto/create-master-vessel.dto";
import { ListMasterVesselsQueryDto } from "./dto/list-master-vessels.query.dto";
import { UpdateMasterVesselDto } from "./dto/update-master-vessel.dto";
import { MasterVesselsService } from "./master-vessels.service";
export declare class MotherVesselsController {
    private readonly masterVessels;
    constructor(masterVessels: MasterVesselsService);
    list(query: ListMasterVesselsQueryDto): Promise<{
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
    getOne(id: string): Promise<{
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
    create(dto: CreateMasterVesselDto): Promise<{
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
    patch(id: string, dto: UpdateMasterVesselDto): Promise<{
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
    remove(id: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
}
