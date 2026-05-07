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
exports.SofService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const sof_constants_1 = require("./constants/sof.constants");
const sof_validator_1 = require("./validators/sof.validator");
const laytime_calculation_service_1 = require("./laytime/laytime-calculation.service");
const sof_repository_1 = require("./sof.repository");
let SofService = class SofService {
    sofRepository;
    laytimeCalculation;
    constructor(sofRepository, laytimeCalculation) {
        this.sofRepository = sofRepository;
        this.laytimeCalculation = laytimeCalculation;
    }
    async listMotherVesselSofs(query) {
        const limit = (0, sof_validator_1.parseLimit)(query.limit, sof_constants_1.DEFAULT_SOF_PAGE_SIZE);
        const where = {
            scope: client_1.SOFScope.MOTHER_VESSEL,
            ...(query.status ? { status: query.status } : {}),
            ...(query.vesselCallId ? { vesselCallId: query.vesselCallId } : {}),
            ...(query.search
                ? {
                    OR: [
                        { sofNo: { contains: query.search, mode: "insensitive" } },
                        {
                            vesselCall: {
                                callNo: { contains: query.search, mode: "insensitive" }
                            }
                        },
                        {
                            vesselCall: {
                                vessel: {
                                    name: { contains: query.search, mode: "insensitive" }
                                }
                            }
                        }
                    ]
                }
                : {})
        };
        const rows = await this.sofRepository.findMotherVesselSofs({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: this.sofRepository.getMotherVesselSofListSelect()
        });
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        return {
            data: rows.slice(0, limit),
            nextCursor,
            limit
        };
    }
    async getMotherVesselSof(id) {
        const sof = await this.sofRepository.findMotherVesselSofById(id);
        if (!sof) {
            throw new common_1.NotFoundException("Mother vessel SOF was not found");
        }
        return sof;
    }
    async getSofOptions() {
        const [vesselCalls, lighterTrips, users] = await Promise.all([
            this.sofRepository.listMotherVesselCallOptions(),
            this.sofRepository.listLighterTripOptions(),
            this.sofRepository.listSofUserOptions()
        ]);
        return {
            vesselCalls,
            lighterTrips,
            users
        };
    }
    async createMotherVesselSof(dto) {
        if (!dto.vesselCallId) {
            throw new common_1.BadRequestException("vesselCallId is required");
        }
        const vesselCall = await this.sofRepository.findVesselCall(dto.vesselCallId);
        if (!vesselCall) {
            throw new common_1.NotFoundException("Vessel call was not found");
        }
        if (!vesselCall.vessel.isMotherVessel) {
            throw new common_1.BadRequestException("SOF vessel call must belong to a mother vessel");
        }
        const existingSof = await this.sofRepository.findMotherVesselSofByVesselCallId(dto.vesselCallId);
        if (existingSof) {
            throw new common_1.ConflictException("A mother vessel SOF already exists for this vessel call");
        }
        const data = {
            sofNo: dto.sofNo ?? this.generateSofNo(vesselCall.callNo),
            scope: client_1.SOFScope.MOTHER_VESSEL,
            vesselCallId: dto.vesselCallId,
            startedAt: (0, sof_validator_1.parseOptionalDate)(dto.startedAt, "startedAt"),
            completedAt: (0, sof_validator_1.parseOptionalDate)(dto.completedAt, "completedAt"),
            status: dto.status ?? client_1.SOFStatus.DRAFT,
            laytimeAllowedHours: this.toDecimal(dto.laytimeAllowedHours),
            laytimeUsedHours: this.toDecimal(dto.laytimeUsedHours),
            laytimeExcludedHours: this.toDecimal(dto.laytimeExcludedHours),
            laytimeBalanceHours: this.toDecimal(dto.laytimeBalanceHours),
            demurrageAmount: this.toDecimal(dto.demurrageAmount),
            dispatchAmount: this.toDecimal(dto.dispatchAmount),
            netAmount: this.toDecimal(dto.netAmount),
            verifiedBy: dto.verifiedBy,
            verifiedAt: (0, sof_validator_1.parseOptionalDate)(dto.verifiedAt, "verifiedAt"),
            approvedBy: dto.approvedBy,
            approvedAt: (0, sof_validator_1.parseOptionalDate)(dto.approvedAt, "approvedAt"),
            remarks: dto.remarks
        };
        return this.sofRepository.createMotherVesselSof(data);
    }
    async updateMotherVesselSof(id, dto) {
        const currentSof = await this.getMotherVesselSof(id);
        if (currentSof.status === client_1.SOFStatus.CLOSED && dto.status !== client_1.SOFStatus.CLOSED) {
            throw new common_1.ConflictException("Closed SOF records cannot be edited");
        }
        if (dto.status) {
            (0, sof_validator_1.validateSofStatusTransition)(currentSof.status, dto.status);
        }
        const data = {
            sofNo: dto.sofNo,
            startedAt: (0, sof_validator_1.parseOptionalDate)(dto.startedAt, "startedAt"),
            completedAt: (0, sof_validator_1.parseOptionalDate)(dto.completedAt, "completedAt"),
            status: dto.status,
            laytimeAllowedHours: this.toNullableDecimal(dto.laytimeAllowedHours),
            laytimeUsedHours: this.toNullableDecimal(dto.laytimeUsedHours),
            laytimeExcludedHours: this.toNullableDecimal(dto.laytimeExcludedHours),
            laytimeBalanceHours: this.toNullableDecimal(dto.laytimeBalanceHours),
            laytimeCommenceAt: (0, sof_validator_1.parseOptionalDate)(dto.laytimeCommenceAt, "laytimeCommenceAt"),
            demurrageAmount: this.toNullableDecimal(dto.demurrageAmount),
            dispatchAmount: this.toNullableDecimal(dto.dispatchAmount),
            netAmount: this.toNullableDecimal(dto.netAmount),
            verifiedBy: dto.verifiedBy,
            verifiedAt: (0, sof_validator_1.parseOptionalDate)(dto.verifiedAt, "verifiedAt"),
            approvedBy: dto.approvedBy,
            approvedAt: (0, sof_validator_1.parseOptionalDate)(dto.approvedAt, "approvedAt"),
            remarks: dto.remarks
        };
        return this.sofRepository.updateMotherVesselSof(id, this.removeUndefined(data));
    }
    async deleteMotherVesselSof(id) {
        const currentSof = await this.getMotherVesselSof(id);
        if (currentSof.status === client_1.SOFStatus.CLOSED || currentSof.status === client_1.SOFStatus.APPROVED) {
            throw new common_1.ConflictException("Approved or closed SOF records cannot be deleted");
        }
        try {
            return await this.sofRepository.deleteMotherVesselSof(id);
        }
        catch (error) {
            this.throwPrismaConflict(error, "SOF cannot be deleted while related records still reference it");
            throw error;
        }
    }
    async listLighterVesselSofs(query) {
        const limit = (0, sof_validator_1.parseLimit)(query.limit, sof_constants_1.DEFAULT_SOF_PAGE_SIZE);
        const where = {
            scope: client_1.SOFScope.LIGHTER_VESSEL,
            ...(query.status ? { status: query.status } : {}),
            ...(query.lighterTripId ? { lighterTripId: query.lighterTripId } : {}),
            ...(query.vesselCallId ? { lighterTrip: { vesselCallId: query.vesselCallId } } : {}),
            ...(query.search
                ? {
                    OR: [
                        { sofNo: { contains: query.search, mode: "insensitive" } },
                        {
                            lighterTrip: {
                                tripNo: { contains: query.search, mode: "insensitive" }
                            }
                        },
                        {
                            lighterTrip: {
                                lighterVessel: {
                                    name: { contains: query.search, mode: "insensitive" }
                                }
                            }
                        }
                    ]
                }
                : {})
        };
        const rows = await this.sofRepository.findLighterVesselSofs({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: this.sofRepository.getLighterVesselSofListSelect()
        });
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        return {
            data: rows.slice(0, limit),
            nextCursor,
            limit
        };
    }
    async getLighterVesselSof(id) {
        const sof = await this.sofRepository.findLighterVesselSofById(id);
        if (!sof) {
            throw new common_1.NotFoundException("Lighter vessel SOF was not found");
        }
        return sof;
    }
    async createLighterVesselSof(dto) {
        if (!dto.lighterTripId) {
            throw new common_1.BadRequestException("lighterTripId is required");
        }
        const trip = await this.sofRepository.findLighterTripForSof(dto.lighterTripId);
        if (!trip || trip.deletedAt) {
            throw new common_1.NotFoundException("Lighter trip was not found");
        }
        if (!trip.lighterVessel.isLighter) {
            throw new common_1.BadRequestException("Lighter SOF requires a lighter-class vessel on the trip");
        }
        const existingSof = await this.sofRepository.findLighterVesselSofByLighterTripId(dto.lighterTripId);
        if (existingSof) {
            throw new common_1.ConflictException("A lighter vessel SOF already exists for this trip");
        }
        const data = {
            sofNo: dto.sofNo ?? this.generateLighterSofNo(trip.tripNo),
            scope: client_1.SOFScope.LIGHTER_VESSEL,
            lighterTripId: dto.lighterTripId,
            vesselCallId: null,
            startedAt: (0, sof_validator_1.parseOptionalDate)(dto.startedAt, "startedAt"),
            completedAt: (0, sof_validator_1.parseOptionalDate)(dto.completedAt, "completedAt"),
            status: dto.status ?? client_1.SOFStatus.DRAFT,
            laytimeAllowedHours: this.toDecimal(dto.laytimeAllowedHours),
            laytimeUsedHours: this.toDecimal(dto.laytimeUsedHours),
            laytimeExcludedHours: this.toDecimal(dto.laytimeExcludedHours),
            laytimeBalanceHours: this.toDecimal(dto.laytimeBalanceHours),
            demurrageAmount: this.toDecimal(dto.demurrageAmount),
            dispatchAmount: this.toDecimal(dto.dispatchAmount),
            netAmount: this.toDecimal(dto.netAmount),
            verifiedBy: dto.verifiedBy,
            verifiedAt: (0, sof_validator_1.parseOptionalDate)(dto.verifiedAt, "verifiedAt"),
            approvedBy: dto.approvedBy,
            approvedAt: (0, sof_validator_1.parseOptionalDate)(dto.approvedAt, "approvedAt"),
            remarks: dto.remarks
        };
        return this.sofRepository.createLighterVesselSof(data);
    }
    async updateLighterVesselSof(id, dto) {
        const currentSof = await this.getLighterVesselSof(id);
        if (currentSof.status === client_1.SOFStatus.CLOSED && dto.status !== client_1.SOFStatus.CLOSED) {
            throw new common_1.ConflictException("Closed SOF records cannot be edited");
        }
        if (dto.status) {
            (0, sof_validator_1.validateSofStatusTransition)(currentSof.status, dto.status);
        }
        const data = {
            sofNo: dto.sofNo,
            startedAt: (0, sof_validator_1.parseOptionalDate)(dto.startedAt, "startedAt"),
            completedAt: (0, sof_validator_1.parseOptionalDate)(dto.completedAt, "completedAt"),
            status: dto.status,
            laytimeAllowedHours: this.toNullableDecimal(dto.laytimeAllowedHours),
            laytimeUsedHours: this.toNullableDecimal(dto.laytimeUsedHours),
            laytimeExcludedHours: this.toNullableDecimal(dto.laytimeExcludedHours),
            laytimeBalanceHours: this.toNullableDecimal(dto.laytimeBalanceHours),
            laytimeCommenceAt: (0, sof_validator_1.parseOptionalDate)(dto.laytimeCommenceAt, "laytimeCommenceAt"),
            demurrageAmount: this.toNullableDecimal(dto.demurrageAmount),
            dispatchAmount: this.toNullableDecimal(dto.dispatchAmount),
            netAmount: this.toNullableDecimal(dto.netAmount),
            verifiedBy: dto.verifiedBy,
            verifiedAt: (0, sof_validator_1.parseOptionalDate)(dto.verifiedAt, "verifiedAt"),
            approvedBy: dto.approvedBy,
            approvedAt: (0, sof_validator_1.parseOptionalDate)(dto.approvedAt, "approvedAt"),
            remarks: dto.remarks
        };
        return this.sofRepository.updateLighterVesselSof(id, this.removeUndefined(data));
    }
    async deleteLighterVesselSof(id) {
        const currentSof = await this.getLighterVesselSof(id);
        if (currentSof.status === client_1.SOFStatus.CLOSED || currentSof.status === client_1.SOFStatus.APPROVED) {
            throw new common_1.ConflictException("Approved or closed SOF records cannot be deleted");
        }
        try {
            return await this.sofRepository.deleteLighterVesselSof(id);
        }
        catch (error) {
            this.throwPrismaConflict(error, "SOF cannot be deleted while related records still reference it");
            throw error;
        }
    }
    async listSofEvents(statementId, query, scope) {
        await this.requireStatementForScope(statementId, scope);
        const limit = (0, sof_validator_1.parseLimit)(query.limit, sof_constants_1.DEFAULT_SOF_PAGE_SIZE);
        const rows = await this.sofRepository.listSofEvents(statementId, limit, query.cursor);
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        return {
            data: rows.slice(0, limit),
            nextCursor,
            limit
        };
    }
    async createSofEvent(statementId, dto, scope) {
        const sof = await this.requireStatementForScope(statementId, scope);
        if (sof.status === client_1.SOFStatus.CLOSED) {
            throw new common_1.ConflictException("Closed SOF records cannot receive new events");
        }
        if (!dto.createdBy) {
            throw new common_1.BadRequestException("createdBy is required");
        }
        const eventTypeDef = await this.sofRepository.findActiveSofEventTypeDefinition(dto.eventTypeId);
        if (!eventTypeDef) {
            throw new common_1.BadRequestException("SOF event type was not found or is inactive");
        }
        this.assertSofEventTypeMatchesScope(eventTypeDef.scope, scope);
        const eventTime = (0, sof_validator_1.parseRequiredDate)(dto.eventTime, "eventTime");
        const { outMinutes, outHours } = this.resolveSofDurationForCreate(dto);
        const timeline = await this.sofRepository.listSofEventsTimelineForValidation(statementId);
        (0, sof_validator_1.validateSofEventTimelineNoGaps)([
            ...timeline.map((r) => ({
                id: r.id,
                eventTime: r.eventTime,
                durationHours: r.durationHours,
                durationMinutes: r.durationMinutes
            })),
            {
                id: "zzzzzzzzzzzzzzzzzzzzzzzz",
                eventTime,
                durationHours: outHours ?? null,
                durationMinutes: outMinutes
            }
        ]);
        return this.sofRepository.createSofEvent(this.removeUndefined({
            statementId,
            eventTypeId: dto.eventTypeId,
            eventTime,
            durationHours: outHours,
            durationMinutes: outMinutes,
            countsAsLaytime: dto.countsAsLaytime ?? true,
            laytimeImpactHours: this.toDecimal(dto.laytimeImpactHours),
            location: dto.location,
            anchorageId: dto.anchorageId,
            robQuantityMt: this.toDecimal(dto.robQuantityMt),
            dischargeQuantityMt: this.toDecimal(dto.dischargeQuantityMt),
            cumulativeDischargeMt: this.toDecimal(dto.cumulativeDischargeMt),
            isHold: dto.isHold ?? false,
            holdReason: dto.holdReason,
            responsibleParty: dto.responsibleParty,
            laytimeAccount: dto.laytimeAccount,
            referenceNo: dto.referenceNo,
            remarks: dto.remarks,
            supportingDocuments: dto.supportingDocuments ?? [],
            createdBy: dto.createdBy,
            verifiedBy: dto.verifiedBy,
            verifiedAt: (0, sof_validator_1.parseOptionalDate)(dto.verifiedAt, "verifiedAt"),
            operationBatchId: dto.operationBatchId
        }));
    }
    async updateSofEvent(eventId, dto) {
        const event = await this.sofRepository.findSofEvent(eventId);
        if (!event) {
            throw new common_1.NotFoundException("SOF event was not found");
        }
        const sof = await this.requireStatementById(event.statementId);
        if (sof.status === client_1.SOFStatus.CLOSED) {
            throw new common_1.ConflictException("Closed SOF records cannot be edited");
        }
        if (dto.eventTypeId !== undefined) {
            const eventTypeDef = await this.sofRepository.findActiveSofEventTypeDefinition(dto.eventTypeId);
            if (!eventTypeDef) {
                throw new common_1.BadRequestException("SOF event type was not found or is inactive");
            }
            this.assertSofEventTypeMatchesScope(eventTypeDef.scope, sof.scope);
        }
        const nextEventTime = dto.eventTime
            ? (0, sof_validator_1.parseRequiredDate)(dto.eventTime, "eventTime")
            : event.eventTime;
        const { nextMinutes, nextHours } = this.resolveSofDurationForUpdate(event, dto);
        const timeline = await this.sofRepository.listSofEventsTimelineForValidation(event.statementId);
        (0, sof_validator_1.validateSofEventTimelineNoGaps)(timeline.map((r) => r.id === eventId
            ? {
                id: r.id,
                eventTime: nextEventTime,
                durationHours: nextHours,
                durationMinutes: nextMinutes
            }
            : {
                id: r.id,
                eventTime: r.eventTime,
                durationHours: r.durationHours,
                durationMinutes: r.durationMinutes
            }));
        return this.sofRepository.updateSofEvent(eventId, this.removeUndefined({
            eventTypeId: dto.eventTypeId,
            eventTime: dto.eventTime ? (0, sof_validator_1.parseRequiredDate)(dto.eventTime, "eventTime") : undefined,
            ...(dto.durationMinutes !== undefined || dto.durationHours !== undefined
                ? { durationHours: nextHours, durationMinutes: nextMinutes }
                : {}),
            countsAsLaytime: dto.countsAsLaytime,
            laytimeImpactHours: this.toNullableDecimal(dto.laytimeImpactHours),
            location: dto.location,
            anchorageId: dto.anchorageId,
            robQuantityMt: this.toNullableDecimal(dto.robQuantityMt),
            dischargeQuantityMt: this.toNullableDecimal(dto.dischargeQuantityMt),
            cumulativeDischargeMt: this.toNullableDecimal(dto.cumulativeDischargeMt),
            isHold: dto.isHold,
            holdReason: dto.holdReason,
            responsibleParty: dto.responsibleParty,
            laytimeAccount: dto.laytimeAccount,
            referenceNo: dto.referenceNo,
            remarks: dto.remarks,
            supportingDocuments: dto.supportingDocuments,
            verifiedBy: dto.verifiedBy,
            verifiedAt: (0, sof_validator_1.parseOptionalDate)(dto.verifiedAt, "verifiedAt"),
            operationBatchId: dto.operationBatchId
        }));
    }
    async deleteSofEvent(eventId) {
        const event = await this.sofRepository.findSofEvent(eventId);
        if (!event) {
            throw new common_1.NotFoundException("SOF event was not found");
        }
        const sof = await this.requireStatementById(event.statementId);
        if (sof.status === client_1.SOFStatus.CLOSED) {
            throw new common_1.ConflictException("Closed SOF records cannot be edited");
        }
        return this.sofRepository.deleteSofEvent(eventId);
    }
    async listDailyDischarges(statementId) {
        const sof = await this.getMotherVesselSof(statementId);
        if (!sof.vesselCallId) {
            throw new common_1.BadRequestException("Mother vessel SOF is not linked to a vessel call");
        }
        return this.sofRepository.listDailyDischarges(sof.vesselCallId);
    }
    async createDailyDischarge(statementId, dto) {
        const sof = await this.getMotherVesselSof(statementId);
        if (sof.status === client_1.SOFStatus.CLOSED) {
            throw new common_1.ConflictException("Closed SOF records cannot receive daily discharge");
        }
        if (!sof.vesselCallId) {
            throw new common_1.BadRequestException("Mother vessel SOF is not linked to a vessel call");
        }
        return this.sofRepository.createDailyDischarge({
            vesselCallId: sof.vesselCallId,
            reportDate: (0, sof_validator_1.parseRequiredDate)(dto.reportDate, "reportDate"),
            quantity24hMt: this.toRequiredDecimal(dto.quantity24hMt, "quantity24hMt"),
            cumulativeMt: this.toDecimal(dto.cumulativeMt),
            remainingMt: this.toDecimal(dto.remainingMt),
            enteredById: dto.enteredById,
            remarks: dto.remarks
        });
    }
    async updateDailyDischarge(dischargeId, dto) {
        const discharge = await this.sofRepository.findDailyDischarge(dischargeId);
        if (!discharge) {
            throw new common_1.NotFoundException("Daily discharge was not found");
        }
        return this.sofRepository.updateDailyDischarge(dischargeId, this.removeUndefined({
            reportDate: dto.reportDate ? (0, sof_validator_1.parseRequiredDate)(dto.reportDate, "reportDate") : undefined,
            quantity24hMt: dto.quantity24hMt === undefined
                ? undefined
                : this.toRequiredDecimal(dto.quantity24hMt, "quantity24hMt"),
            cumulativeMt: this.toNullableDecimal(dto.cumulativeMt),
            remainingMt: this.toNullableDecimal(dto.remainingMt),
            enteredById: dto.enteredById,
            remarks: dto.remarks
        }));
    }
    async deleteDailyDischarge(dischargeId) {
        const discharge = await this.sofRepository.findDailyDischarge(dischargeId);
        if (!discharge) {
            throw new common_1.NotFoundException("Daily discharge was not found");
        }
        return this.sofRepository.deleteDailyDischarge(dischargeId);
    }
    generateSofNo(callNo) {
        const suffix = new Date()
            .toISOString()
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);
        return `SOF-MV-${callNo}-${suffix}`;
    }
    generateLighterSofNo(tripNo) {
        const suffix = new Date()
            .toISOString()
            .replace(/[-:.TZ]/g, "")
            .slice(0, 14);
        return `SOF-LT-${tripNo}-${suffix}`;
    }
    async requireStatementForScope(statementId, scope) {
        const row = await this.sofRepository.findStatementById(statementId);
        if (!row || row.scope !== scope) {
            throw new common_1.NotFoundException("Statement of facts was not found");
        }
        return row;
    }
    async requireStatementById(statementId) {
        const row = await this.sofRepository.findStatementById(statementId);
        if (!row) {
            throw new common_1.NotFoundException("Statement of facts was not found");
        }
        return row;
    }
    assertSofEventTypeMatchesScope(defScope, sofScope) {
        const ok = defScope === client_1.SofEventTypeScope.BOTH ||
            (sofScope === client_1.SOFScope.MOTHER_VESSEL && defScope === client_1.SofEventTypeScope.MOTHER_VESSEL) ||
            (sofScope === client_1.SOFScope.LIGHTER_VESSEL && defScope === client_1.SofEventTypeScope.LIGHTER_VESSEL);
        if (!ok) {
            throw new common_1.BadRequestException("This event type cannot be used on this SOF");
        }
    }
    parsePositiveIntegerMinutes(value, fieldName) {
        const n = typeof value === "string" ? parseInt(String(value).trim(), 10) : Math.trunc(Number(value));
        if (!Number.isFinite(n) || n <= 0) {
            throw new common_1.BadRequestException(`${fieldName} must be a positive whole number`);
        }
        if (n > 525_600) {
            throw new common_1.BadRequestException(`${fieldName} is unreasonably large`);
        }
        return n;
    }
    resolveSofDurationForCreate(dto) {
        if (dto.durationMinutes !== undefined &&
            dto.durationMinutes !== null &&
            dto.durationMinutes !== "") {
            const m = this.parsePositiveIntegerMinutes(dto.durationMinutes, "durationMinutes");
            return { outMinutes: m, outHours: null };
        }
        return {
            outMinutes: undefined,
            outHours: this.toDecimal(dto.durationHours) ?? undefined
        };
    }
    resolveSofDurationForUpdate(event, dto) {
        let nextMinutes = event.durationMinutes ?? null;
        let nextHours = event.durationHours ?? null;
        if (dto.durationMinutes !== undefined) {
            if (dto.durationMinutes === null || dto.durationMinutes === "") {
                nextMinutes = null;
                if (dto.durationHours !== undefined) {
                    nextHours = this.toNullableDecimal(dto.durationHours) ?? null;
                    if (nextHours !== null && Number(nextHours) > 0) {
                        nextMinutes = null;
                    }
                }
                else {
                    nextHours = null;
                }
            }
            else {
                nextMinutes = this.parsePositiveIntegerMinutes(dto.durationMinutes, "durationMinutes");
                nextHours = null;
            }
        }
        else if (dto.durationHours !== undefined) {
            nextHours = this.toNullableDecimal(dto.durationHours) ?? null;
            if (nextHours !== null && Number(nextHours) > 0) {
                nextMinutes = null;
            }
        }
        return { nextMinutes, nextHours };
    }
    toDecimal(value) {
        if (value === undefined || value === null || value === "") {
            return undefined;
        }
        return new client_1.Prisma.Decimal(value);
    }
    toNullableDecimal(value) {
        if (value === null) {
            return null;
        }
        return this.toDecimal(value);
    }
    toRequiredDecimal(value, fieldName) {
        if (value === undefined || value === null || value === "") {
            throw new common_1.BadRequestException(`${fieldName} is required`);
        }
        return new client_1.Prisma.Decimal(value);
    }
    removeUndefined(value) {
        return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined));
    }
    recalculateMotherLaytime(statementId) {
        return this.laytimeCalculation.recalculateMotherStatement(statementId);
    }
    recalculateLighterLaytime(statementId) {
        return this.laytimeCalculation.recalculateLighterStatement(statementId);
    }
    async approveLighterVesselSofForTrip(tripId, approvedByUserId) {
        if (!approvedByUserId?.trim()) {
            throw new common_1.BadRequestException("Authenticated user is required");
        }
        const trip = await this.sofRepository.lighterTripExistsActive(tripId);
        if (!trip) {
            throw new common_1.NotFoundException("Lighter trip was not found");
        }
        const sof = await this.sofRepository.findLighterVesselSofByLighterTripId(tripId);
        if (!sof) {
            throw new common_1.NotFoundException("No lighter vessel SOF exists for this trip");
        }
        (0, sof_validator_1.validateSofStatusTransition)(sof.status, client_1.SOFStatus.APPROVED);
        return this.sofRepository.updateLighterVesselSof(sof.id, {
            status: client_1.SOFStatus.APPROVED,
            approvedBy: approvedByUserId,
            approvedAt: new Date()
        });
    }
    throwPrismaConflict(error, message) {
        const knownError = error;
        if (knownError && (knownError.code === "P2002" || knownError.code === "P2003")) {
            throw new common_1.ConflictException(message);
        }
    }
};
exports.SofService = SofService;
exports.SofService = SofService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sof_repository_1.SofRepository,
        laytime_calculation_service_1.LaytimeCalculationService])
], SofService);
//# sourceMappingURL=sof.service.js.map