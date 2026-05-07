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
exports.LighterTripsService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const sof_validator_1 = require("../sof/validators/sof.validator");
const sof_constants_1 = require("../sof/constants/sof.constants");
const lighter_trip_board_metrics_1 = require("./lighter-trip-board-metrics");
const lighter_trip_assignment_sync_1 = require("./lighter-trip-assignment-sync");
const LIGHTER_TRIP_DETAIL_INCLUDE = client_1.Prisma.validator()({
    lighterVessel: {
        select: {
            id: true,
            name: true,
            imoNo: true,
            flag: true,
            isLighter: true
        }
    },
    vesselCall: {
        select: {
            id: true,
            callNo: true,
            status: true,
            totalDischargeMt: true,
            cargoNameSnapshot: true,
            vessel: { select: { id: true, name: true, imoNo: true } }
        }
    },
    statementOfFacts: {
        select: { id: true, sofNo: true, status: true }
    },
    lighterAssignment: {
        select: {
            id: true,
            assignmentNo: true,
            status: true,
            estimatedQtyMt: true,
            surveyorLoadedQtyMt: true,
            actualDischargedQtyMt: true,
            carrierConfirmedDate: true,
            holdReason: true,
            readyDate: true,
            departedDate: true,
            arrivedMvDate: true,
            alongsideDate: true,
            loadingStartDate: true,
            loadingSuspendedDate: true,
            loadingResumedDate: true,
            loadingCompleteDate: true,
            departedMvDate: true,
            arrivedGhatDate: true,
            unloadingStartDate: true,
            unloadingSuspendedDate: true,
            unloadingResumedDate: true,
            unloadingCompleteDate: true,
            destinationGhat: { select: { id: true, name: true } }
        }
    },
    cargoes: {
        select: {
            id: true,
            estimatedQtyTon: true,
            agreedQtyTon: true,
            loadedQtyTon: true,
            dischargedQtyTon: true,
            differenceQtyTon: true,
            remarks: true,
            product: { select: { id: true, name: true } }
        }
    },
    events: {
        orderBy: [{ eventTime: "desc" }, { id: "desc" }],
        take: 30,
        select: {
            id: true,
            eventTime: true,
            statusAfter: true,
            direction: true,
            remarks: true
        }
    },
    _count: {
        select: { events: true, cargoes: true }
    }
});
const TRIP_ASSIGNMENT_SYNC_SELECT = client_1.Prisma.validator()({
    status: true,
    wayToMVReadyAt: true,
    wayToMVStartedAt: true,
    wayToMVCompletedAt: true,
    alongsideDate: true,
    loadingStartedAt: true,
    loadingCompletedAt: true,
    departedMvDate: true,
    arrivedGhatDate: true,
    unloadStartedAt: true,
    unloadCompletedAt: true
});
let LighterTripsService = class LighterTripsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(query) {
        if (query.report === "ghat-aging") {
            if (!query.vesselCallId) {
                throw new common_1.BadRequestException("vesselCallId is required when report=ghat-aging");
            }
            return this.listGhatAgingReport(query);
        }
        const limit = Math.min((0, sof_validator_1.parseLimit)(query.limit, sof_constants_1.DEFAULT_SOF_PAGE_SIZE), sof_constants_1.MAX_SOF_PAGE_SIZE);
        const lighterVesselId = query.lighterVesselId?.trim();
        const where = {
            deletedAt: null,
            lighterVessel: { isLighter: true },
            ...(query.vesselCallId ? { vesselCallId: query.vesselCallId } : {}),
            ...(lighterVesselId ? { lighterVesselId } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.search
                ? {
                    OR: [
                        { tripNo: { contains: query.search, mode: "insensitive" } },
                        {
                            lighterVessel: {
                                name: { contains: query.search, mode: "insensitive" }
                            }
                        },
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
        const rows = await this.prisma.lighterTrip.findMany({
            where,
            orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: {
                id: true,
                tripNo: true,
                status: true,
                assignedAt: true,
                lighterVessel: {
                    select: { id: true, name: true, imoNo: true }
                },
                vesselCall: {
                    select: {
                        id: true,
                        callNo: true,
                        status: true,
                        vessel: { select: { id: true, name: true } }
                    }
                },
                statementOfFacts: {
                    select: { id: true, sofNo: true, status: true }
                }
            }
        });
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        return {
            data: rows.slice(0, limit),
            nextCursor,
            limit
        };
    }
    parseGhatAgingLimit(raw) {
        if (!raw) {
            return 200;
        }
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 1) {
            throw new common_1.BadRequestException("limit must be a positive integer");
        }
        return Math.min(n, 500);
    }
    async listGhatAgingReport(query) {
        const limit = this.parseGhatAgingLimit(query.limit);
        const where = {
            deletedAt: null,
            lighterVessel: { isLighter: true },
            vesselCallId: query.vesselCallId,
            ...(query.status ? { status: query.status } : {}),
            ...(query.search
                ? {
                    OR: [
                        { tripNo: { contains: query.search, mode: "insensitive" } },
                        {
                            lighterVessel: {
                                name: { contains: query.search, mode: "insensitive" }
                            }
                        }
                    ]
                }
                : {})
        };
        const rows = await this.prisma.lighterTrip.findMany({
            where,
            orderBy: [{ arrivedGhatDate: "desc" }, { assignedAt: "desc" }, { id: "desc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: {
                id: true,
                tripNo: true,
                status: true,
                assignedAt: true,
                createdAt: true,
                wayToMVStartedAt: true,
                alongsideDate: true,
                loadingStartedAt: true,
                loadingCompletedAt: true,
                departedMvDate: true,
                wayToGhatStartedAt: true,
                arrivedGhatDate: true,
                unloadStartedAt: true,
                unloadCompletedAt: true,
                lighterVessel: {
                    select: { id: true, name: true, imoNo: true }
                },
                vesselCall: {
                    select: {
                        id: true,
                        callNo: true,
                        status: true,
                        vessel: { select: { id: true, name: true } }
                    }
                },
                statementOfFacts: {
                    select: { id: true, sofNo: true, status: true }
                },
                lighterAssignment: {
                    select: {
                        assignedDate: true,
                        estimatedQtyMt: true,
                        actualDischargedQtyMt: true,
                        destinationGhat: {
                            select: {
                                name: true,
                                location: { select: { name: true } }
                            }
                        },
                        carrier: {
                            select: {
                                organization: { select: { name: true } }
                            }
                        }
                    }
                },
                cargoes: {
                    select: {
                        estimatedQtyTon: true,
                        loadedQtyTon: true,
                        dischargedQtyTon: true,
                        product: { select: { name: true } }
                    }
                }
            }
        });
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        return {
            data: rows.slice(0, limit),
            nextCursor,
            limit
        };
    }
    async getById(id) {
        const row = await this.prisma.lighterTrip.findFirst({
            where: { id, deletedAt: null },
            include: LIGHTER_TRIP_DETAIL_INCLUDE
        });
        if (!row) {
            throw new common_1.NotFoundException("Lighter trip was not found");
        }
        return row;
    }
    async update(id, dto) {
        const existing = await this.prisma.lighterTrip.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                status: true,
                vesselCallId: true,
                lighterVesselId: true,
                lighterAssignmentId: true
            }
        });
        if (!existing) {
            throw new common_1.NotFoundException("Lighter trip was not found");
        }
        if (existing.status === client_1.LighterTripStatus.CLOSED) {
            throw new common_1.BadRequestException("Cannot update a closed lighter trip");
        }
        const data = {};
        if (dto.remarks !== undefined) {
            data.remarks = dto.remarks;
        }
        if (dto.status !== undefined) {
            data.status = dto.status;
        }
        if (dto.holdReason !== undefined) {
            data.holdReason = dto.holdReason;
        }
        if (dto.vesselCallId !== undefined && dto.vesselCallId !== existing.vesselCallId) {
            if (existing.lighterAssignmentId) {
                throw new common_1.BadRequestException("Cannot change mother vessel call while this trip is linked to a lighter assignment; unlink or adjust the assignment first");
            }
            const call = await this.prisma.vesselCall.findFirst({
                where: {
                    id: dto.vesselCallId,
                    vessel: { isMotherVessel: true }
                },
                select: { id: true }
            });
            if (!call) {
                throw new common_1.BadRequestException("Mother vessel call was not found");
            }
            data.vesselCall = { connect: { id: dto.vesselCallId } };
        }
        if (dto.lighterVesselId !== undefined && dto.lighterVesselId !== existing.lighterVesselId) {
            if (existing.lighterAssignmentId) {
                throw new common_1.BadRequestException("Cannot change lighter hull while this trip is linked to a carrier assignment");
            }
            const lighterVessel = await this.prisma.vessel.findFirst({
                where: { id: dto.lighterVesselId, isLighter: true, isActive: true },
                select: { id: true }
            });
            if (!lighterVessel) {
                throw new common_1.BadRequestException("Lighter vessel was not found or is not an active lighter hull");
            }
            const releasedForReuse = [
                client_1.LighterTripStatus.UNLOADED,
                client_1.LighterTripStatus.CLOSED,
                client_1.LighterTripStatus.CANCELLED
            ];
            const activeOther = await this.prisma.lighterTrip.findFirst({
                where: {
                    lighterVesselId: dto.lighterVesselId,
                    deletedAt: null,
                    id: { not: id },
                    status: { notIn: releasedForReuse }
                },
                select: { id: true, tripNo: true, status: true }
            });
            if (activeOther) {
                throw new common_1.BadRequestException(`This lighter hull already has an unfinished trip (${activeOther.tripNo}, ${activeOther.status}). ` +
                    "Finish or cancel that trip before assigning this hull here.");
            }
            data.lighterVessel = { connect: { id: dto.lighterVesselId } };
        }
        const dateFields = [
            ["laytimeCommenceAt", dto.laytimeCommenceAt],
            ["wayToMVReadyAt", dto.wayToMVReadyAt],
            ["wayToMVStartedAt", dto.wayToMVStartedAt],
            ["wayToMVCompletedAt", dto.wayToMVCompletedAt],
            ["alongsideDate", dto.alongsideDate],
            ["loadingStartedAt", dto.loadingStartedAt],
            ["loadingCompletedAt", dto.loadingCompletedAt],
            ["departedMvDate", dto.departedMvDate],
            ["wayToGhatStartedAt", dto.wayToGhatStartedAt],
            ["wayToGhatCompletedAt", dto.wayToGhatCompletedAt],
            ["arrivedGhatDate", dto.arrivedGhatDate],
            ["unloadStartedAt", dto.unloadStartedAt],
            ["unloadCompletedAt", dto.unloadCompletedAt]
        ];
        for (const [key, raw] of dateFields) {
            if (raw === undefined)
                continue;
            const parsed = (0, sof_validator_1.parseOptionalDate)(raw, key);
            if (parsed === undefined)
                continue;
            data[key] = parsed;
        }
        const cargoUpdates = dto.cargoQtyUpdates ?? [];
        const hasTripScalarUpdates = Object.keys(data).length > 0;
        const hasCargoUpdates = cargoUpdates.length > 0;
        const carrierConfirmParsed = dto.carrierConfirmedAt === undefined
            ? undefined
            : (0, sof_validator_1.parseOptionalDate)(dto.carrierConfirmedAt, "carrierConfirmedAt");
        const hasCarrierConfirm = carrierConfirmParsed !== undefined;
        const hasAssignmentQtyPatch = !!existing.lighterAssignmentId &&
            (dto.assignmentSurveyorLoadedQtyMt !== undefined ||
                dto.assignmentActualDischargedQtyMt !== undefined);
        if (!hasTripScalarUpdates && !hasCargoUpdates && !hasCarrierConfirm && !hasAssignmentQtyPatch) {
            throw new common_1.BadRequestException("No fields to update");
        }
        const syncAssignment = dto.syncLighterAssignment !== false;
        const statusChanged = dto.status !== undefined && dto.status !== existing.status;
        const eventRemarks = dto.statusChangeRemarks?.trim() || (statusChanged ? "Trip status updated" : undefined);
        return this.prisma.$transaction(async (tx) => {
            if (hasTripScalarUpdates) {
                await tx.lighterTrip.update({
                    where: { id },
                    data
                });
            }
            if (statusChanged && dto.status !== undefined) {
                await tx.lighterTripEvent.create({
                    data: {
                        tripId: id,
                        statusAfter: dto.status,
                        remarks: eventRemarks ?? "Trip status updated"
                    }
                });
            }
            if (hasCargoUpdates) {
                const cargoIds = [...new Set(cargoUpdates.map((u) => u.id))];
                const ownedRows = await tx.lighterTripCargo.findMany({
                    where: { id: { in: cargoIds }, tripId: id },
                    select: { id: true }
                });
                const ownedIds = new Set(ownedRows.map((r) => r.id));
                const missing = cargoIds.find((cargoId) => !ownedIds.has(cargoId));
                if (missing) {
                    throw new common_1.BadRequestException(`Cargo line ${missing} is not on this trip`);
                }
                const updateOps = [];
                for (const u of cargoUpdates) {
                    const cargoData = {};
                    if (u.estimatedQtyTon !== undefined) {
                        const q = this.parseOptionalMtDecimal(u.estimatedQtyTon, "estimatedQtyTon");
                        if (q !== undefined)
                            cargoData.estimatedQtyTon = q;
                    }
                    if (u.loadedQtyTon !== undefined) {
                        const q = this.parseOptionalMtDecimal(u.loadedQtyTon, "loadedQtyTon");
                        if (q !== undefined)
                            cargoData.loadedQtyTon = q;
                    }
                    if (u.dischargedQtyTon !== undefined) {
                        const q = this.parseOptionalMtDecimal(u.dischargedQtyTon, "dischargedQtyTon");
                        if (q !== undefined)
                            cargoData.dischargedQtyTon = q;
                    }
                    if (Object.keys(cargoData).length > 0) {
                        updateOps.push(tx.lighterTripCargo.update({
                            where: { id: u.id },
                            data: cargoData
                        }));
                    }
                }
                if (updateOps.length > 0) {
                    await Promise.all(updateOps);
                }
            }
            if (hasCarrierConfirm && existing.lighterAssignmentId) {
                await tx.lighterAssignment.update({
                    where: { id: existing.lighterAssignmentId },
                    data: {
                        carrierConfirmedDate: carrierConfirmParsed ?? null
                    }
                });
            }
            if (hasAssignmentQtyPatch && existing.lighterAssignmentId) {
                const assignQty = {};
                if (dto.assignmentSurveyorLoadedQtyMt !== undefined) {
                    const v = this.parseOptionalMtDecimal(dto.assignmentSurveyorLoadedQtyMt, "assignmentSurveyorLoadedQtyMt");
                    if (v !== undefined) {
                        assignQty.surveyorLoadedQtyMt = v;
                    }
                }
                if (dto.assignmentActualDischargedQtyMt !== undefined) {
                    const v = this.parseOptionalMtDecimal(dto.assignmentActualDischargedQtyMt, "assignmentActualDischargedQtyMt");
                    if (v !== undefined) {
                        assignQty.actualDischargedQtyMt = v;
                    }
                }
                if (Object.keys(assignQty).length > 0) {
                    await tx.lighterAssignment.update({
                        where: { id: existing.lighterAssignmentId },
                        data: assignQty
                    });
                }
            }
            if (syncAssignment && existing.lighterAssignmentId) {
                const snap = await tx.lighterTrip.findFirst({
                    where: { id },
                    select: TRIP_ASSIGNMENT_SYNC_SELECT
                });
                if (snap) {
                    await tx.lighterAssignment.update({
                        where: { id: existing.lighterAssignmentId },
                        data: (0, lighter_trip_assignment_sync_1.buildLighterAssignmentSyncData)(snap)
                    });
                }
            }
            const out = await tx.lighterTrip.findFirst({
                where: { id },
                include: LIGHTER_TRIP_DETAIL_INCLUDE
            });
            if (!out) {
                throw new common_1.NotFoundException("Lighter trip was not found");
            }
            return out;
        });
    }
    async listOpenAssignmentsForVesselCall(vesselCallId) {
        const id = vesselCallId?.trim();
        if (!id) {
            throw new common_1.BadRequestException("vesselCallId is required");
        }
        const rows = await this.prisma.lighterAssignment.findMany({
            where: { vesselCallId: id, deletedAt: null, trip: null },
            orderBy: [{ assignedDate: "desc" }, { id: "desc" }],
            select: {
                id: true,
                assignmentNo: true,
                estimatedQtyMt: true,
                status: true,
                lighter: { select: { id: true, name: true } },
                carrier: { select: { id: true, organization: { select: { name: true } } } },
                destinationGhat: { select: { id: true, name: true } },
                trip: { select: { id: true } }
            }
        });
        return rows;
    }
    async listLighterVesselsForPicker(search, limitRaw, idRaw) {
        const limit = Math.min(Math.max(parseInt(limitRaw ?? "40", 10) || 40, 1), 100);
        const id = idRaw?.trim();
        const q = search?.trim();
        const vessels = await this.prisma.vessel.findMany({
            where: {
                isLighter: true,
                isActive: true,
                ...(id ? { id } : {}),
                ...(!id && q
                    ? {
                        OR: [
                            { name: { contains: q, mode: "insensitive" } },
                            { imoNo: { contains: q, mode: "insensitive" } }
                        ]
                    }
                    : {})
            },
            orderBy: [{ name: "asc" }],
            take: limit,
            select: { id: true, name: true, imoNo: true, flag: true }
        });
        if (!vessels.length) {
            return [];
        }
        const releasedForReuse = [
            client_1.LighterTripStatus.UNLOADED,
            client_1.LighterTripStatus.CLOSED,
            client_1.LighterTripStatus.CANCELLED
        ];
        const hullIds = vessels.map((v) => v.id);
        const activeTrips = await this.prisma.lighterTrip.findMany({
            where: {
                lighterVesselId: { in: hullIds },
                deletedAt: null,
                status: { notIn: releasedForReuse }
            },
            orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
            select: {
                id: true,
                tripNo: true,
                status: true,
                lighterVesselId: true,
                vesselCall: {
                    select: {
                        id: true,
                        callNo: true,
                        vessel: { select: { name: true } }
                    }
                }
            }
        });
        const activeByHull = new Map();
        for (const t of activeTrips) {
            if (!activeByHull.has(t.lighterVesselId)) {
                activeByHull.set(t.lighterVesselId, t);
            }
        }
        return vessels.map((v) => {
            const t = activeByHull.get(v.id);
            return {
                ...v,
                activeTrip: t
                    ? {
                        id: t.id,
                        tripNo: t.tripNo,
                        status: t.status,
                        vesselCall: t.vesselCall
                    }
                    : null
            };
        });
    }
    async allocateTripNo() {
        for (let i = 0; i < 8; i += 1) {
            const tripNo = `LT-${new Date().getFullYear()}-${(0, node_crypto_1.randomUUID)().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
            const clash = await this.prisma.lighterTrip.findFirst({
                where: { tripNo },
                select: { id: true }
            });
            if (!clash) {
                return tripNo;
            }
        }
        throw new common_1.BadRequestException("Could not allocate a unique trip number");
    }
    async create(dto, assignedById) {
        const assignment = await this.prisma.lighterAssignment.findFirst({
            where: { id: dto.lighterAssignmentId, deletedAt: null },
            include: { trip: { select: { id: true } } }
        });
        if (!assignment) {
            throw new common_1.NotFoundException("Lighter assignment was not found");
        }
        if (assignment.trip) {
            throw new common_1.BadRequestException("This assignment already has a lighter trip");
        }
        const lighterVessel = await this.prisma.vessel.findFirst({
            where: { id: dto.lighterVesselId, isLighter: true, isActive: true },
            select: { id: true }
        });
        if (!lighterVessel) {
            throw new common_1.BadRequestException("Lighter vessel was not found or is not an active lighter hull");
        }
        const releasedForReuse = [
            client_1.LighterTripStatus.UNLOADED,
            client_1.LighterTripStatus.CLOSED,
            client_1.LighterTripStatus.CANCELLED
        ];
        const activeSameHull = await this.prisma.lighterTrip.findFirst({
            where: {
                lighterVesselId: dto.lighterVesselId,
                deletedAt: null,
                status: { notIn: releasedForReuse }
            },
            select: { id: true, tripNo: true, status: true }
        });
        if (activeSameHull) {
            throw new common_1.BadRequestException(`This lighter hull already has an unfinished trip (${activeSameHull.tripNo}, ${activeSameHull.status}). ` +
                "Finish unloading and close or cancel that trip before assigning this lighter to another mother vessel.");
        }
        const tripNo = await this.allocateTripNo();
        return this.prisma.$transaction(async (tx) => {
            const trip = await tx.lighterTrip.create({
                data: {
                    tripNo,
                    vesselCallId: assignment.vesselCallId,
                    lighterAssignmentId: assignment.id,
                    lighterVesselId: dto.lighterVesselId,
                    assignedById: assignedById ?? null,
                    status: client_1.LighterTripStatus.PLANNED,
                    remarks: dto.remarks ?? null
                }
            });
            await tx.lighterTripEvent.create({
                data: {
                    tripId: trip.id,
                    statusAfter: client_1.LighterTripStatus.PLANNED,
                    remarks: "Trip created from carrier assignment"
                }
            });
            await tx.lighterAssignment.update({
                where: { id: assignment.id },
                data: (0, lighter_trip_assignment_sync_1.buildLighterAssignmentSyncData)({
                    status: client_1.LighterTripStatus.PLANNED,
                    wayToMVReadyAt: null,
                    wayToMVStartedAt: null,
                    wayToMVCompletedAt: null,
                    alongsideDate: null,
                    loadingStartedAt: null,
                    loadingCompletedAt: null,
                    departedMvDate: null,
                    arrivedGhatDate: null,
                    unloadStartedAt: null,
                    unloadCompletedAt: null
                })
            });
            const out = await tx.lighterTrip.findFirst({
                where: { id: trip.id },
                include: LIGHTER_TRIP_DETAIL_INCLUDE
            });
            if (!out) {
                throw new common_1.NotFoundException("Lighter trip was not found after create");
            }
            return out;
        });
    }
    parseOptionalMtDecimal(raw, field) {
        if (raw === undefined) {
            return undefined;
        }
        if (raw === null || raw === "") {
            return null;
        }
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0) {
            throw new common_1.BadRequestException(`${field} must be a non-negative number`);
        }
        return new client_1.Prisma.Decimal(raw);
    }
    async dischargeMetricsForVesselCallIds(vesselCallIdsRaw) {
        const vesselCallIds = [
            ...new Set((vesselCallIdsRaw ?? "")
                .split(/[,\s]+/)
                .map((s) => s.trim())
                .filter(Boolean))
        ].slice(0, 40);
        if (!vesselCallIds.length) {
            return { byVesselCallId: {} };
        }
        const [trips, assignGroups, callZones] = await Promise.all([
            this.prisma.lighterTrip.findMany({
                where: {
                    deletedAt: null,
                    vesselCallId: { in: vesselCallIds },
                    lighterVessel: { isLighter: true }
                },
                select: {
                    vesselCallId: true,
                    status: true,
                    assignedAt: true,
                    departedMvDate: true,
                    arrivedGhatDate: true,
                    unloadCompletedAt: true,
                    wayToGhatStartedAt: true,
                    loadingCompletedAt: true,
                    alongsideDate: true,
                    loadingStartedAt: true,
                    lighterAssignment: {
                        select: {
                            assignedDate: true,
                            estimatedQtyMt: true,
                            actualDischargedQtyMt: true
                        }
                    },
                    cargoes: {
                        select: {
                            dischargedQtyTon: true,
                            loadedQtyTon: true,
                            estimatedQtyTon: true
                        }
                    }
                }
            }),
            this.prisma.lighterAssignment.groupBy({
                by: ["vesselCallId"],
                where: { deletedAt: null, vesselCallId: { in: vesselCallIds } },
                _count: { _all: true }
            }),
            this.prisma.vesselCall.findMany({
                where: { id: { in: vesselCallIds } },
                select: { id: true, laytimeTimeZone: true }
            })
        ]);
        const assignBy = new Map(assignGroups.map((g) => [g.vesselCallId, g._count._all]));
        const layTzByCall = new Map(callZones.map((c) => [c.id, c.laytimeTimeZone]));
        const boardTrips = trips;
        const now = new Date();
        const tripsByCall = new Map();
        for (const trip of boardTrips) {
            const existingTrips = tripsByCall.get(trip.vesselCallId);
            if (existingTrips) {
                existingTrips.push(trip);
            }
            else {
                tripsByCall.set(trip.vesselCallId, [trip]);
            }
        }
        const byVesselCallId = {};
        for (const id of vesselCallIds) {
            const slice = tripsByCall.get(id) ?? [];
            byVesselCallId[id] = (0, lighter_trip_board_metrics_1.aggregateBoardMetrics)(slice, assignBy.get(id) ?? 0, now, layTzByCall.get(id));
        }
        return { byVesselCallId };
    }
};
exports.LighterTripsService = LighterTripsService;
exports.LighterTripsService = LighterTripsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LighterTripsService);
//# sourceMappingURL=lighter-trips.service.js.map