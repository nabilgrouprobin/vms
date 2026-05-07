import { Prisma, SOFStatus } from "@prisma/client";
export declare function parseLimit(value: string | undefined, defaultValue: number): number;
export declare function parseRequiredDate(value: string, fieldName: string): Date;
export declare function parseOptionalDate(value: string | null | undefined, fieldName: string): Date | null | undefined;
export type SofTimelineValidationRow = {
    id: string;
    eventTime: Date;
    durationHours: Prisma.Decimal | null | undefined;
    durationMinutes?: number | null;
};
export declare function sofEventDurationSpanMs(row: SofTimelineValidationRow): number | null;
export declare function validateSofEventTimelineNoGaps(rows: SofTimelineValidationRow[]): void;
export declare function validateSofStatusTransition(currentStatus: SOFStatus, nextStatus: SOFStatus): void;
