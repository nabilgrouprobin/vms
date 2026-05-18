import { describe, expect, it } from "vitest";

import {
  computeLaytimeSummaryFigures,
  formatDecimalHoursToLaytimeReport,
  parseLaytimeReportDuration
} from "./laytime-summary-calc";
import type { LaytimeBreakdown, MotherLaytimeContractSummary } from "./sof-api";

const breakdown: LaytimeBreakdown = {
  commenceAt: "2025-01-01T00:00:00.000Z",
  allowedHours: 12 + 19 / 60 + 30 / 3600,
  allowedSource: "test",
  usedHours: 37 + 2 / 60 + 10 / 3600,
  excludedHours: 0,
  balanceHours: -24,
  demurrageHours: 24 + 6 / 60 + 40 / 3600,
  dispatchHours: 0,
  demurrageAmount: 485555.56,
  dispatchAmount: null,
  netAmount: 485555.56,
  currency: "USD"
};

const contract: MotherLaytimeContractSummary = {
  cargoQtyMt: 64061,
  dischargeRateMtPerDay: 5000,
  allowedHours: breakdown.allowedHours,
  allowedSource: "test",
  laytimeDemurrageRatePerDay: 20000,
  laytimeDispatchRatePerDay: null,
  currency: "USD",
  excludedDays: [],
  holidaysExcluded: null,
  laytimeTimeZoneRaw: null,
  laytimeResolvedTimeZone: "UTC",
  dischargeRateUnit: null
};

describe("laytime-summary-calc", () => {
  it("formats report duration", () => {
    const h37d02m10 = 37 * 24 + 2 + 10 / 60;
    expect(formatDecimalHoursToLaytimeReport(h37d02m10)).toBe("37d02:10");
    expect(formatDecimalHoursToLaytimeReport(0)).toBe("0d00:00");
  });

  it("parses report duration", () => {
    expect(parseLaytimeReportDuration("12d19:30")).toBeCloseTo(12 * 24 + 19.5, 5);
    expect(parseLaytimeReportDuration("")).toBe(0);
  });

  it("applies minimum and grace to demurrage time", () => {
    const fig = computeLaytimeSummaryFigures({
      breakdown,
      contract,
      minimumAllowedHours: 0,
      graceHours: 2
    });
    expect(fig.demurrageTimeHours).toBeCloseTo(breakdown.usedHours - (breakdown.allowedHours ?? 0) - 2, 4);
    expect(fig.demurrageDue).toBeCloseTo((fig.demurrageTimeHours / 24) * 20000, 0);
  });
});
