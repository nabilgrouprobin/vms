import { CreateMasterProductDto } from "./dto/create-master-product.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterProductDto } from "./dto/update-master-product.dto";
import { MasterProductsService } from "./master-products.service";
export declare class MasterProductsController {
    private readonly products;
    constructor(products: MasterProductsService);
    list(query: ListMasterReferenceQueryDto): Promise<{
        data: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            code: string;
            type: import(".prisma/client").$Enums.ProductType;
            specification: string | null;
            defaultUom: string;
            hsCode: string | null;
        }[];
        nextCursor: string | null;
        limit: number;
    }>;
    getOne(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        type: import(".prisma/client").$Enums.ProductType;
        specification: string | null;
        defaultUom: string;
        hsCode: string | null;
    }>;
    create(dto: CreateMasterProductDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        type: import(".prisma/client").$Enums.ProductType;
        specification: string | null;
        defaultUom: string;
        hsCode: string | null;
    }>;
    patch(id: string, dto: UpdateMasterProductDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        type: import(".prisma/client").$Enums.ProductType;
        specification: string | null;
        defaultUom: string;
        hsCode: string | null;
    } | null>;
    remove(id: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
}
