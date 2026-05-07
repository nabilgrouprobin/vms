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
exports.MasterProductsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const master_code_util_1 = require("./master-code.util");
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;
const productSelect = {
    id: true,
    code: true,
    name: true,
    type: true,
    specification: true,
    defaultUom: true,
    hsCode: true,
    isActive: true,
    createdAt: true,
    updatedAt: true
};
let MasterProductsService = class MasterProductsService {
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
        const rows = await this.prisma.product.findMany({
            where,
            orderBy: [{ code: "asc" }, { id: "asc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: productSelect
        });
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        return { data: rows.slice(0, limit), nextCursor, limit };
    }
    async getById(id) {
        return this.prisma.product.findFirst({ where: { id }, select: productSelect });
    }
    async create(dto) {
        const code = await (0, master_code_util_1.allocateUniqueCode)(async (c) => !!(await this.prisma.product.findFirst({ where: { code: c }, select: { id: true } })), "PRD");
        try {
            return await this.prisma.product.create({
                data: {
                    code,
                    name: dto.name.trim(),
                    type: dto.type,
                    specification: dto.specification?.trim() || null,
                    hsCode: dto.hsCode?.trim() || null,
                    defaultUom: dto.defaultUom?.trim() || "MT"
                },
                select: productSelect
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.BadRequestException("Another product already uses this code.");
            }
            throw e;
        }
    }
    async update(id, dto) {
        const existing = await this.prisma.product.findFirst({ where: { id }, select: { id: true } });
        if (!existing) {
            throw new common_1.NotFoundException("Product was not found");
        }
        const data = {};
        if (dto.name !== undefined) {
            data.name = dto.name.trim();
        }
        if (dto.type !== undefined) {
            data.type = dto.type;
        }
        if (dto.specification !== undefined) {
            data.specification =
                dto.specification === null || dto.specification === ""
                    ? null
                    : dto.specification.trim();
        }
        if (dto.hsCode !== undefined) {
            data.hsCode = dto.hsCode === null || dto.hsCode === "" ? null : dto.hsCode.trim();
        }
        if (dto.defaultUom !== undefined) {
            data.defaultUom =
                dto.defaultUom === null || dto.defaultUom === ""
                    ? "MT"
                    : dto.defaultUom.trim();
        }
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
        }
        if (Object.keys(data).length === 0) {
            return this.getById(id);
        }
        try {
            return await this.prisma.product.update({
                where: { id },
                data,
                select: productSelect
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.BadRequestException("Another product already uses this code.");
            }
            throw e;
        }
    }
    async softDelete(id) {
        const existing = await this.prisma.product.findFirst({ where: { id }, select: { id: true } });
        if (!existing) {
            throw new common_1.NotFoundException("Product was not found");
        }
        return this.prisma.product.update({
            where: { id },
            data: { isActive: false },
            select: { id: true, isActive: true }
        });
    }
};
exports.MasterProductsService = MasterProductsService;
exports.MasterProductsService = MasterProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MasterProductsService);
//# sourceMappingURL=master-products.service.js.map