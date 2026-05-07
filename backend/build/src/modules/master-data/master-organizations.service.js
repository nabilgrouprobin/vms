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
exports.MasterOrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const master_code_util_1 = require("./master-code.util");
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;
const orgSelect = {
    id: true,
    code: true,
    name: true,
    organizationType: { select: { id: true, code: true, name: true } },
    address: true,
    contactPerson: true,
    contactNo: true,
    email: true,
    isActive: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { users: true } }
};
let MasterOrganizationsService = class MasterOrganizationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async requireAssignableOrganizationType(id) {
        const row = await this.prisma.organizationTypeDefinition.findFirst({
            where: { id, deletedAt: null, isActive: true },
            select: { id: true }
        });
        if (!row) {
            throw new common_1.BadRequestException("Organization type was not found or is inactive");
        }
        return row;
    }
    parseLimit(raw) {
        const n = parseInt(raw ?? "", 10);
        if (!Number.isFinite(n) || n < 1) {
            return DEFAULT_LIMIT;
        }
        return Math.min(n, MAX_LIMIT);
    }
    async listOptions() {
        const rows = await this.prisma.organization.findMany({
            where: { deletedAt: null, isActive: true },
            orderBy: [{ name: "asc" }, { code: "asc" }],
            take: 500,
            select: {
                id: true,
                code: true,
                name: true,
                organizationType: { select: { code: true } }
            }
        });
        return rows.map((r) => ({
            id: r.id,
            code: r.code,
            name: r.name,
            type: r.organizationType.code
        }));
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
        const rows = await this.prisma.organization.findMany({
            where,
            orderBy: [{ code: "asc" }, { id: "asc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: orgSelect
        });
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        return { data: rows.slice(0, limit), nextCursor, limit };
    }
    async getById(id) {
        return this.prisma.organization.findFirst({
            where: { id },
            select: orgSelect
        });
    }
    async create(dto) {
        const name = dto.name.trim();
        await this.requireAssignableOrganizationType(dto.organizationTypeId);
        const code = await (0, master_code_util_1.allocateUniqueCode)(async (c) => !!(await this.prisma.organization.findFirst({ where: { code: c }, select: { id: true } })), "ORG");
        try {
            return await this.prisma.organization.create({
                data: {
                    code,
                    name,
                    organizationTypeId: dto.organizationTypeId,
                    address: dto.address?.trim() || null,
                    contactPerson: dto.contactPerson?.trim() || null,
                    contactNo: dto.contactNo?.trim() || null,
                    email: dto.email?.trim() || null,
                    isActive: true
                },
                select: orgSelect
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.ConflictException("Organization code or unique field already exists");
            }
            throw e;
        }
    }
    async update(id, dto) {
        const existing = await this.prisma.organization.findFirst({
            where: { id },
            select: { id: true }
        });
        if (!existing) {
            throw new common_1.NotFoundException("Organization was not found");
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.organizationTypeId !== undefined) {
            await this.requireAssignableOrganizationType(dto.organizationTypeId);
            data.organizationType = { connect: { id: dto.organizationTypeId } };
        }
        if (dto.address !== undefined)
            data.address = dto.address?.trim() || null;
        if (dto.contactPerson !== undefined)
            data.contactPerson = dto.contactPerson?.trim() || null;
        if (dto.contactNo !== undefined)
            data.contactNo = dto.contactNo?.trim() || null;
        if (dto.email !== undefined)
            data.email = dto.email?.trim() || null;
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
            if (dto.isActive === true) {
                data.deletedAt = null;
            }
        }
        if (Object.keys(data).length === 0) {
            const row = await this.getById(id);
            if (!row)
                throw new common_1.NotFoundException("Organization was not found");
            return row;
        }
        try {
            return await this.prisma.organization.update({
                where: { id },
                data,
                select: orgSelect
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.ConflictException("Organization code or unique field already exists");
            }
            throw e;
        }
    }
    async softDelete(id) {
        const existing = await this.prisma.organization.findFirst({
            where: { id, deletedAt: null },
            select: { id: true }
        });
        if (!existing) {
            throw new common_1.NotFoundException("Organization was not found");
        }
        return this.prisma.organization.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false
            },
            select: orgSelect
        });
    }
};
exports.MasterOrganizationsService = MasterOrganizationsService;
exports.MasterOrganizationsService = MasterOrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MasterOrganizationsService);
//# sourceMappingURL=master-organizations.service.js.map