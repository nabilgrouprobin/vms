import { SofEventTypeScope } from "@prisma/client";
import type { SofEventTypeCategoryDto } from "./create-master-sof-event-type.dto";
export declare class UpdateMasterSofEventTypeDto {
    name?: string;
    scope?: SofEventTypeScope;
    category?: SofEventTypeCategoryDto;
    isActive?: boolean;
}
