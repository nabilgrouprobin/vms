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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LighterTripsController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const sof_service_1 = require("../sof/sof.service");
const lighter_trip_roles_1 = require("./constants/lighter-trip-roles");
const create_lighter_trip_dto_1 = require("./dto/create-lighter-trip.dto");
const list_lighter_trips_query_dto_1 = require("./dto/list-lighter-trips.query.dto");
const update_lighter_trip_dto_1 = require("./dto/update-lighter-trip.dto");
const lighter_trips_service_1 = require("./lighter-trips.service");
let LighterTripsController = class LighterTripsController {
    lighterTripsService;
    sofService;
    constructor(lighterTripsService, sofService) {
        this.lighterTripsService = lighterTripsService;
        this.sofService = sofService;
    }
    list(query) {
        return this.lighterTripsService.list(query);
    }
    dischargeMetricsByCalls(vesselCallIds) {
        return this.lighterTripsService.dischargeMetricsForVesselCallIds(vesselCallIds);
    }
    openAssignments(vesselCallId) {
        return this.lighterTripsService.listOpenAssignmentsForVesselCall(vesselCallId);
    }
    lighterVessels(search, limit, id) {
        return this.lighterTripsService.listLighterVesselsForPicker(search, limit, id);
    }
    create(dto, req) {
        return this.lighterTripsService.create(dto, req.user?.userId);
    }
    getOne(id) {
        return this.lighterTripsService.getById(id);
    }
    update(id, dto) {
        return this.lighterTripsService.update(id, dto);
    }
    approveLighterSof(id, req) {
        const userId = req.user?.userId;
        return this.sofService.approveLighterVesselSofForTrip(id, userId ?? "");
    }
};
exports.LighterTripsController = LighterTripsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_lighter_trips_query_dto_1.ListLighterTripsQueryDto]),
    __metadata("design:returntype", void 0)
], LighterTripsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)("discharge-metrics-by-calls"),
    __param(0, (0, common_1.Query)("vesselCallIds")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LighterTripsController.prototype, "dischargeMetricsByCalls", null);
__decorate([
    (0, common_1.Get)("vessel-calls/:vesselCallId/open-assignments"),
    __param(0, (0, common_1.Param)("vesselCallId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LighterTripsController.prototype, "openAssignments", null);
__decorate([
    (0, common_1.Get)("meta/lighter-vessels"),
    __param(0, (0, common_1.Query)("search")),
    __param(1, (0, common_1.Query)("limit")),
    __param(2, (0, common_1.Query)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], LighterTripsController.prototype, "lighterVessels", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(...lighter_trip_roles_1.LIGHTER_TRIP_EDITOR_ROLES),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lighter_trip_dto_1.CreateLighterTripDto, Object]),
    __metadata("design:returntype", void 0)
], LighterTripsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LighterTripsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)(...lighter_trip_roles_1.LIGHTER_TRIP_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lighter_trip_dto_1.UpdateLighterTripDto]),
    __metadata("design:returntype", void 0)
], LighterTripsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/approve-lighter-sof"),
    (0, roles_decorator_1.Roles)(...lighter_trip_roles_1.LIGHTER_TRIP_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LighterTripsController.prototype, "approveLighterSof", null);
exports.LighterTripsController = LighterTripsController = __decorate([
    (0, common_1.Controller)("lighter-trips"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(...lighter_trip_roles_1.LIGHTER_TRIP_VIEWER_ROLES),
    __metadata("design:paramtypes", [lighter_trips_service_1.LighterTripsService,
        sof_service_1.SofService])
], LighterTripsController);
//# sourceMappingURL=lighter-trips.controller.js.map