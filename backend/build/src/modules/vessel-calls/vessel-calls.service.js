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
exports.VesselCallsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;
let VesselCallsService = class VesselCallsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(query) {
        const limit = this.parseLimit(query.limit);
        const motherOnly = query.motherVesselOnly !== "false";
        const where = {
            ...(motherOnly ? { vessel: { isMotherVessel: true } } : {}),
            ...(query.status ? { status: query.status } : {}),
            ...(query.search
                ? {
                    OR: [
                        { callNo: { contains: query.search, mode: "insensitive" } },
                        { cargoNameSnapshot: { contains: query.search, mode: "insensitive" } },
                        {
                            vessel: {
                                name: { contains: query.search, mode: "insensitive" }
                            }
                        }
                    ]
                }
                : {})
        };
        const rows = await this.prisma.vesselCall.findMany({
            where,
            orderBy: [{ eta: "desc" }, { id: "desc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: {
                id: true,
                callNo: true,
                status: true,
                eta: true,
                ata: true,
                currentAnchorage: true,
                totalDischargeMt: true,
                cargoNameSnapshot: true,
                vessel: {
                    select: {
                        id: true,
                        name: true,
                        imoNo: true,
                        flag: true,
                        isMotherVessel: true,
                        isLighter: true
                    }
                },
                arrivalLocation: {
                    select: { id: true, name: true, type: true }
                },
                statementOfFacts: {
                    select: { id: true, sofNo: true, status: true, scope: true }
                },
                _count: {
                    select: { lighterTrips: true, lighterAssignments: true }
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
    async patch(id, dto) {
        const existing = await this.prisma.vesselCall.findFirst({
            where: {
                id,
                vessel: { isMotherVessel: true }
            }
        });
        if (!existing) {
            throw new common_1.NotFoundException("Mother vessel call was not found");
        }
        const data = {};
        if (dto.laytimeTimeZone !== undefined) {
            data.laytimeTimeZone = dto.laytimeTimeZone;
        }
        if (dto.importContractId !== undefined) {
            if (dto.importContractId === null) {
                data.importContract = { disconnect: true };
            }
            else {
                const ic = await this.prisma.importContract.findFirst({
                    where: { id: dto.importContractId, deletedAt: null }
                });
                if (!ic) {
                    throw new common_1.BadRequestException("Import contract was not found or is deleted");
                }
                data.importContract = { connect: { id: dto.importContractId } };
            }
        }
        if (dto.approxTotalWeightTon !== undefined) {
            data.approxTotalWeightTon =
                dto.approxTotalWeightTon === null ? null : new client_1.Prisma.Decimal(dto.approxTotalWeightTon);
        }
        if (dto.status !== undefined) {
            data.status = dto.status;
        }
        if (Object.keys(data).length === 0) {
            return existing;
        }
        return this.prisma.vesselCall.update({
            where: { id },
            data
        });
    }
    async getById(id) {
        return this.prisma.vesselCall.findFirst({
            where: {
                id,
                vessel: { isMotherVessel: true }
            },
            include: {
                vessel: true,
                arrivalLocation: true,
                shippingAgent: { select: { id: true, name: true, code: true } },
                stevedore: { select: { id: true, name: true, code: true } },
                cnf: { select: { id: true, name: true, code: true } },
                statementOfFacts: {
                    include: {
                        _count: { select: { events: true, hourlyStatuses: true } }
                    }
                },
                lighterTrips: {
                    where: { deletedAt: null },
                    orderBy: { assignedAt: "desc" },
                    take: 50,
                    select: {
                        id: true,
                        tripNo: true,
                        status: true,
                        assignedAt: true,
                        lighterVessel: { select: { id: true, name: true } },
                        statementOfFacts: { select: { id: true, sofNo: true, status: true } }
                    }
                }
            }
        });
    }
    parseLimit(raw) {
        const n = raw ? Number.parseInt(raw, 10) : DEFAULT_LIMIT;
        if (!Number.isFinite(n) || n < 1) {
            return DEFAULT_LIMIT;
        }
        return Math.min(n, MAX_LIMIT);
    }
};
exports.VesselCallsService = VesselCallsService;
exports.VesselCallsService = VesselCallsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VesselCallsService);
//# sourceMappingURL=vessel-calls.service.js.map