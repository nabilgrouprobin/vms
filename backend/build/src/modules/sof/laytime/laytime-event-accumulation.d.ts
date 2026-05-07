export declare function hoursBetweenNonNegative(a: Date, b: Date): number;
export type LaytimeAccumEvent = {
    eventTime: Date;
    countsAsLaytime: boolean;
    laytimeImpactHours: number | null;
    closingEventId?: string | null;
};
export type LaytimeSegment = {
    periodFrom: Date;
    periodTo: Date;
    elapsedWallHours: number;
    countingHours: number;
    countsAsLaytime: boolean;
    closingEventId: string | null;
    accumulatedUsedHours: number;
};
export declare function accumulateLaytimeSegmentsFromEvents(events: LaytimeAccumEvent[], commenceAt: Date): {
    segments: LaytimeSegment[];
    used: number;
    excluded: number;
};
export declare function accumulateLaytimeFromEvents(events: LaytimeAccumEvent[], commenceAt: Date): {
    used: number;
    excluded: number;
};
