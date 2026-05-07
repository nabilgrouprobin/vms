import type { Prisma } from "@prisma/client";
export declare const DEFAULT_LAYTIME_PORT_TZ = "Asia/Dhaka";
export type TripBoardSelect = {
    vesselCallId: string;
    status: string;
    assignedAt: Date;
    departedMvDate: Date | null;
    arrivedGhatDate: Date | null;
    unloadCompletedAt: Date | null;
    wayToGhatStartedAt: Date | null;
    loadingCompletedAt: Date | null;
    alongsideDate: Date | null;
    loadingStartedAt: Date | null;
    lighterAssignment: {
        assignedDate: Date;
        estimatedQtyMt: Prisma.Decimal;
        actualDischargedQtyMt: Prisma.Decimal | null;
    } | null;
    cargoes: Array<{
        dischargedQtyTon: Prisma.Decimal | null;
        loadedQtyTon: Prisma.Decimal | null;
        estimatedQtyTon: Prisma.Decimal | null;
    }>;
};
export declare function unloadQtyMt(t: TripBoardSelect): number | null;
export declare function balanceQtyMt(t: TripBoardSelect): number | null;
export declare function loadedQtyMt(t: TripBoardSelect): number | null;
export declare function isEngagedTrip(status: string): boolean;
export declare function isReleasedTrip(status: string): boolean;
export type ExclusivePipeline = "toMv" | "alongside" | "loading" | "loadDone" | "voyageGhat" | "ghatStanding" | "ghatDischarging";
export declare function exclusivePipelineBucket(t: TripBoardSelect): ExclusivePipeline | null;
export declare function ymdInTimeZone(instant: Date, timeZone: string): string;
export declare function resolvePortTimeZone(laytimeTimeZone: string | null | undefined): string;
export declare function addCalendarDaysToYmd(ymd: string, deltaDays: number): string;
export declare function zonedDayStartEndUtc(ymd: string, laytimeTimeZone: string | null | undefined): {
    start: Date;
    end: Date;
};
export declare function portYesterdayRange(now: Date, laytimeTimeZone: string | null | undefined): {
    start: Date;
    end: Date;
};
export declare function portLastFiveCalendarDaysRange(now: Date, laytimeTimeZone: string | null | undefined): {
    start: Date;
    end: Date;
};
export declare function allocationInstant(t: TripBoardSelect): Date;
export declare function isLastNightPortAllocation(t: TripBoardSelect, range: {
    start: Date;
    end: Date;
}): boolean;
export declare function remVoyageMt(t: TripBoardSelect): number | null;
export declare function remAtGhatMt(t: TripBoardSelect): number | null;
export type BoardPipelineCounts = Record<ExclusivePipeline, number>;
export type VesselCallBoardMetrics = {
    totalTrips: number;
    totalAssignments: number;
    lastNightAllocated: number;
    released: number;
    engaged: number;
    pipeline: BoardPipelineCounts;
    remVoyageMt: number | null;
    remGhatMt: number | null;
    dischargedFromLvMt: number | null;
    lighterDischargeLast5DayAvgMt: number | null;
};
export declare function aggregateBoardMetrics(trips: TripBoardSelect[], totalAssignments: number, now: Date, laytimeTimeZone: string | null | undefined): VesselCallBoardMetrics;
