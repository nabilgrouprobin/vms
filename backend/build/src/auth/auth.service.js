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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async login(login, password) {
        const loginRaw = login.trim();
        const user = await this.prisma.user.findFirst({
            where: {
                deletedAt: null,
                isActive: true,
                phone: loginRaw
            },
            select: {
                id: true,
                email: true,
                phone: true,
                fullName: true,
                passwordHash: true,
                organizationId: true
            }
        });
        if (!user?.passwordHash) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        const now = new Date();
        const assignments = await this.prisma.userRoleAssignment.findMany({
            where: {
                userId: user.id,
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
            },
            select: { role: true }
        });
        if (assignments.length === 0) {
            throw new common_1.UnauthorizedException("No roles assigned; contact administrator");
        }
        return this.issueSession(user, assignments.map((a) => a.role));
    }
    async signup(dto) {
        const phone = dto.phone.trim();
        const fullName = dto.fullName.trim();
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const created = await this.prisma.$transaction(async (tx) => {
            const dup = await tx.user.findFirst({
                where: {
                    phone
                },
                select: { id: true }
            });
            if (dup) {
                throw new common_1.ConflictException("Phone number is already in use");
            }
            const user = await tx.user.create({
                data: {
                    email: null,
                    phone,
                    fullName,
                    passwordHash,
                    isActive: true
                },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    fullName: true,
                    organizationId: true
                }
            });
            await tx.userRoleAssignment.create({
                data: {
                    userId: user.id,
                    role: client_1.AppRole.REPORT_VIEWER
                }
            });
            return user;
        });
        return this.issueSession(created, [client_1.AppRole.REPORT_VIEWER]);
    }
    async issueSession(user, roles) {
        const payload = { sub: user.id, roles };
        const accessToken = await this.jwt.signAsync(payload);
        void this.prisma.user
            .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        })
            .catch(() => undefined);
        const decoded = this.jwt.decode(accessToken);
        return {
            accessToken,
            tokenType: "Bearer",
            expiresAtUnix: decoded?.exp ?? null,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                fullName: user.fullName,
                organizationId: user.organizationId,
                roles
            }
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map