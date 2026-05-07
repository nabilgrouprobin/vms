"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LighterTripsModule = void 0;
const common_1 = require("@nestjs/common");
const sof_module_1 = require("../sof/sof.module");
const lighter_trips_controller_1 = require("./lighter-trips.controller");
const lighter_trips_service_1 = require("./lighter-trips.service");
let LighterTripsModule = class LighterTripsModule {
};
exports.LighterTripsModule = LighterTripsModule;
exports.LighterTripsModule = LighterTripsModule = __decorate([
    (0, common_1.Module)({
        imports: [sof_module_1.SofModule],
        controllers: [lighter_trips_controller_1.LighterTripsController],
        providers: [lighter_trips_service_1.LighterTripsService],
        exports: [lighter_trips_service_1.LighterTripsService]
    })
], LighterTripsModule);
//# sourceMappingURL=lighter-trips.module.js.map