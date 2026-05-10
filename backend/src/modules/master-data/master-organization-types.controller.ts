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
import { CreateMasterOrganizationTypeDto } from "./dto/create-master-organization-type.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterOrganizationTypeDto } from "./dto/update-master-organization-type.dto";
import { MasterOrganizationTypesService } from "./master-organization-types.service";

@Controller("master-data/organization-types")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MASTER_DATA_VIEWER_ROLES)
export class MasterOrganizationTypesController {
  constructor(private readonly types: MasterOrganizationTypesService) {}

  @Get("options")
  listOptions() {
    return this.types.listOptions();
  }

  @Get()
  list(@Query() query: ListMasterReferenceQueryDto) {
    return this.types.list(query);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.types.getById(id);
    if (!row) {
      throw new NotFoundException("Organization type was not found");
    }
    return row;
  }

  @Post()
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  create(@Body() dto: CreateMasterOrganizationTypeDto) {
    return this.types.create(dto);
  }

  @Patch(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  patch(@Param("id") id: string, @Body() dto: UpdateMasterOrganizationTypeDto) {
    return this.types.update(id, dto);
  }

  @Post(":id/purge")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  purge(@Param("id") id: string) {
    return this.types.hardDelete(id);
  }

  @Delete(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  remove(@Param("id") id: string) {
    return this.types.softDelete(id);
  }
}
