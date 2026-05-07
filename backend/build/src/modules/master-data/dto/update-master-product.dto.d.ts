import { ProductType } from "@prisma/client";
export declare class UpdateMasterProductDto {
    name?: string;
    type?: ProductType;
    specification?: string | null;
    hsCode?: string | null;
    defaultUom?: string | null;
    isActive?: boolean;
}
