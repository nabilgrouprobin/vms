import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";

import { Roles } from "../../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { MASTER_DATA_EDITOR_ROLES, MASTER_DATA_VIEWER_ROLES } from "./constants/master-data-roles";
import { CreateMasterOrganizationDto } from "./dto/create-master-organization.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterOrganizationDto } from "./dto/update-master-organization.dto";
import { MasterOrganizationsService } from "./master-organizations.service";

@Controller("master-data/organizations")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MASTER_DATA_VIEWER_ROLES)
export class MasterOrganizationsController {
  constructor(private readonly organizations: MasterOrganizationsService) {}

  @Get("options")
  listOptions() {
    return this.organizations.listOptions();
  }

  @Get()
  list(@Query() query: ListMasterReferenceQueryDto) {
    return this.organizations.list(query);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.organizations.getById(id);
    if (!row) {
      throw new NotFoundException("Organization was not found");
    }
    return row;
  }

  @Post()
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  create(@Body() dto: CreateMasterOrganizationDto) {
    return this.organizations.create(dto);
  }

  @Patch(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  patch(@Param("id") id: string, @Body() dto: UpdateMasterOrganizationDto) {
    return this.organizations.update(id, dto);
  }

  @Delete(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  remove(@Param("id") id: string) {
    return this.organizations.softDelete(id);
  }
}
