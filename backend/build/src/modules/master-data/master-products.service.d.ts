import { PrismaService } from "../../prisma/prisma.service";
import { CreateMasterProductDto } from "./dto/create-master-product.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterProductDto } from "./dto/update-master-product.dto";
export declare class MasterProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private parseLimit;
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
    getById(id: string): Promise<{
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
    update(id: string, dto: UpdateMasterProductDto): Promise<{
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
    softDelete(id: string): Promise<{
        id: string;
        isActive: boolean;
    }>;
}
