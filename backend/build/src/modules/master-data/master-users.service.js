"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterUsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;
const userListSelect = {
    id: true,
    email: true,
    phone: true,
    fullName: true,
    isActive: true,
    lastLoginAt: true,
    organizationId: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { roles: true } }
};
let MasterUsersService = class MasterUsersService {
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
            ...(includeInactive ? {} : { deletedAt: null }),
            ...(search
                ? {
                    OR: [
                        { email: { contains: search, mode: "insensitive" } },
                        { fullName: { contains: search, mode: "insensitive" } },
                        { phone: { contains: search, mode: "insensitive" } }
                    ]
                }
                : {})
        };
        const rows = await this.prisma.user.findMany({
            where,
            orderBy: [{ email: "asc" }, { id: "asc" }],
            take: limit + 1,
            ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
            select: userListSelect
        });
        const nextCursor = rows.length > limit ? rows[limit].id : null;
        return {
            data: rows.slice(0, limit),
            nextCursor,
            limit
        };
    }
    async getById(id, opts) {
        const row = await this.prisma.user.findFirst({
            where: {
                id,
                ...(opts?.includeDeleted ? {} : { deletedAt: null })
            },
            select: userListSelect
        });
        return row;
    }
    async create(dto) {
        const email = dto.email?.trim() ? dto.email.toLowerCase().trim() : null;
        const phone = dto.phone.trim();
        const dup = await this.prisma.user.findFirst({
            where: {
                OR: [{ phone }, ...(email ? [{ email }] : [])]
            },
            select: { id: true, email: true, phone: true }
        });
        if (dup) {
            if (dup.phone === phone) {
                throw new common_1.ConflictException("Phone number is already in use");
            }
            throw new common_1.ConflictException("Email is already in use");
        }
        if (dto.organizationId) {
            const org = await this.prisma.organization.findFirst({
                where: { id: dto.organizationId, deletedAt: null, isActive: true }
            });
            if (!org) {
                throw new common_1.BadRequestException("Organization was not found");
            }
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        return this.prisma.user.create({
            data: {
                email,
                phone,
                fullName: dto.fullName.trim(),
                passwordHash,
                organizationId: dto.organizationId ?? undefined,
                isActive: true
            },
            select: userListSelect
        });
    }
    async update(id, dto) {
        const existing = await this.prisma.user.findFirst({
            where: { id },
            select: { id: true, email: true, phone: true, deletedAt: true }
        });
        if (!existing) {
            throw new common_1.NotFoundException("User was not found");
        }
        const data = {};
        if (dto.fullName !== undefined) {
            data.fullName = dto.fullName.trim();
        }
        if (dto.isActive !== undefined) {
            data.isActive = dto.isActive;
            if (dto.isActive && existing.deletedAt) {
                data.deletedAt = null;
            }
        }
        if (dto.email !== undefined) {
            if (dto.email === null || dto.email.trim() === "") {
                data.email = null;
            }
            else {
                const email = dto.email.toLowerCase().trim();
                const conflict = await this.prisma.user.findFirst({
                    where: { email, NOT: { id } },
                    select: { id: true }
                });
                if (conflict) {
                    throw new common_1.ConflictException("Email is already in use");
                }
                data.email = email;
            }
        }
        if (dto.phone !== undefined) {
            const phone = dto.phone.trim();
            const conflict = await this.prisma.user.findFirst({
                where: { phone, NOT: { id } },
                select: { id: true }
            });
            if (conflict) {
                throw new common_1.ConflictException("Phone number is already in use");
            }
            data.phone = phone;
        }
        if (dto.organizationId !== undefined) {
            if (dto.organizationId === null) {
                data.organization = { disconnect: true };
            }
            else {
                const org = await this.prisma.organization.findFirst({
                    where: { id: dto.organizationId, deletedAt: null, isActive: true }
                });
                if (!org) {
                    throw new common_1.BadRequestException("Organization was not found");
                }
                data.organization = { connect: { id: dto.organizationId } };
            }
        }
        if (dto.password !== undefined && dto.password.trim().length > 0) {
            data.passwordHash = await bcrypt.hash(dto.password, 10);
        }
        if (Object.keys(data).length === 0) {
            const row = await this.getById(id, { includeDeleted: true });
            if (!row)
                throw new common_1.NotFoundException("User was not found");
            return row;
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: userListSelect
        });
    }
    async softDelete(id) {
        const existing = await this.prisma.user.findFirst({
            where: { id, deletedAt: null },
            select: { id: true }
        });
        if (!existing) {
            throw new common_1.NotFoundException("User was not found");
        }
        return this.prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false
            },
            select: userListSelect
        });
    }
    async listRoleAssignments(userId) {
        await this.ensureUserExists(userId);
        return this.prisma.userRoleAssignment.findMany({
            where: { userId },
            orderBy: [{ role: "asc" }, { id: "asc" }],
            select: {
                id: true,
                role: true,
                locationId: true,
                grantedBy: true,
                grantedAt: true,
                expiresAt: true,
                location: { select: { id: true, code: true, name: true, type: true } }
            }
        });
    }
    async addRoleAssignmentsBatch(userId, dto, grantedById) {
        await this.ensureUserExists(userId);
        const locId = dto.locationId?.trim() ? dto.locationId.trim() : null;
        if (locId) {
            const loc = await this.prisma.location.findFirst({
                where: { id: locId, deletedAt: null },
                select: { id: true }
            });
            if (!loc) {
                throw new common_1.BadRequestException("Location was not found");
            }
        }
        const uniqueRoles = [...new Set(dto.roles)];
        await this.prisma.userRoleAssignment.createMany({
            data: uniqueRoles.map((role) => ({
                userId,
                role,
                locationId: locId,
                grantedBy: grantedById
            })),
            skipDuplicates: true
        });
        return this.listRoleAssignments(userId);
    }
    async addRoleAssignment(userId, dto, grantedById) {
        await this.ensureUserExists(userId);
        if (dto.locationId) {
            const loc = await this.prisma.location.findFirst({
                where: { id: dto.locationId, deletedAt: null },
                select: { id: true }
            });
            if (!loc) {
                throw new common_1.BadRequestException("Location was not found");
            }
        }
        try {
            return await this.prisma.userRoleAssignment.create({
                data: {
                    userId,
                    role: dto.role,
                    locationId: dto.locationId ?? undefined,
                    grantedBy: grantedById
                },
                select: {
                    id: true,
                    role: true,
                    locationId: true,
                    grantedBy: true,
                    grantedAt: true,
                    expiresAt: true,
                    location: { select: { id: true, code: true, name: true, type: true } }
                }
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                throw new common_1.ConflictException("This role is already assigned for this user and location");
            }
            throw e;
        }
    }
    async removeRoleAssignment(userId, assignmentId) {
        const row = await this.prisma.userRoleAssignment.findFirst({
            where: { id: assignmentId, userId },
            select: { id: true }
        });
        if (!row) {
            throw new common_1.NotFoundException("Role assignment was not found");
        }
        await this.prisma.userRoleAssignment.delete({
            where: { id: assignmentId }
        });
        return { ok: true };
    }
    async ensureUserExists(userId) {
        const u = await this.prisma.user.findFirst({
            where: { id: userId, deletedAt: null },
            select: { id: true }
        });
        if (!u) {
            throw new common_1.NotFoundException("User was not found");
        }
    }
};
exports.MasterUsersService = MasterUsersService;
exports.MasterUsersService = MasterUsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MasterUsersService);
//# sourceMappingURL=master-users.service.js.map