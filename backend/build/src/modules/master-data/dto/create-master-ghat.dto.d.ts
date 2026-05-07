export declare class CreateMasterGhatDto {
    name: string;
    locationId: string;
    numberOfJetties?: number;
    hasWarehouseStorage?: boolean;
    hasTruckScale?: boolean;
    workingStartHour?: string | null;
    workingEndHour?: string | null;
    contactPerson?: string | null;
    contactNo?: string | null;
    unloadingCapacityMtPerDay?: number | null;
    warehouseCapacityMt?: number | null;
}
