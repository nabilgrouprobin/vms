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
exports.MasterOrganizationTypesController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const master_data_roles_1 = require("./constants/master-data-roles");
const create_master_organization_type_dto_1 = require("./dto/create-master-organization-type.dto");
const list_master_reference_query_dto_1 = require("./dto/list-master-reference.query.dto");
const update_master_organization_type_dto_1 = require("./dto/update-master-organization-type.dto");
const master_organization_types_service_1 = require("./master-organization-types.service");
let MasterOrganizationTypesController = class MasterOrganizationTypesController {
    types;
    constructor(types) {
        this.types = types;
    }
    listOptions() {
        return this.types.listOptions();
    }
    list(query) {
        return this.types.list(query);
    }
    async getOne(id) {
        const row = await this.types.getById(id);
        if (!row) {
            throw new common_1.NotFoundException("Organization type was not found");
        }
        return row;
    }
    create(dto) {
        return this.types.create(dto);
    }
    patch(id, dto) {
        return this.types.update(id, dto);
    }
    remove(id) {
        return this.types.softDelete(id);
    }
};
exports.MasterOrganizationTypesController = MasterOrganizationTypesController;
__decorate([
    (0, common_1.Get)("options"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MasterOrganizationTypesController.prototype, "listOptions", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_master_reference_query_dto_1.ListMasterReferenceQueryDto]),
    __metadata("design:returntype", void 0)
], MasterOrganizationTypesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MasterOrganizationTypesController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_master_organization_type_dto_1.CreateMasterOrganizationTypeDto]),
    __metadata("design:returntype", void 0)
], MasterOrganizationTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_master_organization_type_dto_1.UpdateMasterOrganizationTypeDto]),
    __metadata("design:returntype", void 0)
], MasterOrganizationTypesController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MasterOrganizationTypesController.prototype, "remove", null);
exports.MasterOrganizationTypesController = MasterOrganizationTypesController = __decorate([
    (0, common_1.Controller)("master-data/organization-types"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_VIEWER_ROLES),
    __metadata("design:paramtypes", [master_organization_types_service_1.MasterOrganizationTypesService])
], MasterOrganizationTypesController);
//# sourceMappingURL=master-organization-types.controller.js.map