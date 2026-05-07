import { Controller, Get, UseGuards } from "@nestjs/common";
import { AppRole } from "@prisma/client";

import { Roles } from "../../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { MASTER_DATA_VIEWER_ROLES } from "./constants/master-data-roles";

@Controller("master-data/app-roles")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MASTER_DATA_VIEWER_ROLES)
export class MasterAppRolesController {
  @Get()
  list() {
    return Object.values(AppRole);
  }
}
