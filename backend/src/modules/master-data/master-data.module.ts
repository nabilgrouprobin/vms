import { Module } from "@nestjs/common";

import { LighterVesselsController } from "./lighter-vessels.controller";
import { MasterAppRolesController } from "./master-app-roles.controller";
import { MasterGhatsController } from "./master-ghats.controller";
import { MasterGhatsService } from "./master-ghats.service";
import { MasterOrganizationTypesController } from "./master-organization-types.controller";
import { MasterOrganizationTypesService } from "./master-organization-types.service";
import { MasterOrganizationsController } from "./master-organizations.controller";
import { MasterOrganizationsService } from "./master-organizations.service";
import { MasterLocationsController } from "./master-locations.controller";
import { MasterLocationsService } from "./master-locations.service";
import { MasterProductsController } from "./master-products.controller";
import { MasterProductsService } from "./master-products.service";
import { MasterSofEventTypesController } from "./master-sof-event-types.controller";
import { MasterSofEventTypesService } from "./master-sof-event-types.service";
import { MasterUsersController } from "./master-users.controller";
import { MasterUsersService } from "./master-users.service";
import { MasterVesselsService } from "./master-vessels.service";
import { MotherVesselsController } from "./mother-vessels.controller";

@Module({
  imports: [],
  controllers: [
    MotherVesselsController,
    LighterVesselsController,
    MasterProductsController,
    MasterLocationsController,
    MasterGhatsController,
    MasterOrganizationsController,
    MasterOrganizationTypesController,
    MasterSofEventTypesController,
    MasterUsersController,
    MasterAppRolesController
  ],
  providers: [
    MasterVesselsService,
    MasterProductsService,
    MasterLocationsService,
    MasterGhatsService,
    MasterOrganizationsService,
    MasterOrganizationTypesService,
    MasterSofEventTypesService,
    MasterUsersService
  ]
})
export class MasterDataModule {}
