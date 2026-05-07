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
exports.MasterGhatsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const master_code_util_1 = require("./master-code.util");
const decimal_json_1 = require("./utils/decimal-json");
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;
const ghatSelect = {
    id: true,
    code: true,
    name: true,
    locationId: true,
    unloadingCapacityMtPerDay: true,
    numberOfJetties: true,
    hasWarehouseStorage: true,
    warehouseCapacityMt: true,
    hasTruckScale: true,
    workingStartHour: true,
    workingEndHour: true,
    contactPerson: true,
    contactNo: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    location: { select: { id: true, code: true, name: true, type: true } }
};
let MasterGhatsService = class MasterGhatsService {
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
    mapGhat(row) {
        return {
            ...row,
            unloadingCapacityMtPerDay: (0, decimal_json_1.decString)(row.unloadingCapacityMtPerDay),
            warehouseCapacityMt: (0, decimal_json_1.decString)(row.warehouseCapacityMt)
        };
    }
    async list(query) {
        const limit = this.parseLimit(query.limit);
        const includeInactive = query.includeInactive === "true";
        const search = query.search?.trim();
        const where = {
            ...(includeInactive ? {} : { isActive: true }),
            ...(search
                ? {
                    OR: [
                        { code: { contains: search, mode: "insensitive" } },
                        { name: { contains: search, mode: "insensitive" } }
                    ]
                }
                : {})
        };
        const rows = await this.prisma.ghat.findMany({
            where,
            orderBy: [{ code: "asc" }, { id: "asc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: ghatSelect
        });
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        return {
            data: rows.slice(0, limit).map((r) => this.mapGhat(r)),
            nextCursor,
            limit
        };
    }
    async getById(id) {
        const row = await this.prisma.ghat.findFirst({ where: { id }, select: ghatSelect });
        return row ? this.mapGhat(row) : null;
    }
    async create(dto) {
        const loc = await this.prisma.location.findFirst({
            where: { id: dto.locationId, deletedAt: null, isActive: true },
            select: { id: true }
        });
        if (!loc) {
            throw new common_1.BadRequestException("Location was not found or is inactive.");
        }
        const code = await (0, master_code_util_1.allocateUniqueCode)(async (c) => !!(await this.prisma.ghat.findFirst({ where: { code: c }, select: { id: true } })), "GHT");
        try {
            const row = await this.prisma.ghat.create({
                data: {
                    code,
                    name: dto.name.trim(),
                    locationId: dto.locationId,
                    numberOfJetties: dto.numberOfJetties ?? 1,
                    hasWarehouseStorage: dto.hasWarehouseStorage ?? false,
                    hasTruckScale: dto.hasTruckScale ?? false,
                    workingStartHour: dto.workingStartHour?.trim() || null,
                    workingEndHour: dto.workingEndHour?.trim() || null,
                    contactPerson: dto.contactPerson?.trim() || null,
                    contactNo: dto.contactNo?.trim() || null,
                    unloadingCapacityMtPerDay: (0, decimal_json_1.toDecimalOrNull)(dto.unloadingCapacityMtPerDay),
                    warehouseCapacityMt: (0, decimal_json_1.toDecimalOrNull)(dto.warehouseCapacityMt)
                },
                select: ghatSelect
            });
            return this.mapGhat(row);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.BadRequestException("Another ghat already uses this code.");
            }
            throw e;
        }
    }
    async update(id, dto) {
        const existing = await this.prisma.ghat.findFirst({ where: { id }, select: { id: true } });
        if (!existing) {
            throw new common_1.NotFoundException("Ghat was not found");
        }
        if (dto.locationId) {
            const loc = await this.prisma.location.findFirst({
                where: { id: dto.locationId, deletedAt: null, isActive: true },
                select: { id: true }
            });
            if (!loc) {
                throw new common_1.BadRequestException("Location was not found or is inactive.");
            }
        }
        const data = {};
        if (dto.name !== undefined) {
            data.name = dto.name.trim();
        }
        if (dto.locationId !== undefined) {
            data.location = { connect: { id: dto.locationId } };
        }
        if (dto.numberOfJetties !== undefined) {
            data.numberOfJetties = dto.numberOfJetties;
        }
        if (dto.hasWarehouseStorage !== undefined) {
            data.hasWarehouseStorage = dto.hasWarehouseStorage;
        }
        if (dto.hasTruckScale !== undefined) {
            data.hasTruckScale = dto.hasTruckScale;
        }
        if (dto.workingStartHour !== undefined) {
            data.workingStartHour =
                dto.workingStartHour === null || dto.workingStartHour === ""
                    ? null
                    : dto.workingStartHour.trim();
        }
        if (dto.workingEndHour !== undefined) {
            data.workingEndHour =
                dto.workingEndHour === null || dto.workingEndHour === ""
                    ? null
                    : dto.workingEndHour.trim();
        }
        if (dto.contactPerson !== undefined) {
            data.contactPerson =
                dto.contactPerson === null || dto.contactPerson === ""
                    ? null
                    : dto.contactPerson.trim();
        }
        if (dto.contactNo !== undefined) {
            data.contactNo =
                dto.contactNo === null || dto.contactNo === "" ? null : dto.contactNo.trim();
        }
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }
        if (dto.unloadingCapacityMtPerDay !== undefined) {
            data.unloadingCapacityMtPerDay = (0, decimal_json_1.toDecimalOrNull)(dto.unloadingCapacityMtPerDay);
        }
        if (dto.warehouseCapacityMt !== undefined) {
            data.warehouseCapacityMt = (0, decimal_json_1.toDecimalOrNull)(dto.warehouseCapacityMt);
        }
        if (Object.keys(data).length === 0) {
            return this.getById(id);
        }
        try {
            const row = await this.prisma.ghat.update({
                where: { id },
                data,
                select: ghatSelect
            });
            return this.mapGhat(row);
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.BadRequestException("Another ghat already uses this code.");
            }
            throw e;
        }
    }
    async softDelete(id) {
        const existing = await this.prisma.ghat.findFirst({ where: { id }, select: { id: true } });
        if (!existing) {
            throw new common_1.NotFoundException("Ghat was not found");
        }
        return this.prisma.ghat.update({
            where: { id },
            data: { isActive: false },
            select: { id: true, isActive: true }
        });
    }
};
exports.MasterGhatsService = MasterGhatsService;
exports.MasterGhatsService = MasterGhatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MasterGhatsService);
//# sourceMappingURL=master-ghats.service.js.map