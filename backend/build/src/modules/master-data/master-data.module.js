"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterDataModule = void 0;
const common_1 = require("@nestjs/common");
const lighter_vessels_controller_1 = require("./lighter-vessels.controller");
const master_app_roles_controller_1 = require("./master-app-roles.controller");
const master_ghats_controller_1 = require("./master-ghats.controller");
const master_ghats_service_1 = require("./master-ghats.service");
const master_organization_types_controller_1 = require("./master-organization-types.controller");
const master_organization_types_service_1 = require("./master-organization-types.service");
const master_organizations_controller_1 = require("./master-organizations.controller");
const master_organizations_service_1 = require("./master-organizations.service");
const master_locations_controller_1 = require("./master-locations.controller");
const master_locations_service_1 = require("./master-locations.service");
const master_products_controller_1 = require("./master-products.controller");
const master_products_service_1 = require("./master-products.service");
const master_sof_event_types_controller_1 = require("./master-sof-event-types.controller");
const master_sof_event_types_service_1 = require("./master-sof-event-types.service");
const master_users_controller_1 = require("./master-users.controller");
const master_users_service_1 = require("./master-users.service");
const master_vessels_service_1 = require("./master-vessels.service");
const mother_vessels_controller_1 = require("./mother-vessels.controller");
let MasterDataModule = class MasterDataModule {
};
exports.MasterDataModule = MasterDataModule;
exports.MasterDataModule = MasterDataModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [
            mother_vessels_controller_1.MotherVesselsController,
            lighter_vessels_controller_1.LighterVesselsController,
            master_products_controller_1.MasterProductsController,
            master_locations_controller_1.MasterLocationsController,
            master_ghats_controller_1.MasterGhatsController,
            master_organizations_controller_1.MasterOrganizationsController,
            master_organization_types_controller_1.MasterOrganizationTypesController,
            master_sof_event_types_controller_1.MasterSofEventTypesController,
            master_users_controller_1.MasterUsersController,
            master_app_roles_controller_1.MasterAppRolesController
        ],
        providers: [
            master_vessels_service_1.MasterVesselsService,
            master_products_service_1.MasterProductsService,
            master_locations_service_1.MasterLocationsService,
            master_ghats_service_1.MasterGhatsService,
            master_organizations_service_1.MasterOrganizationsService,
            master_organization_types_service_1.MasterOrganizationTypesService,
            master_sof_event_types_service_1.MasterSofEventTypesService,
            master_users_service_1.MasterUsersService
        ]
    })
], MasterDataModule);
//# sourceMappingURL=master-data.module.js.map