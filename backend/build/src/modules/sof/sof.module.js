"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SofModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../../auth/auth.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const laytime_calculation_service_1 = require("./laytime/laytime-calculation.service");
const sof_controller_1 = require("./sof.controller");
const sof_repository_1 = require("./sof.repository");
const sof_service_1 = require("./sof.service");
let SofModule = class SofModule {
};
exports.SofModule = SofModule;
exports.SofModule = SofModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule],
        controllers: [sof_controller_1.SofController],
        providers: [sof_repository_1.SofRepository, sof_service_1.SofService, laytime_calculation_service_1.LaytimeCalculationService],
        exports: [sof_service_1.SofService]
    })
], SofModule);
//# sourceMappingURL=sof.module.js.map