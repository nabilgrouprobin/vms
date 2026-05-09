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
export declare function effectiveSofPeriodBoundsMs(row: SofTimelineValidationRow, previousRowEndMs: number | null): {
    startMs: number;
    endMs: number;
} | null;
export type SofSplitHostMatch = {
    hostId: string;
    hostStartMs: number;
    hostEndMs: number;
};
export declare function findTimelineSplitHost(timelineAsc: SofTimelineValidationRow[], newStartMs: number, newEndMs: number): SofSplitHostMatch | null;
export declare function validateSofEventTimelineNoOverlap(rows: SofTimelineValidationRow[]): void;
export declare const validateSofEventTimelineNoGaps: typeof validateSofEventTimelineNoOverlap;
export declare function validateSofStatusTransition(currentStatus: SOFStatus, nextStatus: SOFStatus): void;
