import { coerceFiniteNumber } from "@/lib/laytime-hours-format";
import type { LaytimeBreakdown, MotherLaytimeContractSummary } from "@/lib/sof-api";

export type LaytimeSummaryFigures = {
  usedHours: number;
  allowedHours: number | null;
  minimumAllowedHours: number;
  graceHours: number;
  effectiveAllowedHours: number | null;
  demurrageTimeHours: number;
  demurrageDays: number;
  demurrageRatePerDay: number | null;
  demurrageDue: number | null;
  currency: string | null;
  usesReportAdjustments: boolean;
};

/** Laytime2000 report style: 37d02:10 */
export function formatDecimalHoursToLaytimeReport(value: number | null | undefined): string {
  const n = coerceFiniteNumber(value);
  if (n === null) return "—";
  const mins = Math.round(Math.max(0, n) * 60);
  const d = Math.floor(mins / (24 * 60));
  const r = mins % (24 * 60);
  const h = Math.floor(r / 60);
  const m = r % 60;
  return `${d}d${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Parse 12d19:30 or decimal hours. Empty → 0. Invalid → null. */
export function parseLaytimeReportDuration(input: string): number | null {
  const t = input.trim();
  if (!t) return 0;
  const compact = t.replace(/\s/g, "");
  const m = /^(\d+)d(\d{1,2}):(\d{2})$/i.exec(compact);
  if (m) {
    const d = parseInt(m[1]!, 10);
    const h = parseInt(m[2]!, 10);
    const min = parseInt(m[3]!, 10);
    if (h >= 24 || min >= 60) return null;
    return d * 24 + h + min / 60;
  }
  return coerceFiniteNumber(t);
}

export function formatLaytimeReportDurationForInput(
  hours: number | string | null | undefined
): string {
  const n = coerceFiniteNumber(hours);
  if (n === null || n <= 0) return "";
  return formatDecimalHoursToLaytimeReport(n);
}

export function computeLaytimeSummaryFigures(params: {
  breakdown: LaytimeBreakdown;
  contract: MotherLaytimeContractSummary;
  minimumAllowedHours?: number | string | null;
  graceHours?: number | string | null;
}): LaytimeSummaryFigures {
  const { breakdown, contract } = params;
  const minimumAllowedHours = Math.max(0, coerceFiniteNumber(params.minimumAllowedHours) ?? 0);
  const graceHours = Math.max(0, coerceFiniteNumber(params.graceHours) ?? 0);
  const usedHours = breakdown.usedHours;
  const allowedHours = breakdown.allowedHours;
  const usesReportAdjustments = minimumAllowedHours > 0 || graceHours > 0;

  const effectiveAllowedHours =
    allowedHours != null ? Math.max(allowedHours, minimumAllowedHours) : null;

  let demurrageTimeHours: number;
  if (effectiveAllowedHours != null) {
    demurrageTimeHours = Math.max(0, usedHours - effectiveAllowedHours - graceHours);
  } else {
    demurrageTimeHours = breakdown.demurrageHours;
  }

  if (!usesReportAdjustments && breakdown.demurrageHours > 0) {
    demurrageTimeHours = breakdown.demurrageHours;
  }

  const demurrageDays = demurrageTimeHours / 24;
  const demurrageRatePerDay = contract.laytimeDemurrageRatePerDay;
  const currency = breakdown.currency ?? contract.currency ?? null;
  const demurrageDue =
    demurrageRatePerDay != null && demurrageTimeHours > 1e-6
      ? demurrageDays * demurrageRatePerDay
      : demurrageTimeHours > 1e-6
        ? breakdown.demurrageAmount
        : null;

  return {
    usedHours,
    allowedHours,
    minimumAllowedHours,
    graceHours,
    effectiveAllowedHours,
    demurrageTimeHours,
    demurrageDays,
    demurrageRatePerDay,
    demurrageDue,
    currency,
    usesReportAdjustments
  };
}
