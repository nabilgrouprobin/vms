import { DateTime } from "luxon";
import type { LaytimeSegment } from "./laytime-event-accumulation";
declare const DAY_ORDER: readonly ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
export type WeekdayName = (typeof DAY_ORDER)[number];
export type ContractWeekWindow = {
    startJsDow: number;
    startHm: string;
    endJsDow: number;
    endHm: string;
};
export declare function parseContractWeekWindow(excludedTimePeriod: string | null | undefined, excludedDays: string[] | null | undefined): ContractWeekWindow;
export declare function formatContractWeekWindowLabel(w: ContractWeekWindow): string;
export declare function contactHoursInRange(effStart: DateTime, effEnd: DateTime, anchor: DateTime, zone: string, w: ContractWeekWindow): number;
export type MotherLaytimeDailyLedgerRow = {
    date: string;
    weekday: string;
    contactHour: number;
    workingHour: number;
    idleHour: number;
    demurrageHour: number;
    dischargeQtyMt: number | null;
    activityDetails: string;
};
export type MotherLaytimeDailyLedger = {
    rows: MotherLaytimeDailyLedgerRow[];
    totalContactHour: number;
    totalWorkingHour: number;
    totalIdleHour: number;
    totalDemurrageHour: number;
    totalDischargeQtyMt: number;
};
export declare function buildMotherLaytimeDailyLedger(params: {
    commenceAt: Date;
    zone: string;
    week: ContractWeekWindow;
    freeTimeHours: number | null;
    segments: LaytimeSegment[];
    segmentCountingUsedHours: number[];
    dailyDischarges: Array<{
        reportDate: Date;
        quantity24hMt: unknown;
        remarks: string | null;
    }>;
    events: Array<{
        eventTime: Date;
        remarks: string | null;
        eventType: string;
    }>;
}): MotherLaytimeDailyLedger;
export {};
