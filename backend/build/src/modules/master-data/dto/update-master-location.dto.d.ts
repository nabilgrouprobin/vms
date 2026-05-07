import { LocationType } from "@prisma/client";
export declare class UpdateMasterLocationDto {
    name?: string;
    type?: LocationType;
    address?: string | null;
    district?: string | null;
    division?: string | null;
    country?: string | null;
    postalCode?: string | null;
    isActive?: boolean;
}
