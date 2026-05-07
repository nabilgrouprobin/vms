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
import { CreateMasterLocationDto } from "./dto/create-master-location.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterLocationDto } from "./dto/update-master-location.dto";
import { MasterLocationsService } from "./master-locations.service";

@Controller("master-data/locations")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MASTER_DATA_VIEWER_ROLES)
export class MasterLocationsController {
  constructor(private readonly locations: MasterLocationsService) {}

  @Get("options")
  listOptions() {
    return this.locations.listOptions();
  }

  @Get()
  list(@Query() query: ListMasterReferenceQueryDto) {
    return this.locations.list(query);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.locations.getById(id);
    if (!row) {
      throw new NotFoundException("Location was not found");
    }
    return row;
  }

  @Post()
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  create(@Body() dto: CreateMasterLocationDto) {
    return this.locations.create(dto);
  }

  @Patch(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  patch(@Param("id") id: string, @Body() dto: UpdateMasterLocationDto) {
    return this.locations.update(id, dto);
  }

  @Delete(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  remove(@Param("id") id: string) {
    return this.locations.softDelete(id);
  }
}
