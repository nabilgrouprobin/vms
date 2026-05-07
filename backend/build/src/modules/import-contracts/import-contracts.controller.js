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
exports.ImportContractsController = void 0;
const common_1 = require("@nestjs/common");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const sof_roles_1 = require("../sof/constants/sof-roles");
const update_import_contract_dto_1 = require("./dto/update-import-contract.dto");
const import_contracts_service_1 = require("./import-contracts.service");
let ImportContractsController = class ImportContractsController {
    importContractsService;
    constructor(importContractsService) {
        this.importContractsService = importContractsService;
    }
    getOne(id) {
        return this.importContractsService.getById(id);
    }
    update(id, dto) {
        return this.importContractsService.update(id, dto);
    }
};
exports.ImportContractsController = ImportContractsController;
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ImportContractsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_EDITOR_ROLES),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_import_contract_dto_1.UpdateImportContractDto]),
    __metadata("design:returntype", void 0)
], ImportContractsController.prototype, "update", null);
exports.ImportContractsController = ImportContractsController = __decorate([
    (0, common_1.Controller)("import-contracts"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(...sof_roles_1.SOF_VIEWER_ROLES),
    __metadata("design:paramtypes", [import_contracts_service_1.ImportContractsService])
], ImportContractsController);
//# sourceMappingURL=import-contracts.controller.js.map