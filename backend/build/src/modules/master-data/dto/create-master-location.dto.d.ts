import { LocationType } from "@prisma/client";
export declare class CreateMasterLocationDto {
    name: string;
    type: LocationType;
    address?: string | null;
    district?: string | null;
    division?: string | null;
    country?: string;
    postalCode?: string | null;
}
