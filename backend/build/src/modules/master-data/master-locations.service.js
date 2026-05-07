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
exports.MasterLocationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const master_code_util_1 = require("./master-code.util");
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;
const locationSelect = {
    id: true,
    code: true,
    name: true,
    type: true,
    address: true,
    district: true,
    division: true,
    country: true,
    postalCode: true,
    isActive: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true
};
let MasterLocationsService = class MasterLocationsService {
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
    async listOptions() {
        return this.prisma.location.findMany({
            where: { deletedAt: null, isActive: true },
            orderBy: [{ name: "asc" }],
            take: 500,
            select: { id: true, code: true, name: true, type: true }
        });
    }
    async list(query) {
        const limit = this.parseLimit(query.limit);
        const includeInactive = query.includeInactive === "true";
        const search = query.search?.trim();
        const where = {
            deletedAt: null,
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
        const rows = await this.prisma.location.findMany({
            where,
            orderBy: [{ code: "asc" }, { id: "asc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: locationSelect
        });
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        return { data: rows.slice(0, limit), nextCursor, limit };
    }
    async getById(id) {
        return this.prisma.location.findFirst({
            where: { id, deletedAt: null },
            select: locationSelect
        });
    }
    async create(dto) {
        const code = await (0, master_code_util_1.allocateUniqueCode)(async (c) => !!(await this.prisma.location.findFirst({ where: { code: c }, select: { id: true } })), "LOC");
        try {
            return await this.prisma.location.create({
                data: {
                    code,
                    name: dto.name.trim(),
                    type: dto.type,
                    address: dto.address?.trim() || null,
                    district: dto.district?.trim() || null,
                    division: dto.division?.trim() || null,
                    country: dto.country?.trim() || "Bangladesh",
                    postalCode: dto.postalCode?.trim() || null
                },
                select: locationSelect
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.BadRequestException("Another location already uses this code for the same type.");
            }
            throw e;
        }
    }
    async update(id, dto) {
        const existing = await this.prisma.location.findFirst({
            where: { id, deletedAt: null },
            select: { id: true }
        });
        if (!existing) {
            throw new common_1.NotFoundException("Location was not found");
        }
        const data = {};
        if (dto.name !== undefined) {
            data.name = dto.name.trim();
        }
        if (dto.type !== undefined) {
            data.type = dto.type;
        }
        if (dto.address !== undefined) {
            data.address =
                dto.address === null || dto.address === "" ? null : dto.address.trim();
        }
        if (dto.district !== undefined) {
            data.district =
                dto.district === null || dto.district === "" ? null : dto.district.trim();
        }
        if (dto.division !== undefined) {
            data.division =
                dto.division === null || dto.division === "" ? null : dto.division.trim();
        }
        if (dto.country !== undefined) {
            data.country =
                dto.country === null || dto.country === "" ? "Bangladesh" : dto.country.trim();
        }
        if (dto.postalCode !== undefined) {
            data.postalCode =
                dto.postalCode === null || dto.postalCode === "" ? null : dto.postalCode.trim();
        }
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
            if (dto.isActive === true) {
                data.deletedAt = null;
            }
        }
        if (Object.keys(data).length === 0) {
            return this.getById(id);
        }
        try {
            return await this.prisma.location.update({
                where: { id },
                data,
                select: locationSelect
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.BadRequestException("Another location already uses this code for the same type.");
            }
            throw e;
        }
    }
    async softDelete(id) {
        const existing = await this.prisma.location.findFirst({
            where: { id, deletedAt: null },
            select: { id: true }
        });
        if (!existing) {
            throw new common_1.NotFoundException("Location was not found");
        }
        return this.prisma.location.update({
            where: { id },
            data: { isActive: false },
            select: { id: true, isActive: true }
        });
    }
};
exports.MasterLocationsService = MasterLocationsService;
exports.MasterLocationsService = MasterLocationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MasterLocationsService);
//# sourceMappingURL=master-locations.service.js.map