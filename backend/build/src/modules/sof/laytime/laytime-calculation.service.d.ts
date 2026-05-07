import { StatementOfFacts } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { type MotherLaytimeDailyLedger } from "./laytime-mother-daily-ledger";
export type LaytimeAllowedSource = "CONTRACT_DISCHARGE_RATE" | "STATEMENT_MANUAL" | "NONE";
export type LaytimeBreakdown = {
    commenceAt: string;
    allowedHours: number | null;
    allowedSource: LaytimeAllowedSource;
    usedHours: number;
    excludedHours: number;
    balanceHours: number;
    demurrageHours: number;
    dispatchHours: number;
    demurrageAmount: number | null;
    dispatchAmount: number | null;
    netAmount: number | null;
    currency: string | null;
};
export type MotherLaytimeContractSummary = {
    cargoQtyMt: number | null;
    dischargeRateMtPerDay: number | null;
    dischargeRateUnit: string | null;
    allowedHours: number | null;
    allowedSource: LaytimeAllowedSource;
    laytimeDemurrageRatePerDay: number | null;
    laytimeDispatchRatePerDay: number | null;
    currency: string | null;
    excludedDays: string[];
    holidaysExcluded: boolean | null;
    laytimeTimeZoneRaw: string | null;
    laytimeResolvedTimeZone: string;
    contractWeekLabel: string;
};
export type MotherLaytimeTimesheetRow = {
    closingEventId: string | null;
    eventType: string;
    periodFrom: string;
    periodTo: string;
    remark: string;
    elapsedWallHours: number;
    countingUsedHours: number;
    countingExcludedHours: number;
    accumulatedUsedHours: number;
};
export type MotherLaytimeTimesheet = {
    contractSummary: MotherLaytimeContractSummary;
    rows: MotherLaytimeTimesheetRow[];
};
export type MotherLaytimeRecalculateResult = {
    statement: StatementOfFacts;
    breakdown: LaytimeBreakdown;
    timesheet: MotherLaytimeTimesheet;
    dailyLedger: MotherLaytimeDailyLedger;
};
export declare class LaytimeCalculationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recalculateMotherStatement(statementId: string): Promise<MotherLaytimeRecalculateResult>;
    recalculateLighterStatement(statementId: string): Promise<MotherLaytimeRecalculateResult>;
}
