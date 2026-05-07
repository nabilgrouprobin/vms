import { CreateMasterSofEventTypeDto } from "./dto/create-master-sof-event-type.dto";
import { ListMasterSofEventTypesMasterQueryDto } from "./dto/list-master-sof-event-types-master.query.dto";
import { ListSofEventTypesQueryDto } from "./dto/list-sof-event-types.query.dto";
import { UpdateMasterSofEventTypeDto } from "./dto/update-master-sof-event-type.dto";
import { MasterSofEventTypesService } from "./master-sof-event-types.service";
export declare class MasterSofEventTypesController {
    private readonly types;
    constructor(types: MasterSofEventTypesService);
    listOptions(query: ListSofEventTypesQueryDto): Promise<{
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
    getOne(id: string): Promise<{
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
    patch(id: string, dto: UpdateMasterSofEventTypeDto): Promise<{
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
    remove(id: string): Promise<{
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
