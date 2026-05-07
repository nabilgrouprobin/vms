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
exports.MasterUsersController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const master_data_roles_1 = require("./constants/master-data-roles");
const batch_user_role_assignments_dto_1 = require("./dto/batch-user-role-assignments.dto");
const create_master_user_dto_1 = require("./dto/create-master-user.dto");
const create_user_role_assignment_dto_1 = require("./dto/create-user-role-assignment.dto");
const list_master_users_query_dto_1 = require("./dto/list-master-users.query.dto");
const update_master_user_dto_1 = require("./dto/update-master-user.dto");
const master_users_service_1 = require("./master-users.service");
let MasterUsersController = class MasterUsersController {
    users;
    constructor(users) {
        this.users = users;
    }
    list(query) {
        return this.users.list(query);
    }
    listRoles(id) {
        return this.users.listRoleAssignments(id);
    }
    async getOne(id) {
        const row = await this.users.getById(id);
        if (!row) {
            throw new common_1.NotFoundException("User was not found");
        }
        return row;
    }
    create(dto) {
        return this.users.create(dto);
    }
    patch(id, dto) {
        return this.users.update(id, dto);
    }
    remove(id) {
        return this.users.softDelete(id);
    }
    addRolesBatch(id, dto, req) {
        const grantor = req.user?.userId;
        if (!grantor) {
            throw new common_1.UnauthorizedException();
        }
        return this.users.addRoleAssignmentsBatch(id, dto, grantor);
    }
    addRole(id, dto, req) {
        const grantor = req.user?.userId;
        if (!grantor) {
            throw new common_1.UnauthorizedException();
        }
        return this.users.addRoleAssignment(id, dto, grantor);
    }
    removeRole(id, assignmentId) {
        return this.users.removeRoleAssignment(id, assignmentId);
    }
};
exports.MasterUsersController = MasterUsersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_master_users_query_dto_1.ListMasterUsersQueryDto]),
    __metadata("design:returntype", void 0)
], MasterUsersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id/roles"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MasterUsersController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MasterUsersController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_master_user_dto_1.CreateMasterUserDto]),
    __metadata("design:returntype", void 0)
], MasterUsersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_master_user_dto_1.UpdateMasterUserDto]),
    __metadata("design:returntype", void 0)
], MasterUsersController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MasterUsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/roles/batch"),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, batch_user_role_assignments_dto_1.BatchUserRoleAssignmentsDto, Object]),
    __metadata("design:returntype", void 0)
], MasterUsersController.prototype, "addRolesBatch", null);
__decorate([
    (0, common_1.Post)(":id/roles"),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_user_role_assignment_dto_1.CreateUserRoleAssignmentDto, Object]),
    __metadata("design:returntype", void 0)
], MasterUsersController.prototype, "addRole", null);
__decorate([
    (0, common_1.Delete)(":id/roles/:assignmentId"),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("assignmentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MasterUsersController.prototype, "removeRole", null);
exports.MasterUsersController = MasterUsersController = __decorate([
    (0, common_1.Controller)("master-data/users"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(...master_data_roles_1.MASTER_DATA_VIEWER_ROLES),
    __metadata("design:paramtypes", [master_users_service_1.MasterUsersService])
], MasterUsersController);
//# sourceMappingURL=master-users.controller.js.map