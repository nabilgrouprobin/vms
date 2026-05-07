import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SOFScope, SOFStatus, StatementOfFacts } from "@prisma/client";

import { PrismaService } from "../../../prisma/prisma.service";
import {
  applyImportContractCalendarToMotherSegments,
  parseExcludedWeekdays,
  resolveLaytimeZone
} from "./laytime-calendar-count";
import { accumulateLaytimeSegmentsFromEvents } from "./laytime-event-accumulation";
import {
  buildMotherLaytimeDailyLedger,
  formatContractWeekWindowLabel,
  parseContractWeekWindow,
  type MotherLaytimeDailyLedger
} from "./laytime-mother-daily-ledger";

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
  /** Contract working-week window used for “contact” hours in the daily sheet */
  contractWeekLabel: string;
};

export type MotherLaytimeTimesheetRow = {
  closingEventId: string | null;
  eventType: string;
  periodFrom: string;
  periodTo: string;
  remark: string;
  elapsedWallHours: number;
  /** Hours credited toward used laytime for this segment (0 when excluded) */
  countingUsedHours: number;
  /** Hours credited toward excluded time for this segment (0 when used) */
  countingExcludedHours: number;
  accumulatedUsedHours: number;
};

export type MotherLaytimeTimesheet = {
  contractSummary: MotherLaytimeContractSummary;
  rows: MotherLaytimeTimesheetRow[];
};

function buildSofEventRemark(ev: {
  eventTypeDefinition: { name: string } | null;
  remarks: string | null;
  isHold: boolean;
  holdReason: string | null;
}): string {
  const parts: string[] = [ev.eventTypeDefinition?.name?.trim() || "Event"];
  if (ev.isHold && ev.holdReason) {
    parts.push(`Hold: ${ev.holdReason}`);
  } else if (ev.isHold) {
    parts.push("Hold");
  }
  if (ev.remarks && ev.remarks.trim()) {
    parts.push(ev.remarks.trim());
  }
  return parts.join(" · ");
}

export type MotherLaytimeRecalculateResult = {
  statement: StatementOfFacts;
  breakdown: LaytimeBreakdown;
  timesheet: MotherLaytimeTimesheet;
  dailyLedger: MotherLaytimeDailyLedger;
};

function num(d: Prisma.Decimal | null | undefined): number | null {
  if (d === null || d === undefined) return null;
  const n = Number(d);
  return Number.isFinite(n) ? n : null;
}

/** Quantity (MT) used for contract discharge-rate laytime on a lighter trip. */
function resolveLighterTripCargoMt(trip: {
  draftSurveyWeightMt: Prisma.Decimal | null;
  lighterCapacityTon: Prisma.Decimal | null;
  cargoes: Array<{
    loadedQtyTon: Prisma.Decimal | null;
    agreedQtyTon: Prisma.Decimal | null;
    estimatedQtyTon: Prisma.Decimal | null;
  }> | null;
}): number | null {
  const draft = num(trip.draftSurveyWeightMt);
  if (draft !== null && draft > 0) return draft;

  const cargoes = trip.cargoes ?? [];
  let sum = 0;
  for (const c of cargoes) {
    const v = num(c.loadedQtyTon);
    if (v !== null && v > 0) sum += v;
  }
  if (sum > 0) return sum;

  sum = 0;
  for (const c of cargoes) {
    const v = num(c.agreedQtyTon);
    if (v !== null && v > 0) sum += v;
  }
  if (sum > 0) return sum;

  sum = 0;
  for (const c of cargoes) {
    const v = num(c.estimatedQtyTon);
    if (v !== null && v > 0) sum += v;
  }
  if (sum > 0) return sum;

  const cap = num(trip.lighterCapacityTon);
  if (cap !== null && cap > 0) return cap;
  return null;
}

@Injectable()
export class LaytimeCalculationService {
  constructor(private readonly prisma: PrismaService) {}

  async recalculateMotherStatement(statementId: string): Promise<MotherLaytimeRecalculateResult> {
    const row = await this.prisma.statementOfFacts.findFirst({
      where: { id: statementId, scope: SOFScope.MOTHER_VESSEL },
      include: {
        events: {
          orderBy: [{ eventTime: "asc" }, { id: "asc" }],
          include: {
            eventTypeDefinition: { select: { name: true } }
          }
        },
        vesselCall: {
          include: {
            importContract: true,
            dailyDischarges: { orderBy: { reportDate: "asc" } }
          }
        }
      }
    });

    if (!row) {
      throw new NotFoundException("Mother vessel SOF was not found");
    }

    if (row.status === SOFStatus.CLOSED) {
      throw new BadRequestException("Laytime cannot be recalculated for a closed SOF");
    }

    if (!row.vesselCall) {
      throw new BadRequestException("Mother SOF is not linked to a vessel call");
    }

    const vc = row.vesselCall;
    const commence =
      vc.laytimeCommenceAt ??
      vc.norAcceptedAt ??
      vc.norTenderedAt ??
      row.events[0]?.eventTime ??
      row.startedAt;

    if (!commence) {
      throw new BadRequestException(
        "Cannot determine laytime commence: set vessel call laytime / NOR times or add at least one event"
      );
    }

    const contract = vc.importContract;
    const qty = num(vc.approxTotalWeightTon);
    const rate = num(contract?.dischargeRateMtPerDay);

    let allowed: number | null = num(row.laytimeAllowedHours);
    let allowedSource: LaytimeAllowedSource = "STATEMENT_MANUAL";

    if (contract && qty !== null && qty > 0 && rate !== null && rate > 0) {
      allowed = (qty / rate) * 24;
      allowedSource = "CONTRACT_DISCHARGE_RATE";
    } else if (allowed === null || allowed <= 0) {
      allowed = null;
      allowedSource = "NONE";
    }

    const raw = accumulateLaytimeSegmentsFromEvents(
      row.events.map((e) => ({
        eventTime: e.eventTime,
        countsAsLaytime: e.countsAsLaytime,
        laytimeImpactHours: num(e.laytimeImpactHours),
        closingEventId: e.id
      })),
      commence
    );

    const eventById = new Map(row.events.map((e) => [e.id, e]));
    const { segments } = applyImportContractCalendarToMotherSegments(
      raw.segments,
      eventById,
      contract?.excludedDays,
      vc.laytimeTimeZone
    );

    const resolvedZone = resolveLaytimeZone(vc.laytimeTimeZone);
    const weekWindow = parseContractWeekWindow(
      contract?.excludedTimePeriod ?? null,
      contract?.excludedDays ?? []
    );
    const segmentCountingUsedHours = segments.map((seg) =>
      seg.countsAsLaytime ? seg.countingHours : 0
    );

    const dailyLedger = buildMotherLaytimeDailyLedger({
      commenceAt: commence,
      zone: resolvedZone,
      week: weekWindow,
      freeTimeHours: allowed,
      segments,
      segmentCountingUsedHours,
      dailyDischarges: vc.dailyDischarges ?? [],
      events: row.events.map((e) => ({
        eventTime: e.eventTime,
        remarks: e.remarks,
        eventType: e.eventTypeDefinition?.name ?? ""
      }))
    });

    const contactUsedTotal = dailyLedger.totalContactHour;
    const idleLedgerTotal = dailyLedger.totalIdleHour;
    const demurrageHoursLedger = dailyLedger.totalDemurrageHour;

    const allowedNum = allowed ?? 0;
    const balance = allowed !== null ? allowedNum - contactUsedTotal : null;
    const dispatchHours = allowed !== null ? Math.max(0, allowedNum - contactUsedTotal) : 0;
    const demurrageHours = demurrageHoursLedger;

    const demRate = num(contract?.laytimeDemurrageRatePerDay);
    const disRate = num(contract?.laytimeDispatchRatePerDay);
    const currency = contract?.currency ?? null;

    const demurrageAmount =
      allowed !== null && demRate !== null && demurrageHours > 0
        ? (demurrageHours / 24) * demRate
        : null;
    const dispatchAmount =
      allowed !== null && disRate !== null && dispatchHours > 0
        ? (dispatchHours / 24) * disRate
        : null;
    const netAmount =
      demurrageAmount !== null || dispatchAmount !== null
        ? (demurrageAmount ?? 0) - (dispatchAmount ?? 0)
        : null;

    const data: Prisma.StatementOfFactsUpdateInput = {
      laytimeCommenceAt: commence,
      laytimeUsedHours: new Prisma.Decimal(contactUsedTotal.toFixed(4)),
      laytimeExcludedHours: new Prisma.Decimal(idleLedgerTotal.toFixed(4)),
      laytimeBalanceHours: balance !== null ? new Prisma.Decimal(balance.toFixed(4)) : null
    };

    if (allowedSource === "CONTRACT_DISCHARGE_RATE" && allowed !== null) {
      data.laytimeAllowedHours = new Prisma.Decimal(allowedNum.toFixed(4));
    }

    if (demurrageAmount !== null) {
      data.demurrageAmount = new Prisma.Decimal(demurrageAmount.toFixed(2));
    } else {
      data.demurrageAmount = null;
    }
    if (dispatchAmount !== null) {
      data.dispatchAmount = new Prisma.Decimal(dispatchAmount.toFixed(2));
    } else {
      data.dispatchAmount = null;
    }
    if (netAmount !== null) {
      data.netAmount = new Prisma.Decimal(netAmount.toFixed(2));
    } else {
      data.netAmount = null;
    }

    const updated = await this.prisma.statementOfFacts.update({
      where: { id: statementId },
      data
    });

    const breakdown: LaytimeBreakdown = {
      commenceAt: commence.toISOString(),
      allowedHours: allowed,
      allowedSource,
      usedHours: contactUsedTotal,
      excludedHours: idleLedgerTotal,
      balanceHours: balance ?? 0,
      demurrageHours,
      dispatchHours,
      demurrageAmount,
      dispatchAmount,
      netAmount,
      currency
    };

    const contractSummary: MotherLaytimeContractSummary = {
      cargoQtyMt: qty,
      dischargeRateMtPerDay: rate,
      dischargeRateUnit: contract?.dischargeRateUnit ?? null,
      allowedHours: allowed,
      allowedSource,
      laytimeDemurrageRatePerDay: demRate,
      laytimeDispatchRatePerDay: disRate,
      currency,
      excludedDays: contract?.excludedDays ?? [],
      holidaysExcluded: contract?.holidaysExcluded ?? null,
      laytimeTimeZoneRaw: vc.laytimeTimeZone ?? null,
      laytimeResolvedTimeZone: resolvedZone,
      contractWeekLabel: formatContractWeekWindowLabel(weekWindow)
    };

    const excludedSet = parseExcludedWeekdays(contract?.excludedDays);
    const rows: MotherLaytimeTimesheetRow[] = segments.map((seg) => {
      const ev = seg.closingEventId ? eventById.get(seg.closingEventId) : undefined;
      const impact = ev ? num(ev.laytimeImpactHours) : null;
      const explicitImpact = impact !== null && impact >= 0;
      let countingUsedHours = 0;
      let countingExcludedHours = 0;
      if (seg.countsAsLaytime) {
        countingUsedHours = seg.countingHours;
        if (explicitImpact) {
          countingExcludedHours = 0;
        } else if (excludedSet.size > 0) {
          countingExcludedHours = Math.max(0, seg.elapsedWallHours - seg.countingHours);
        }
      } else {
        countingExcludedHours = seg.countingHours;
      }
      return {
        closingEventId: seg.closingEventId,
        eventType: ev?.eventTypeDefinition?.name ?? "UNKNOWN",
        periodFrom: seg.periodFrom.toISOString(),
        periodTo: seg.periodTo.toISOString(),
        remark: ev ? buildSofEventRemark(ev) : "—",
        elapsedWallHours: seg.elapsedWallHours,
        countingUsedHours,
        countingExcludedHours,
        accumulatedUsedHours: seg.accumulatedUsedHours
      };
    });

    const timesheet: MotherLaytimeTimesheet = { contractSummary, rows };

    return { statement: updated, breakdown, timesheet, dailyLedger };
  }

  /**
   * Lighter SOF laytime uses the same contract calendar, contact-window daily sheet,
   * and demurrage/dispatch money logic as the mother vessel, keyed off the trip’s
   * `vesselCall` import contract. Trip cargo (draft survey → loaded → agreed → estimated
   * → lighter capacity) supplies quantity for discharge-rate allowed hours.
   * Mother-vessel daily discharge rows are not applied on lighter scope (ledger discharge column stays empty).
   */
  async recalculateLighterStatement(statementId: string): Promise<MotherLaytimeRecalculateResult> {
    const row = await this.prisma.statementOfFacts.findFirst({
      where: { id: statementId, scope: SOFScope.LIGHTER_VESSEL },
      include: {
        events: {
          orderBy: [{ eventTime: "asc" }, { id: "asc" }],
          include: {
            eventTypeDefinition: { select: { name: true } }
          }
        },
        lighterTrip: {
          include: {
            cargoes: true,
            vesselCall: {
              include: {
                importContract: true,
                dailyDischarges: { orderBy: { reportDate: "asc" } }
              }
            }
          }
        }
      }
    });

    if (!row) {
      throw new NotFoundException("Lighter vessel SOF was not found");
    }

    if (row.status === SOFStatus.CLOSED) {
      throw new BadRequestException("Laytime cannot be recalculated for a closed SOF");
    }

    if (!row.lighterTrip) {
      throw new BadRequestException("Lighter SOF is not linked to a trip");
    }

    const trip = row.lighterTrip;
    const vc = trip.vesselCall;
    if (!vc) {
      throw new BadRequestException("Lighter trip is not linked to a vessel call");
    }

    const commence =
      trip.laytimeCommenceAt ??
      trip.loadingStartedAt ??
      trip.wayToMVStartedAt ??
      trip.assignedAt ??
      row.events[0]?.eventTime ??
      row.startedAt;

    if (!commence) {
      throw new BadRequestException(
        "Cannot determine lighter laytime commence: set trip laytime commence / loading times or add an event"
      );
    }

    const contract = vc.importContract;
    const qty = resolveLighterTripCargoMt(trip);
    const rate = num(contract?.dischargeRateMtPerDay);

    let allowed: number | null = num(row.laytimeAllowedHours);
    let allowedSource: LaytimeAllowedSource = "STATEMENT_MANUAL";

    if (contract && qty !== null && qty > 0 && rate !== null && rate > 0) {
      allowed = (qty / rate) * 24;
      allowedSource = "CONTRACT_DISCHARGE_RATE";
    } else if (allowed === null || allowed <= 0) {
      allowed = null;
      allowedSource = "NONE";
    }

    const raw = accumulateLaytimeSegmentsFromEvents(
      row.events.map((e) => ({
        eventTime: e.eventTime,
        countsAsLaytime: e.countsAsLaytime,
        laytimeImpactHours: num(e.laytimeImpactHours),
        closingEventId: e.id
      })),
      commence
    );

    const eventById = new Map(row.events.map((e) => [e.id, e]));
    const { segments } = applyImportContractCalendarToMotherSegments(
      raw.segments,
      eventById,
      contract?.excludedDays,
      vc.laytimeTimeZone
    );

    const resolvedZone = resolveLaytimeZone(vc.laytimeTimeZone);
    const weekWindow = parseContractWeekWindow(
      contract?.excludedTimePeriod ?? null,
      contract?.excludedDays ?? []
    );
    const segmentCountingUsedHours = segments.map((seg) =>
      seg.countsAsLaytime ? seg.countingHours : 0
    );

    const dailyLedger = buildMotherLaytimeDailyLedger({
      commenceAt: commence,
      zone: resolvedZone,
      week: weekWindow,
      freeTimeHours: allowed,
      segments,
      segmentCountingUsedHours,
      dailyDischarges: [],
      events: row.events.map((e) => ({
        eventTime: e.eventTime,
        remarks: e.remarks,
        eventType: e.eventTypeDefinition?.name ?? ""
      }))
    });

    const contactUsedTotal = dailyLedger.totalContactHour;
    const idleLedgerTotal = dailyLedger.totalIdleHour;
    const demurrageHoursLedger = dailyLedger.totalDemurrageHour;

    const allowedNum = allowed ?? 0;
    const balance = allowed !== null ? allowedNum - contactUsedTotal : null;
    const dispatchHours = allowed !== null ? Math.max(0, allowedNum - contactUsedTotal) : 0;
    const demurrageHours = demurrageHoursLedger;

    const demRate = num(contract?.laytimeDemurrageRatePerDay);
    const disRate = num(contract?.laytimeDispatchRatePerDay);
    const currency = contract?.currency ?? null;

    const demurrageAmount =
      allowed !== null && demRate !== null && demurrageHours > 0
        ? (demurrageHours / 24) * demRate
        : null;
    const dispatchAmount =
      allowed !== null && disRate !== null && dispatchHours > 0
        ? (dispatchHours / 24) * disRate
        : null;
    const netAmount =
      demurrageAmount !== null || dispatchAmount !== null
        ? (demurrageAmount ?? 0) - (dispatchAmount ?? 0)
        : null;

    const data: Prisma.StatementOfFactsUpdateInput = {
      laytimeCommenceAt: commence,
      laytimeUsedHours: new Prisma.Decimal(contactUsedTotal.toFixed(4)),
      laytimeExcludedHours: new Prisma.Decimal(idleLedgerTotal.toFixed(4)),
      laytimeBalanceHours: balance !== null ? new Prisma.Decimal(balance.toFixed(4)) : null
    };

    if (allowedSource === "CONTRACT_DISCHARGE_RATE" && allowed !== null) {
      data.laytimeAllowedHours = new Prisma.Decimal(allowedNum.toFixed(4));
    }

    if (demurrageAmount !== null) {
      data.demurrageAmount = new Prisma.Decimal(demurrageAmount.toFixed(2));
    } else {
      data.demurrageAmount = null;
    }
    if (dispatchAmount !== null) {
      data.dispatchAmount = new Prisma.Decimal(dispatchAmount.toFixed(2));
    } else {
      data.dispatchAmount = null;
    }
    if (netAmount !== null) {
      data.netAmount = new Prisma.Decimal(netAmount.toFixed(2));
    } else {
      data.netAmount = null;
    }

    const updated = await this.prisma.statementOfFacts.update({
      where: { id: statementId },
      data
    });

    const breakdown: LaytimeBreakdown = {
      commenceAt: commence.toISOString(),
      allowedHours: allowed,
      allowedSource,
      usedHours: contactUsedTotal,
      excludedHours: idleLedgerTotal,
      balanceHours: balance ?? 0,
      demurrageHours,
      dispatchHours,
      demurrageAmount,
      dispatchAmount,
      netAmount,
      currency
    };

    const contractSummary: MotherLaytimeContractSummary = {
      cargoQtyMt: qty,
      dischargeRateMtPerDay: rate,
      dischargeRateUnit: contract?.dischargeRateUnit ?? null,
      allowedHours: allowed,
      allowedSource,
      laytimeDemurrageRatePerDay: demRate,
      laytimeDispatchRatePerDay: disRate,
      currency,
      excludedDays: contract?.excludedDays ?? [],
      holidaysExcluded: contract?.holidaysExcluded ?? null,
      laytimeTimeZoneRaw: vc.laytimeTimeZone ?? null,
      laytimeResolvedTimeZone: resolvedZone,
      contractWeekLabel: formatContractWeekWindowLabel(weekWindow)
    };

    const excludedSet = parseExcludedWeekdays(contract?.excludedDays);
    const rows: MotherLaytimeTimesheetRow[] = segments.map((seg) => {
      const ev = seg.closingEventId ? eventById.get(seg.closingEventId) : undefined;
      const impact = ev ? num(ev.laytimeImpactHours) : null;
      const explicitImpact = impact !== null && impact >= 0;
      let countingUsedHours = 0;
      let countingExcludedHours = 0;
      if (seg.countsAsLaytime) {
        countingUsedHours = seg.countingHours;
        if (explicitImpact) {
          countingExcludedHours = 0;
        } else if (excludedSet.size > 0) {
          countingExcludedHours = Math.max(0, seg.elapsedWallHours - seg.countingHours);
        }
      } else {
        countingExcludedHours = seg.countingHours;
      }
      return {
        closingEventId: seg.closingEventId,
        eventType: ev?.eventTypeDefinition?.name ?? "UNKNOWN",
        periodFrom: seg.periodFrom.toISOString(),
        periodTo: seg.periodTo.toISOString(),
        remark: ev ? buildSofEventRemark(ev) : "—",
        elapsedWallHours: seg.elapsedWallHours,
        countingUsedHours,
        countingExcludedHours,
        accumulatedUsedHours: seg.accumulatedUsedHours
      };
    });

    const timesheet: MotherLaytimeTimesheet = { contractSummary, rows };

    return { statement: updated, breakdown, timesheet, dailyLedger };
  }
}
