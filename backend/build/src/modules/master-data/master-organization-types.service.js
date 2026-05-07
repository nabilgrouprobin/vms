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
exports.MasterOrganizationTypesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const master_code_util_1 = require("./master-code.util");
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;
const rowSelect = {
    id: true,
    code: true,
    name: true,
    isActive: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { organizations: true } }
};
let MasterOrganizationTypesService = class MasterOrganizationTypesService {
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
        return this.prisma.organizationTypeDefinition.findMany({
            where: { deletedAt: null, isActive: true },
            orderBy: [{ name: "asc" }, { code: "asc" }],
            take: 500,
            select: { id: true, code: true, name: true }
        });
    }
    async list(query) {
        const limit = this.parseLimit(query.limit);
        const includeInactive = query.includeInactive === "true";
        const search = query.search?.trim();
        const where = {
            ...(includeInactive ? {} : { deletedAt: null }),
            ...(search
                ? {
                    OR: [
                        { code: { contains: search, mode: "insensitive" } },
                        { name: { contains: search, mode: "insensitive" } }
                    ]
                }
                : {})
        };
        const rows = await this.prisma.organizationTypeDefinition.findMany({
            where,
            orderBy: [{ name: "asc" }, { id: "asc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: rowSelect
        });
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        return { data: rows.slice(0, limit), nextCursor, limit };
    }
    async getById(id) {
        return this.prisma.organizationTypeDefinition.findFirst({
            where: { id },
            select: rowSelect
        });
    }
    async create(dto) {
        const code = await (0, master_code_util_1.allocateUniqueCode)(async (c) => !!(await this.prisma.organizationTypeDefinition.findFirst({
            where: { code: c },
            select: { id: true }
        })), "ORGTYP");
        try {
            return await this.prisma.organizationTypeDefinition.create({
                data: {
                    code,
                    name: dto.name.trim(),
                    isActive: true
                },
                select: rowSelect
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.ConflictException("Could not allocate a unique organization type code.");
            }
            throw e;
        }
    }
    async update(id, dto) {
        const existing = await this.prisma.organizationTypeDefinition.findFirst({
            where: { id },
            select: { id: true }
        });
        if (!existing) {
            throw new common_1.NotFoundException("Organization type was not found");
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
            if (dto.isActive === true) {
                data.deletedAt = null;
            }
        }
        if (Object.keys(data).length === 0) {
            const row = await this.getById(id);
            if (!row)
                throw new common_1.NotFoundException("Organization type was not found");
            return row;
        }
        return this.prisma.organizationTypeDefinition.update({
            where: { id },
            data,
            select: rowSelect
        });
    }
    async softDelete(id) {
        const existing = await this.prisma.organizationTypeDefinition.findFirst({
            where: { id, deletedAt: null },
            select: { id: true, _count: { select: { organizations: true } } }
        });
        if (!existing) {
            throw new common_1.NotFoundException("Organization type was not found");
        }
        if (existing._count.organizations > 0) {
            throw new common_1.ConflictException("This organization type is still assigned to organizations; reassign them before archiving.");
        }
        return this.prisma.organizationTypeDefinition.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false
            },
            select: rowSelect
        });
    }
};
exports.MasterOrganizationTypesService = MasterOrganizationTypesService;
exports.MasterOrganizationTypesService = MasterOrganizationTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MasterOrganizationTypesService);
//# sourceMappingURL=master-organization-types.service.js.map