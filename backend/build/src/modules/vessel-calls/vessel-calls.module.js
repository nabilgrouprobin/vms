"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VesselCallsModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../../auth/auth.module");
const prisma_module_1 = require("../../prisma/prisma.module");
const vessel_calls_controller_1 = require("./vessel-calls.controller");
const vessel_calls_service_1 = require("./vessel-calls.service");
let VesselCallsModule = class VesselCallsModule {
};
exports.VesselCallsModule = VesselCallsModule;
exports.VesselCallsModule = VesselCallsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule],
        controllers: [vessel_calls_controller_1.VesselCallsController],
        providers: [vessel_calls_service_1.VesselCallsService],
        exports: [vessel_calls_service_1.VesselCallsService]
    })
], VesselCallsModule);
//# sourceMappingURL=vessel-calls.module.js.map