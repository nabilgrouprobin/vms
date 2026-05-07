"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaytimeCalculationService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../prisma/prisma.service");
const laytime_calendar_count_1 = require("./laytime-calendar-count");
const laytime_event_accumulation_1 = require("./laytime-event-accumulation");
const laytime_mother_daily_ledger_1 = require("./laytime-mother-daily-ledger");
function buildSofEventRemark(ev) {
    const parts = [ev.eventTypeDefinition?.name?.trim() || "Event"];
    if (ev.isHold && ev.holdReason) {
        parts.push(`Hold: ${ev.holdReason}`);
    }
    else if (ev.isHold) {
        parts.push("Hold");
    }
    if (ev.remarks && ev.remarks.trim()) {
        parts.push(ev.remarks.trim());
    }
    return parts.join(" · ");
}
function num(d) {
    if (d === null || d === undefined)
        return null;
    const n = Number(d);
    return Number.isFinite(n) ? n : null;
}
function resolveLighterTripCargoMt(trip) {
    const draft = num(trip.draftSurveyWeightMt);
    if (draft !== null && draft > 0)
        return draft;
    const cargoes = trip.cargoes ?? [];
    let sum = 0;
    for (const c of cargoes) {
        const v = num(c.loadedQtyTon);
        if (v !== null && v > 0)
            sum += v;
    }
    if (sum > 0)
        return sum;
    sum = 0;
    for (const c of cargoes) {
        const v = num(c.agreedQtyTon);
        if (v !== null && v > 0)
            sum += v;
    }
    if (sum > 0)
        return sum;
    sum = 0;
    for (const c of cargoes) {
        const v = num(c.estimatedQtyTon);
        if (v !== null && v > 0)
            sum += v;
    }
    if (sum > 0)
        return sum;
    const cap = num(trip.lighterCapacityTon);
    if (cap !== null && cap > 0)
        return cap;
    return null;
}
let LaytimeCalculationService = class LaytimeCalculationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recalculateMotherStatement(statementId) {
        const row = await this.prisma.statementOfFacts.findFirst({
            where: { id: statementId, scope: client_1.SOFScope.MOTHER_VESSEL },
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
            throw new common_1.NotFoundException("Mother vessel SOF was not found");
        }
        if (row.status === client_1.SOFStatus.CLOSED) {
            throw new common_1.BadRequestException("Laytime cannot be recalculated for a closed SOF");
        }
        if (!row.vesselCall) {
            throw new common_1.BadRequestException("Mother SOF is not linked to a vessel call");
        }
        const vc = row.vesselCall;
        const commence = vc.laytimeCommenceAt ??
            vc.norAcceptedAt ??
            vc.norTenderedAt ??
            row.events[0]?.eventTime ??
            row.startedAt;
        if (!commence) {
            throw new common_1.BadRequestException("Cannot determine laytime commence: set vessel call laytime / NOR times or add at least one event");
        }
        const contract = vc.importContract;
        const qty = num(vc.approxTotalWeightTon);
        const rate = num(contract?.dischargeRateMtPerDay);
        let allowed = num(row.laytimeAllowedHours);
        let allowedSource = "STATEMENT_MANUAL";
        if (contract && qty !== null && qty > 0 && rate !== null && rate > 0) {
            allowed = (qty / rate) * 24;
            allowedSource = "CONTRACT_DISCHARGE_RATE";
        }
        else if (allowed === null || allowed <= 0) {
            allowed = null;
            allowedSource = "NONE";
        }
        const raw = (0, laytime_event_accumulation_1.accumulateLaytimeSegmentsFromEvents)(row.events.map((e) => ({
            eventTime: e.eventTime,
            countsAsLaytime: e.countsAsLaytime,
            laytimeImpactHours: num(e.laytimeImpactHours),
            closingEventId: e.id
        })), commence);
        const eventById = new Map(row.events.map((e) => [e.id, e]));
        const { segments } = (0, laytime_calendar_count_1.applyImportContractCalendarToMotherSegments)(raw.segments, eventById, contract?.excludedDays, vc.laytimeTimeZone);
        const resolvedZone = (0, laytime_calendar_count_1.resolveLaytimeZone)(vc.laytimeTimeZone);
        const weekWindow = (0, laytime_mother_daily_ledger_1.parseContractWeekWindow)(contract?.excludedTimePeriod ?? null, contract?.excludedDays ?? []);
        const segmentCountingUsedHours = segments.map((seg) => seg.countsAsLaytime ? seg.countingHours : 0);
        const dailyLedger = (0, laytime_mother_daily_ledger_1.buildMotherLaytimeDailyLedger)({
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
        const demurrageAmount = allowed !== null && demRate !== null && demurrageHours > 0
            ? (demurrageHours / 24) * demRate
            : null;
        const dispatchAmount = allowed !== null && disRate !== null && dispatchHours > 0
            ? (dispatchHours / 24) * disRate
            : null;
        const netAmount = demurrageAmount !== null || dispatchAmount !== null
            ? (demurrageAmount ?? 0) - (dispatchAmount ?? 0)
            : null;
        const data = {
            laytimeCommenceAt: commence,
            laytimeUsedHours: new client_1.Prisma.Decimal(contactUsedTotal.toFixed(4)),
            laytimeExcludedHours: new client_1.Prisma.Decimal(idleLedgerTotal.toFixed(4)),
            laytimeBalanceHours: balance !== null ? new client_1.Prisma.Decimal(balance.toFixed(4)) : null
        };
        if (allowedSource === "CONTRACT_DISCHARGE_RATE" && allowed !== null) {
            data.laytimeAllowedHours = new client_1.Prisma.Decimal(allowedNum.toFixed(4));
        }
        if (demurrageAmount !== null) {
            data.demurrageAmount = new client_1.Prisma.Decimal(demurrageAmount.toFixed(2));
        }
        else {
            data.demurrageAmount = null;
        }
        if (dispatchAmount !== null) {
            data.dispatchAmount = new client_1.Prisma.Decimal(dispatchAmount.toFixed(2));
        }
        else {
            data.dispatchAmount = null;
        }
        if (netAmount !== null) {
            data.netAmount = new client_1.Prisma.Decimal(netAmount.toFixed(2));
        }
        else {
            data.netAmount = null;
        }
        const updated = await this.prisma.statementOfFacts.update({
            where: { id: statementId },
            data
        });
        const breakdown = {
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
        const contractSummary = {
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
            contractWeekLabel: (0, laytime_mother_daily_ledger_1.formatContractWeekWindowLabel)(weekWindow)
        };
        const excludedSet = (0, laytime_calendar_count_1.parseExcludedWeekdays)(contract?.excludedDays);
        const rows = segments.map((seg) => {
            const ev = seg.closingEventId ? eventById.get(seg.closingEventId) : undefined;
            const impact = ev ? num(ev.laytimeImpactHours) : null;
            const explicitImpact = impact !== null && impact >= 0;
            let countingUsedHours = 0;
            let countingExcludedHours = 0;
            if (seg.countsAsLaytime) {
                countingUsedHours = seg.countingHours;
                if (explicitImpact) {
                    countingExcludedHours = 0;
                }
                else if (excludedSet.size > 0) {
                    countingExcludedHours = Math.max(0, seg.elapsedWallHours - seg.countingHours);
                }
            }
            else {
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
        const timesheet = { contractSummary, rows };
        return { statement: updated, breakdown, timesheet, dailyLedger };
    }
    async recalculateLighterStatement(statementId) {
        const row = await this.prisma.statementOfFacts.findFirst({
            where: { id: statementId, scope: client_1.SOFScope.LIGHTER_VESSEL },
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
            throw new common_1.NotFoundException("Lighter vessel SOF was not found");
        }
        if (row.status === client_1.SOFStatus.CLOSED) {
            throw new common_1.BadRequestException("Laytime cannot be recalculated for a closed SOF");
        }
        if (!row.lighterTrip) {
            throw new common_1.BadRequestException("Lighter SOF is not linked to a trip");
        }
        const trip = row.lighterTrip;
        const vc = trip.vesselCall;
        if (!vc) {
            throw new common_1.BadRequestException("Lighter trip is not linked to a vessel call");
        }
        const commence = trip.laytimeCommenceAt ??
            trip.loadingStartedAt ??
            trip.wayToMVStartedAt ??
            trip.assignedAt ??
            row.events[0]?.eventTime ??
            row.startedAt;
        if (!commence) {
            throw new common_1.BadRequestException("Cannot determine lighter laytime commence: set trip laytime commence / loading times or add an event");
        }
        const contract = vc.importContract;
        const qty = resolveLighterTripCargoMt(trip);
        const rate = num(contract?.dischargeRateMtPerDay);
        let allowed = num(row.laytimeAllowedHours);
        let allowedSource = "STATEMENT_MANUAL";
        if (contract && qty !== null && qty > 0 && rate !== null && rate > 0) {
            allowed = (qty / rate) * 24;
            allowedSource = "CONTRACT_DISCHARGE_RATE";
        }
        else if (allowed === null || allowed <= 0) {
            allowed = null;
            allowedSource = "NONE";
        }
        const raw = (0, laytime_event_accumulation_1.accumulateLaytimeSegmentsFromEvents)(row.events.map((e) => ({
            eventTime: e.eventTime,
            countsAsLaytime: e.countsAsLaytime,
            laytimeImpactHours: num(e.laytimeImpactHours),
            closingEventId: e.id
        })), commence);
        const eventById = new Map(row.events.map((e) => [e.id, e]));
        const { segments } = (0, laytime_calendar_count_1.applyImportContractCalendarToMotherSegments)(raw.segments, eventById, contract?.excludedDays, vc.laytimeTimeZone);
        const resolvedZone = (0, laytime_calendar_count_1.resolveLaytimeZone)(vc.laytimeTimeZone);
        const weekWindow = (0, laytime_mother_daily_ledger_1.parseContractWeekWindow)(contract?.excludedTimePeriod ?? null, contract?.excludedDays ?? []);
        const segmentCountingUsedHours = segments.map((seg) => seg.countsAsLaytime ? seg.countingHours : 0);
        const dailyLedger = (0, laytime_mother_daily_ledger_1.buildMotherLaytimeDailyLedger)({
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
        const demurrageAmount = allowed !== null && demRate !== null && demurrageHours > 0
            ? (demurrageHours / 24) * demRate
            : null;
        const dispatchAmount = allowed !== null && disRate !== null && dispatchHours > 0
            ? (dispatchHours / 24) * disRate
            : null;
        const netAmount = demurrageAmount !== null || dispatchAmount !== null
            ? (demurrageAmount ?? 0) - (dispatchAmount ?? 0)
            : null;
        const data = {
            laytimeCommenceAt: commence,
            laytimeUsedHours: new client_1.Prisma.Decimal(contactUsedTotal.toFixed(4)),
            laytimeExcludedHours: new client_1.Prisma.Decimal(idleLedgerTotal.toFixed(4)),
            laytimeBalanceHours: balance !== null ? new client_1.Prisma.Decimal(balance.toFixed(4)) : null
        };
        if (allowedSource === "CONTRACT_DISCHARGE_RATE" && allowed !== null) {
            data.laytimeAllowedHours = new client_1.Prisma.Decimal(allowedNum.toFixed(4));
        }
        if (demurrageAmount !== null) {
            data.demurrageAmount = new client_1.Prisma.Decimal(demurrageAmount.toFixed(2));
        }
        else {
            data.demurrageAmount = null;
        }
        if (dispatchAmount !== null) {
            data.dispatchAmount = new client_1.Prisma.Decimal(dispatchAmount.toFixed(2));
        }
        else {
            data.dispatchAmount = null;
        }
        if (netAmount !== null) {
            data.netAmount = new client_1.Prisma.Decimal(netAmount.toFixed(2));
        }
        else {
            data.netAmount = null;
        }
        const updated = await this.prisma.statementOfFacts.update({
            where: { id: statementId },
            data
        });
        const breakdown = {
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
        const contractSummary = {
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
            contractWeekLabel: (0, laytime_mother_daily_ledger_1.formatContractWeekWindowLabel)(weekWindow)
        };
        const excludedSet = (0, laytime_calendar_count_1.parseExcludedWeekdays)(contract?.excludedDays);
        const rows = segments.map((seg) => {
            const ev = seg.closingEventId ? eventById.get(seg.closingEventId) : undefined;
            const impact = ev ? num(ev.laytimeImpactHours) : null;
            const explicitImpact = impact !== null && impact >= 0;
            let countingUsedHours = 0;
            let countingExcludedHours = 0;
            if (seg.countsAsLaytime) {
                countingUsedHours = seg.countingHours;
                if (explicitImpact) {
                    countingExcludedHours = 0;
                }
                else if (excludedSet.size > 0) {
                    countingExcludedHours = Math.max(0, seg.elapsedWallHours - seg.countingHours);
                }
            }
            else {
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
        const timesheet = { contractSummary, rows };
        return { statement: updated, breakdown, timesheet, dailyLedger };
    }
};
exports.LaytimeCalculationService = LaytimeCalculationService;
exports.LaytimeCalculationService = LaytimeCalculationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LaytimeCalculationService);
//# sourceMappingURL=laytime-calculation.service.js.map