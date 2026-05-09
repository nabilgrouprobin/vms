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
exports.SofRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
let SofRepository = class SofRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    lighterTripExistsActive(id) {
        return this.prisma.lighterTrip.findFirst({
            where: { id, deletedAt: null },
            select: { id: true }
        });
    }
    findMotherVesselSofs(args) {
        return this.prisma.statementOfFacts.findMany(args);
    }
    findMotherVesselSofById(id) {
        return this.prisma.statementOfFacts.findFirst({
            where: {
                id,
                scope: client_1.SOFScope.MOTHER_VESSEL
            },
            include: this.getMotherVesselSofInclude()
        });
    }
    findStatementById(id) {
        return this.prisma.statementOfFacts.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                scope: true,
                vesselCallId: true,
                lighterTripId: true
            }
        });
    }
    findLighterVesselSofById(id) {
        return this.prisma.statementOfFacts.findFirst({
            where: {
                id,
                scope: client_1.SOFScope.LIGHTER_VESSEL
            },
            include: this.getLighterVesselSofInclude()
        });
    }
    findLighterVesselSofByLighterTripId(lighterTripId) {
        return this.prisma.statementOfFacts.findFirst({
            where: {
                lighterTripId,
                scope: client_1.SOFScope.LIGHTER_VESSEL
            }
        });
    }
    findLighterTripForSof(lighterTripId) {
        return this.prisma.lighterTrip.findUnique({
            where: { id: lighterTripId },
            select: {
                id: true,
                tripNo: true,
                status: true,
                deletedAt: true,
                lighterVessel: {
                    select: {
                        id: true,
                        name: true,
                        isLighter: true,
                        isMotherVessel: true
                    }
                },
                vesselCall: {
                    select: {
                        id: true,
                        callNo: true,
                        vessel: { select: { name: true, isMotherVessel: true } }
                    }
                }
            }
        });
    }
    listLighterTripOptions() {
        return this.prisma.lighterTrip.findMany({
            where: {
                deletedAt: null,
                lighterVessel: { isLighter: true }
            },
            orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
            take: 100,
            select: {
                id: true,
                tripNo: true,
                status: true,
                assignedAt: true,
                lighterVessel: { select: { id: true, name: true } },
                vesselCall: {
                    select: {
                        id: true,
                        callNo: true,
                        vessel: { select: { id: true, name: true } }
                    }
                },
                statementOfFacts: {
                    select: { id: true, sofNo: true, status: true }
                }
            }
        });
    }
    findLighterVesselSofs(args) {
        return this.prisma.statementOfFacts.findMany(args);
    }
    createLighterVesselSof(data) {
        return this.prisma.statementOfFacts.create({
            data,
            include: this.getLighterVesselSofInclude()
        });
    }
    updateLighterVesselSof(id, data) {
        return this.prisma.statementOfFacts.update({
            where: { id },
            data,
            include: this.getLighterVesselSofInclude()
        });
    }
    deleteLighterVesselSof(id) {
        return this.prisma.$transaction(async (tx) => {
            await tx.sofEvent.deleteMany({ where: { statementId: id } });
            await tx.sofHourlyStatus.deleteMany({ where: { statementId: id } });
            return tx.statementOfFacts.delete({ where: { id } });
        });
    }
    findMotherVesselSofByVesselCallId(vesselCallId) {
        return this.prisma.statementOfFacts.findFirst({
            where: {
                vesselCallId,
                scope: client_1.SOFScope.MOTHER_VESSEL
            }
        });
    }
    findVesselCall(id) {
        return this.prisma.vesselCall.findUnique({
            where: { id },
            select: {
                id: true,
                callNo: true,
                status: true,
                vessel: {
                    select: {
                        id: true,
                        name: true,
                        isMotherVessel: true
                    }
                }
            }
        });
    }
    listMotherVesselCallOptions() {
        return this.prisma.vesselCall.findMany({
            where: {
                vessel: {
                    isMotherVessel: true
                }
            },
            orderBy: [{ eta: "desc" }, { id: "desc" }],
            take: 100,
            select: {
                id: true,
                callNo: true,
                status: true,
                eta: true,
                currentAnchorage: true,
                vessel: {
                    select: {
                        id: true,
                        name: true,
                        imoNo: true
                    }
                },
                statementOfFacts: {
                    select: {
                        id: true,
                        sofNo: true,
                        status: true
                    }
                }
            }
        });
    }
    listSofUserOptions() {
        return this.prisma.user.findMany({
            where: {
                isActive: true
            },
            orderBy: [{ fullName: "asc" }, { id: "asc" }],
            take: 100,
            select: {
                id: true,
                fullName: true,
                email: true,
                organization: {
                    select: {
                        name: true
                    }
                }
            }
        });
    }
    createMotherVesselSof(data) {
        return this.prisma.statementOfFacts.create({
            data,
            include: this.getMotherVesselSofInclude()
        });
    }
    updateMotherVesselSof(id, data) {
        return this.prisma.statementOfFacts.update({
            where: { id },
            data,
            include: this.getMotherVesselSofInclude()
        });
    }
    deleteMotherVesselSof(id) {
        return this.prisma.$transaction(async (tx) => {
            await tx.sofEvent.deleteMany({ where: { statementId: id } });
            await tx.sofHourlyStatus.deleteMany({ where: { statementId: id } });
            return tx.statementOfFacts.delete({ where: { id } });
        });
    }
    findActiveSofEventTypeDefinition(id) {
        return this.prisma.sofEventTypeDefinition.findFirst({
            where: { id, deletedAt: null, isActive: true },
            select: { id: true, scope: true, category: true }
        });
    }
    listSofEvents(statementId, limit, cursor) {
        return this.prisma.sofEvent.findMany({
            where: { statementId },
            orderBy: [{ eventTime: "desc" }, { id: "desc" }],
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            select: this.getSofEventSelect()
        });
    }
    listSofEventsTimelineForValidation(statementId) {
        return this.prisma.sofEvent.findMany({
            where: { statementId },
            orderBy: [{ eventTime: "asc" }, { id: "asc" }],
            select: { id: true, eventTime: true, durationHours: true, durationMinutes: true }
        });
    }
    findSofEvent(id) {
        return this.prisma.sofEvent.findUnique({
            where: { id },
            select: this.getSofEventSelect()
        });
    }
    createSofEvent(data) {
        return this.prisma.sofEvent.create({
            data,
            select: this.getSofEventSelect()
        });
    }
    splitInsertSofEvent(args) {
        return this.prisma.$transaction(async (tx) => {
            await tx.sofEvent.update({
                where: { id: args.hostId },
                data: args.hostUpdate
            });
            const inserted = await tx.sofEvent.create({
                data: args.insert,
                select: this.getSofEventSelect()
            });
            if (args.continuation) {
                await tx.sofEvent.create({ data: args.continuation });
            }
            return inserted;
        });
    }
    updateSofEvent(id, data) {
        return this.prisma.sofEvent.update({
            where: { id },
            data,
            select: this.getSofEventSelect()
        });
    }
    deleteSofEvent(id) {
        return this.prisma.sofEvent.delete({
            where: { id }
        });
    }
    listDailyDischarges(vesselCallId) {
        return this.prisma.motherVesselDailyDischarge.findMany({
            where: { vesselCallId },
            orderBy: [{ reportDate: "desc" }, { id: "desc" }]
        });
    }
    findDailyDischarge(id) {
        return this.prisma.motherVesselDailyDischarge.findUnique({
            where: { id }
        });
    }
    createDailyDischarge(data) {
        return this.prisma.motherVesselDailyDischarge.create({ data });
    }
    updateDailyDischarge(id, data) {
        return this.prisma.motherVesselDailyDischarge.update({
            where: { id },
            data
        });
    }
    deleteDailyDischarge(id) {
        return this.prisma.motherVesselDailyDischarge.delete({
            where: { id }
        });
    }
    getMotherVesselSofListSelect() {
        return {
            id: true,
            sofNo: true,
            scope: true,
            vesselCallId: true,
            startedAt: true,
            completedAt: true,
            status: true,
            laytimeAllowedHours: true,
            laytimeUsedHours: true,
            laytimeExcludedHours: true,
            laytimeBalanceHours: true,
            demurrageAmount: true,
            dispatchAmount: true,
            netAmount: true,
            remarks: true,
            createdAt: true,
            updatedAt: true,
            vesselCall: {
                select: {
                    id: true,
                    callNo: true,
                    status: true,
                    eta: true,
                    ata: true,
                    currentAnchorage: true,
                    cargoNameSnapshot: true,
                    approxTotalWeightTon: true,
                    totalDischargeMt: true,
                    dischargeStartedAt: true,
                    dischargeCompletedAt: true,
                    vessel: {
                        select: {
                            id: true,
                            name: true,
                            imoNo: true
                        }
                    },
                    cnf: {
                        select: { name: true }
                    },
                    arrivalLocation: {
                        select: { id: true, name: true, type: true }
                    },
                    _count: {
                        select: {
                            lighterTrips: true,
                            lighterAssignments: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    events: true,
                    hourlyStatuses: true
                }
            }
        };
    }
    getVesselCallDetailSelect() {
        return {
            id: true,
            callNo: true,
            status: true,
            eta: true,
            etd: true,
            ata: true,
            atd: true,
            anchorDroppedAt: true,
            norTenderedAt: true,
            norAcceptedAt: true,
            norRejectedAt: true,
            norNumber: true,
            laytimeTimeZone: true,
            laytimeCommenceAt: true,
            readyToDischargeAt: true,
            dischargeStartedAt: true,
            dischargeCompletedAt: true,
            anchorUpAt: true,
            cargoNameSnapshot: true,
            approxTotalWeightTon: true,
            toleranceMinusPct: true,
            tolerancePlusPct: true,
            holdReason: true,
            currentAnchorage: true,
            isAnchored: true,
            isAlongside: true,
            totalStages: true,
            completedStages: true,
            lastStageCompletedAt: true,
            nextStageExpectedAt: true,
            anchorageDischargeMt: true,
            alongsideDischargeMt: true,
            totalDischargeMt: true,
            createdAt: true,
            updatedAt: true,
            arrivalLocation: {
                select: { id: true, name: true, type: true }
            },
            cnf: {
                select: { name: true }
            },
            importContract: {
                select: {
                    id: true,
                    contractNo: true,
                    dischargeRateMtPerDay: true,
                    dischargeRateUnit: true,
                    currency: true,
                    dischargePort: true,
                    excludedDays: true,
                    holidaysExcluded: true,
                    excludedTimePeriod: true,
                    laytimeDemurrageRatePerDay: true,
                    laytimeDispatchRatePerDay: true
                }
            },
            vessel: {
                select: {
                    id: true,
                    name: true,
                    imoNo: true,
                    flag: true,
                    vesselType: true,
                    deadweightTon: true,
                    maxDraftMeters: true,
                    lengthOverallM: true,
                    beamM: true,
                    yearBuilt: true,
                    isMotherVessel: true
                }
            },
            _count: {
                select: {
                    lighterTrips: true,
                    lighterAssignments: true
                }
            }
        };
    }
    getLighterVesselRegistrySelect() {
        return {
            id: true,
            name: true,
            imoNo: true,
            flag: true,
            vesselType: true,
            deadweightTon: true,
            maxDraftMeters: true,
            lengthOverallM: true,
            beamM: true,
            yearBuilt: true,
            isLighter: true
        };
    }
    getLighterVesselSofListSelect() {
        return {
            id: true,
            sofNo: true,
            scope: true,
            lighterTripId: true,
            startedAt: true,
            completedAt: true,
            status: true,
            laytimeAllowedHours: true,
            laytimeUsedHours: true,
            laytimeExcludedHours: true,
            laytimeBalanceHours: true,
            demurrageAmount: true,
            dispatchAmount: true,
            netAmount: true,
            remarks: true,
            createdAt: true,
            updatedAt: true,
            lighterTrip: {
                select: {
                    id: true,
                    tripNo: true,
                    status: true,
                    assignedAt: true,
                    alongsideDate: true,
                    loadingCompletedAt: true,
                    arrivedGhatDate: true,
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
                            eta: true,
                            ata: true,
                            currentAnchorage: true,
                            cargoNameSnapshot: true,
                            approxTotalWeightTon: true,
                            totalDischargeMt: true,
                            dischargeStartedAt: true,
                            dischargeCompletedAt: true,
                            vessel: {
                                select: {
                                    id: true,
                                    name: true,
                                    imoNo: true
                                }
                            },
                            cnf: {
                                select: { name: true }
                            },
                            arrivalLocation: {
                                select: { id: true, name: true, type: true }
                            },
                            _count: {
                                select: {
                                    lighterTrips: true,
                                    lighterAssignments: true
                                }
                            }
                        }
                    }
                }
            },
            _count: {
                select: {
                    events: true,
                    hourlyStatuses: true
                }
            }
        };
    }
    getLighterVesselSofInclude() {
        return {
            lighterTrip: {
                select: {
                    id: true,
                    tripNo: true,
                    status: true,
                    assignedAt: true,
                    alongsideDate: true,
                    loadingStartedAt: true,
                    loadingCompletedAt: true,
                    departedMvDate: true,
                    arrivedGhatDate: true,
                    unloadStartedAt: true,
                    unloadCompletedAt: true,
                    lighterVessel: {
                        select: this.getLighterVesselRegistrySelect()
                    },
                    vesselCall: {
                        select: this.getVesselCallDetailSelect()
                    }
                }
            },
            events: {
                orderBy: [{ eventTime: "desc" }, { id: "desc" }],
                take: 25,
                select: this.getSofEventSelect()
            },
            hourlyStatuses: {
                orderBy: [{ hourStartAt: "desc" }, { id: "desc" }],
                take: 24
            }
        };
    }
    getMotherVesselSofInclude() {
        return {
            vesselCall: {
                select: this.getVesselCallDetailSelect()
            },
            events: {
                orderBy: [{ eventTime: "desc" }, { id: "desc" }],
                take: 25,
                select: this.getSofEventSelect()
            },
            hourlyStatuses: {
                orderBy: [{ hourStartAt: "desc" }, { id: "desc" }],
                take: 24
            }
        };
    }
    getSofEventSelect() {
        return {
            id: true,
            statementId: true,
            eventTypeId: true,
            eventTypeDefinition: {
                select: { id: true, code: true, name: true, category: true }
            },
            eventTime: true,
            durationHours: true,
            durationMinutes: true,
            countsAsLaytime: true,
            laytimeImpactHours: true,
            location: true,
            anchorageId: true,
            robQuantityMt: true,
            dischargeQuantityMt: true,
            cumulativeDischargeMt: true,
            isHold: true,
            holdReason: true,
            responsibleParty: true,
            laytimeAccount: true,
            referenceNo: true,
            remarks: true,
            supportingDocuments: true,
            createdBy: true,
            createdByUser: {
                select: { id: true, fullName: true, email: true }
            },
            verifiedBy: true,
            verifiedAt: true,
            operationBatchId: true,
            createdAt: true,
            updatedAt: true
        };
    }
};
exports.SofRepository = SofRepository;
exports.SofRepository = SofRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SofRepository);
//# sourceMappingURL=sof.repository.js.map