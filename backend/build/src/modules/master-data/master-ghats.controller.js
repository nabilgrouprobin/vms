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
exports.MasterGhatsController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const master_data_roles_1 = require("./constants/master-data-roles");
const create_master_ghat_dto_1 = require("./dto/create-master-ghat.dto");
const list_master_reference_query_dto_1 = require("./dto/list-master-reference.query.dto");
const update_master_ghat_dto_1 = require("./dto/update-master-ghat.dto");
const master_ghats_service_1 = require("./master-ghats.service");
let MasterGhatsController = class MasterGhatsController {
    ghats;
    constructor(ghats) {
        this.ghats = ghats;
    }
    list(query) {
        return this.ghats.list(query);
    }
    async getOne(id) {
        const row = await this.ghats.getById(id);
        if (!row) {
            throw new common_1.NotFoundException("Ghat was not found");
        }
        return row;
    }
    create(dto) {
        return this.ghats.create(dto);
    }
    patch(id, dto) {
        return this.ghats.update(id, dto);
    }
    remove(id) {
        return this.ghats.softDelete(id);
    }
};
exports.MasterGhatsController = MasterGhatsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_master_reference_query_dto_1.ListMasterReferenceQueryDto]),
    __metadata("design:returntype", void 0)
], MasterGhatsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MasterGhatsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_master_ghat_dto_1.CreateMasterGhatDto]),
    __metadata("design:returntype", void 0)
], MasterGhatsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_master_ghat_dto_1.UpdateMasterGhatDto]),
    __metadata("design:returntype", void 0)
], MasterGhatsController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MasterGhatsController.prototype, "remove", null);
exports.MasterGhatsController = MasterGhatsController = __decorate([
    (0, common_1.Controller)("master-data/ghats"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_VIEWER_ROLES),
    __metadata("design:paramtypes", [master_ghats_service_1.MasterGhatsService])
], MasterGhatsController);
//# sourceMappingURL=master-ghats.controller.js.map