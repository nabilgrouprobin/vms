import type { LaytimeSegment } from "./laytime-event-accumulation";
export declare const DEFAULT_LAYTIME_ZONE = "Asia/Dhaka";
export declare function parseExcludedWeekdays(days: string[] | null | undefined): Set<number>;
export declare function resolveLaytimeZone(zone: string | null | undefined): string;
export declare function countableHoursOutsideExcludedWeekdays(from: Date, to: Date, excluded: Set<number>, zone: string): number;
type LaytimeImpactCarrier = {
    laytimeImpactHours: {
        toString(): string;
    } | null;
};
export declare function applyImportContractCalendarToMotherSegments(rawSegments: LaytimeSegment[], eventsById: Map<string, LaytimeImpactCarrier>, contractExcludedDays: string[] | null | undefined, vesselLaytimeTimeZone: string | null | undefined): {
    segments: LaytimeSegment[];
    used: number;
    excluded: number;
};
export {};
