import { Controller, UseGuards } from "@nestjs/common";

import { Roles } from "../../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { MASTER_DATA_VIEWER_ROLES } from "./constants/master-data-roles";
import { MasterVesselsService, type MasterVesselKind } from "./master-vessels.service";
import { MasterVesselsControllerBase } from "./vessels-controller-base";

@Controller("master-data/mother-vessels")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MASTER_DATA_VIEWER_ROLES)
export class MotherVesselsController extends MasterVesselsControllerBase {
  constructor(masterVessels: MasterVesselsService) {
    super(masterVessels);
  }

  protected vesselKind(): MasterVesselKind {
    return "mother";
  }

  protected notFoundLabel(): string {
    return "Mother vessel";
  }
}
