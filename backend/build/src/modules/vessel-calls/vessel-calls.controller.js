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
exports.VesselCallsController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const sof_roles_1 = require("../sof/constants/sof-roles");
const list_vessel_calls_query_dto_1 = require("./dto/list-vessel-calls.query.dto");
const patch_vessel_call_dto_1 = require("./dto/patch-vessel-call.dto");
const vessel_calls_service_1 = require("./vessel-calls.service");
let VesselCallsController = class VesselCallsController {
    vesselCallsService;
    constructor(vesselCallsService) {
        this.vesselCallsService = vesselCallsService;
    }
    list(query) {
        return this.vesselCallsService.list(query);
    }
    async getOne(id) {
        const row = await this.vesselCallsService.getById(id);
        if (!row) {
            throw new common_1.NotFoundException("Vessel call was not found");
        }
        return row;
    }
    patch(id, dto) {
        return this.vesselCallsService.patch(id, dto);
    }
};
exports.VesselCallsController = VesselCallsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_vessel_calls_query_dto_1.ListVesselCallsQueryDto]),
    __metadata("design:returntype", void 0)
], VesselCallsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VesselCallsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_vessel_call_dto_1.PatchVesselCallDto]),
    __metadata("design:returntype", void 0)
], VesselCallsController.prototype, "patch", null);
exports.VesselCallsController = VesselCallsController = __decorate([
    (0, common_1.Controller)("vessel-calls"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_VIEWER_ROLES),
    __metadata("design:paramtypes", [vessel_calls_service_1.VesselCallsService])
], VesselCallsController);
//# sourceMappingURL=vessel-calls.controller.js.map