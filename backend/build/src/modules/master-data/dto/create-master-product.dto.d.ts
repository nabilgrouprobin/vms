import { ProductType } from "@prisma/client";
export declare class CreateMasterProductDto {
    name: string;
    type: ProductType;
    specification?: string | null;
    hsCode?: string | null;
    defaultUom?: string;
}
