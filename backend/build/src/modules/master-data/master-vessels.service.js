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
exports.MasterVesselsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const decimal_json_1 = require("./utils/decimal-json");
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;
const vesselSelect = {
    id: true,
    name: true,
    imoNo: true,
    flag: true,
    vesselType: true,
    yearBuilt: true,
    deadweightTon: true,
    maxDraftMeters: true,
    lengthOverallM: true,
    beamM: true,
    isActive: true,
    isMotherVessel: true,
    isLighter: true,
    createdAt: true,
    updatedAt: true
};
let MasterVesselsService = class MasterVesselsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    parseLimit(raw) {
        const n = parseInt(raw ?? "", 10);
        if (!Number.isFinite(n) || n < 1) {
            return DEFAULT_LIMIT;
        }
        return Math.min(n, MAX_LIMIT);
    }
    kindWhere(kind) {
        return kind === "mother" ? { isMotherVessel: true } : { isLighter: true };
    }
    mapVessel(kind, row) {
        return {
            id: row.id,
            name: row.name,
            imoNo: row.imoNo,
            flag: row.flag,
            vesselType: row.vesselType,
            yearBuilt: row.yearBuilt,
            deadweightTon: (0, decimal_json_1.decString)(row.deadweightTon),
            maxDraftMeters: (0, decimal_json_1.decString)(row.maxDraftMeters),
            lengthOverallM: (0, decimal_json_1.decString)(row.lengthOverallM),
            beamM: (0, decimal_json_1.decString)(row.beamM),
            isActive: row.isActive,
            isMotherVessel: row.isMotherVessel,
            isLighter: row.isLighter,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            _count: row._count
        };
    }
    async list(kind, query) {
        const limit = this.parseLimit(query.limit);
        const includeInactive = query.includeInactive === "true";
        const search = query.search?.trim();
        const where = {
            ...this.kindWhere(kind),
            ...(includeInactive ? {} : { isActive: true }),
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { imoNo: { contains: search, mode: "insensitive" } }
                    ]
                }
                : {})
        };
        const rows = await this.prisma.vessel.findMany({
            where,
            orderBy: [{ name: "asc" }, { id: "asc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: {
                ...vesselSelect,
                _count: kind === "mother"
                    ? { select: { motherCalls: true } }
                    : { select: { lighterTrips: true } }
            }
        });
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        const slice = rows.slice(0, limit);
        return {
            data: slice.map((r) => this.mapVessel(kind, r)),
            nextCursor,
            limit
        };
    }
    async getById(kind, id) {
        const row = await this.prisma.vessel.findFirst({
            where: { id, ...this.kindWhere(kind) },
            select: {
                ...vesselSelect,
                _count: kind === "mother"
                    ? { select: { motherCalls: true } }
                    : { select: { lighterTrips: true } }
            }
        });
        return row ? this.mapVessel(kind, row) : null;
    }
    async create(kind, dto) {
        const name = dto.name.trim();
        try {
            const row = await this.prisma.vessel.create({
                data: {
                    name,
                    imoNo: dto.imoNo?.trim() || null,
                    flag: dto.flag?.trim() || null,
                    vesselType: dto.vesselType?.trim() || null,
                    yearBuilt: dto.yearBuilt ?? null,
                    deadweightTon: (0, decimal_json_1.toDecimalOrNull)(dto.deadweightTon),
                    maxDraftMeters: (0, decimal_json_1.toDecimalOrNull)(dto.maxDraftMeters),
                    lengthOverallM: (0, decimal_json_1.toDecimalOrNull)(dto.lengthOverallM),
                    beamM: (0, decimal_json_1.toDecimalOrNull)(dto.beamM),
                    isMotherVessel: kind === "mother",
                    isLighter: kind === "lighter"
                },
                select: {
                    ...vesselSelect,
                    _count: kind === "mother"
                        ? { select: { motherCalls: true } }
                        : { select: { lighterTrips: true } }
                }
            });
            return this.mapVessel(kind, row);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.BadRequestException("Another vessel already uses this name or IMO number.");
            }
            throw e;
        }
    }
    async update(kind, id, dto) {
        const existing = await this.prisma.vessel.findFirst({
            where: { id, ...this.kindWhere(kind) },
            select: { id: true }
        });
        if (!existing) {
            throw new common_1.NotFoundException("Vessel was not found");
        }
        const data = {};
        if (dto.name !== undefined) {
            data.name = dto.name.trim();
        }
        if (dto.imoNo !== undefined) {
            data.imoNo = dto.imoNo === null || dto.imoNo === "" ? null : dto.imoNo.trim();
        }
        if (dto.flag !== undefined) {
            data.flag = dto.flag === null || dto.flag === "" ? null : dto.flag.trim();
        }
        if (dto.vesselType !== undefined) {
            data.vesselType =
                dto.vesselType === null || dto.vesselType === "" ? null : dto.vesselType.trim();
        }
        if (dto.yearBuilt !== undefined) {
            data.yearBuilt = dto.yearBuilt;
        }
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }
        if (dto.deadweightTon !== undefined) {
            data.deadweightTon = (0, decimal_json_1.toDecimalOrNull)(dto.deadweightTon);
        }
        if (dto.maxDraftMeters !== undefined) {
            data.maxDraftMeters = (0, decimal_json_1.toDecimalOrNull)(dto.maxDraftMeters);
        }
        if (dto.lengthOverallM !== undefined) {
            data.lengthOverallM = (0, decimal_json_1.toDecimalOrNull)(dto.lengthOverallM);
        }
        if (dto.beamM !== undefined) {
            data.beamM = (0, decimal_json_1.toDecimalOrNull)(dto.beamM);
        }
        if (Object.keys(data).length === 0) {
            return this.getById(kind, id);
        }
        try {
            const row = await this.prisma.vessel.update({
                where: { id },
                data,
                select: {
                    ...vesselSelect,
                    _count: kind === "mother"
                        ? { select: { motherCalls: true } }
                        : { select: { lighterTrips: true } }
                }
            });
            return this.mapVessel(kind, row);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.BadRequestException("Another vessel already uses this name or IMO number.");
            }
            throw e;
        }
    }
    async softDelete(kind, id) {
        const existing = await this.prisma.vessel.findFirst({
            where: { id, ...this.kindWhere(kind) },
            select: { id: true }
        });
        if (!existing) {
            throw new common_1.NotFoundException("Vessel was not found");
        }
        return this.prisma.vessel.update({
            where: { id },
            data: { isActive: false },
            select: { id: true, isActive: true }
        });
    }
};
exports.MasterVesselsService = MasterVesselsService;
exports.MasterVesselsService = MasterVesselsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MasterVesselsService);
//# sourceMappingURL=master-vessels.service.js.map