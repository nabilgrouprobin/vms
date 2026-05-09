import { SofEventTypeScope } from "@prisma/client";
export declare const SOF_EVENT_TYPE_CATEGORY: {
    readonly NORMAL: "NORMAL";
    readonly HOLD_DELAY: "HOLD_DELAY";
};
export type SofEventTypeCategoryDto = (typeof SOF_EVENT_TYPE_CATEGORY)[keyof typeof SOF_EVENT_TYPE_CATEGORY];
export declare class CreateMasterSofEventTypeDto {
    name: string;
    scope: SofEventTypeScope;
    category?: SofEventTypeCategoryDto;
}
