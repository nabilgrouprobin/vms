import { PrismaService } from "../../prisma/prisma.service";
import { CreateMasterSofEventTypeDto } from "./dto/create-master-sof-event-type.dto";
import { ListMasterSofEventTypesMasterQueryDto } from "./dto/list-master-sof-event-types-master.query.dto";
import { UpdateMasterSofEventTypeDto } from "./dto/update-master-sof-event-type.dto";
export declare class MasterSofEventTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private parseLimit;
    listOptions(forSofScope: "MOTHER_VESSEL" | "LIGHTER_VESSEL"): Promise<{
        id: string;
        name: string;
        scope: import(".prisma/client").$Enums.SofEventTypeScope;
        code: string;
    }[]>;
    list(query: ListMasterSofEventTypesMasterQueryDto): Promise<{
        data: {
            id: string;
            isActive: boolean;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            _count: {
                sofEvents: number;
            };
            name: string;
            scope: import(".prisma/client").$Enums.SofEventTypeScope;
            code: string;
        }[];
        nextCursor: string | null;
        limit: number;
    }>;
    getById(id: string): Promise<{
        id: string;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            sofEvents: number;
        };
        name: string;
        scope: import(".prisma/client").$Enums.SofEventTypeScope;
        code: string;
    } | null>;
    create(dto: CreateMasterSofEventTypeDto): Promise<{
        id: string;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            sofEvents: number;
        };
        name: string;
        scope: import(".prisma/client").$Enums.SofEventTypeScope;
        code: string;
    }>;
    update(id: string, dto: UpdateMasterSofEventTypeDto): Promise<{
        id: string;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            sofEvents: number;
        };
        name: string;
        scope: import(".prisma/client").$Enums.SofEventTypeScope;
        code: string;
    }>;
    softDelete(id: string): Promise<{
        id: string;
        isActive: boolean;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        _count: {
            sofEvents: number;
        };
        name: string;
        scope: import(".prisma/client").$Enums.SofEventTypeScope;
        code: string;
    }>;
}
