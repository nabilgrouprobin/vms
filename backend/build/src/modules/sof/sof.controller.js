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
exports.SofController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const sof_roles_1 = require("./constants/sof-roles");
const create_lighter_vessel_sof_dto_1 = require("./dto/create-lighter-vessel-sof.dto");
const create_mother_vessel_daily_discharge_dto_1 = require("./dto/create-mother-vessel-daily-discharge.dto");
const create_mother_vessel_sof_dto_1 = require("./dto/create-mother-vessel-sof.dto");
const create_sof_event_dto_1 = require("./dto/create-sof-event.dto");
const list_lighter_vessel_sofs_query_dto_1 = require("./dto/list-lighter-vessel-sofs.query.dto");
const list_mother_vessel_sofs_query_dto_1 = require("./dto/list-mother-vessel-sofs.query.dto");
const update_lighter_vessel_sof_dto_1 = require("./dto/update-lighter-vessel-sof.dto");
const update_mother_vessel_daily_discharge_dto_1 = require("./dto/update-mother-vessel-daily-discharge.dto");
const update_mother_vessel_sof_dto_1 = require("./dto/update-mother-vessel-sof.dto");
const update_sof_event_dto_1 = require("./dto/update-sof-event.dto");
const sof_service_1 = require("./sof.service");
let SofController = class SofController {
    sofService;
    constructor(sofService) {
        this.sofService = sofService;
    }
    getSofOptions() {
        return this.sofService.getSofOptions();
    }
    listMotherVesselSofs(query) {
        return this.sofService.listMotherVesselSofs(query);
    }
    createMotherVesselSof(dto) {
        return this.sofService.createMotherVesselSof(dto);
    }
    getMotherVesselSof(id) {
        return this.sofService.getMotherVesselSof(id);
    }
    updateMotherVesselSof(id, dto) {
        return this.sofService.updateMotherVesselSof(id, dto);
    }
    deleteMotherVesselSof(id) {
        return this.sofService.deleteMotherVesselSof(id);
    }
    listSofEvents(id, query) {
        return this.sofService.listSofEvents(id, query, client_1.SOFScope.MOTHER_VESSEL);
    }
    createSofEvent(id, dto) {
        return this.sofService.createSofEvent(id, dto, client_1.SOFScope.MOTHER_VESSEL);
    }
    listLighterVesselSofs(query) {
        return this.sofService.listLighterVesselSofs(query);
    }
    createLighterVesselSof(dto) {
        return this.sofService.createLighterVesselSof(dto);
    }
    getLighterVesselSof(id) {
        return this.sofService.getLighterVesselSof(id);
    }
    updateLighterVesselSof(id, dto) {
        return this.sofService.updateLighterVesselSof(id, dto);
    }
    deleteLighterVesselSof(id) {
        return this.sofService.deleteLighterVesselSof(id);
    }
    listLighterSofEvents(id, query) {
        return this.sofService.listSofEvents(id, query, client_1.SOFScope.LIGHTER_VESSEL);
    }
    createLighterSofEvent(id, dto) {
        return this.sofService.createSofEvent(id, dto, client_1.SOFScope.LIGHTER_VESSEL);
    }
    updateSofEvent(eventId, dto) {
        return this.sofService.updateSofEvent(eventId, dto);
    }
    deleteSofEvent(eventId) {
        return this.sofService.deleteSofEvent(eventId);
    }
    listDailyDischarges(id) {
        return this.sofService.listDailyDischarges(id);
    }
    createDailyDischarge(id, dto) {
        return this.sofService.createDailyDischarge(id, dto);
    }
    updateDailyDischarge(dischargeId, dto) {
        return this.sofService.updateDailyDischarge(dischargeId, dto);
    }
    deleteDailyDischarge(dischargeId) {
        return this.sofService.deleteDailyDischarge(dischargeId);
    }
    recalculateMotherLaytime(id) {
        return this.sofService.recalculateMotherLaytime(id);
    }
    recalculateLighterLaytime(id) {
        return this.sofService.recalculateLighterLaytime(id);
    }
};
exports.SofController = SofController;
__decorate([
    (0, common_1.Get)("options"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SofController.prototype, "getSofOptions", null);
__decorate([
    (0, common_1.Get)("mother-vessels"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_mother_vessel_sofs_query_dto_1.ListMotherVesselSofsQueryDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "listMotherVesselSofs", null);
__decorate([
    (0, common_1.Post)("mother-vessels"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_mother_vessel_sof_dto_1.CreateMotherVesselSofDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "createMotherVesselSof", null);
__decorate([
    (0, common_1.Get)("mother-vessels/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "getMotherVesselSof", null);
__decorate([
    (0, common_1.Patch)("mother-vessels/:id"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_mother_vessel_sof_dto_1.UpdateMotherVesselSofDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "updateMotherVesselSof", null);
__decorate([
    (0, common_1.Delete)("mother-vessels/:id"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "deleteMotherVesselSof", null);
__decorate([
    (0, common_1.Get)("mother-vessels/:id/events"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, list_mother_vessel_sofs_query_dto_1.ListMotherVesselSofsQueryDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "listSofEvents", null);
__decorate([
    (0, common_1.Post)("mother-vessels/:id/events"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_sof_event_dto_1.CreateSofEventDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "createSofEvent", null);
__decorate([
    (0, common_1.Get)("lighter-vessels"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_lighter_vessel_sofs_query_dto_1.ListLighterVesselSofsQueryDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "listLighterVesselSofs", null);
__decorate([
    (0, common_1.Post)("lighter-vessels"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lighter_vessel_sof_dto_1.CreateLighterVesselSofDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "createLighterVesselSof", null);
__decorate([
    (0, common_1.Get)("lighter-vessels/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "getLighterVesselSof", null);
__decorate([
    (0, common_1.Patch)("lighter-vessels/:id"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lighter_vessel_sof_dto_1.UpdateLighterVesselSofDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "updateLighterVesselSof", null);
__decorate([
    (0, common_1.Delete)("lighter-vessels/:id"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "deleteLighterVesselSof", null);
__decorate([
    (0, common_1.Get)("lighter-vessels/:id/events"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, list_mother_vessel_sofs_query_dto_1.ListMotherVesselSofsQueryDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "listLighterSofEvents", null);
__decorate([
    (0, common_1.Post)("lighter-vessels/:id/events"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_sof_event_dto_1.CreateSofEventDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "createLighterSofEvent", null);
__decorate([
    (0, common_1.Patch)("events/:eventId"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("eventId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_sof_event_dto_1.UpdateSofEventDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "updateSofEvent", null);
__decorate([
    (0, common_1.Delete)("events/:eventId"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("eventId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "deleteSofEvent", null);
__decorate([
    (0, common_1.Get)("mother-vessels/:id/daily-discharges"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "listDailyDischarges", null);
__decorate([
    (0, common_1.Post)("mother-vessels/:id/daily-discharges"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_mother_vessel_daily_discharge_dto_1.CreateMotherVesselDailyDischargeDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "createDailyDischarge", null);
__decorate([
    (0, common_1.Patch)("daily-discharges/:dischargeId"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("dischargeId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_mother_vessel_daily_discharge_dto_1.UpdateMotherVesselDailyDischargeDto]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "updateDailyDischarge", null);
__decorate([
    (0, common_1.Delete)("daily-discharges/:dischargeId"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("dischargeId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "deleteDailyDischarge", null);
__decorate([
    (0, common_1.Post)("mother-vessels/:id/laytime/recalculate"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "recalculateMotherLaytime", null);
__decorate([
    (0, common_1.Post)("lighter-vessels/:id/laytime/recalculate"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SofController.prototype, "recalculateLighterLaytime", null);
exports.SofController = SofController = __decorate([
    (0, common_1.Controller)("sof"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_VIEWER_ROLES),
    __metadata("design:paramtypes", [sof_service_1.SofService])
], SofController);
//# sourceMappingURL=sof.controller.js.map