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
exports.ImportContractsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
function toDec(v) {
    if (v === undefined)
        return undefined;
    if (v === null)
        return null;
    return new client_1.Prisma.Decimal(v);
}
let ImportContractsService = class ImportContractsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getById(id) {
        const row = await this.prisma.importContract.findFirst({
            where: { id, deletedAt: null }
        });
        if (!row) {
            throw new common_1.NotFoundException("Import contract was not found");
        }
        return row;
    }
    async update(id, dto) {
        await this.getById(id);
        const data = {};
        if (dto.excludedDays !== undefined) {
            data.excludedDays = dto.excludedDays;
        }
        if (dto.holidaysExcluded !== undefined) {
            data.holidaysExcluded = dto.holidaysExcluded;
        }
        if (dto.excludedTimePeriod !== undefined) {
            data.excludedTimePeriod = dto.excludedTimePeriod;
        }
        if (dto.dischargeRateMtPerDay !== undefined) {
            data.dischargeRateMtPerDay = toDec(dto.dischargeRateMtPerDay);
        }
        if (dto.dischargeRateUnit !== undefined) {
            data.dischargeRateUnit = dto.dischargeRateUnit;
        }
        if (dto.laytimeDemurrageRatePerDay !== undefined) {
            data.laytimeDemurrageRatePerDay = toDec(dto.laytimeDemurrageRatePerDay);
        }
        if (dto.laytimeDispatchRatePerDay !== undefined) {
            data.laytimeDispatchRatePerDay = toDec(dto.laytimeDispatchRatePerDay);
        }
        if (dto.currency !== undefined) {
            data.currency = dto.currency;
        }
        if (dto.dischargePort !== undefined) {
            data.dischargePort = dto.dischargePort;
        }
        if (Object.keys(data).length === 0) {
            return this.prisma.importContract.findUniqueOrThrow({ where: { id } });
        }
        return this.prisma.importContract.update({
            where: { id },
            data
        });
    }
};
exports.ImportContractsService = ImportContractsService;
exports.ImportContractsService = ImportContractsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ImportContractsService);
//# sourceMappingURL=import-contracts.service.js.map