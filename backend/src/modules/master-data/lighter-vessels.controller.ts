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
import { CreateMasterVesselDto } from "./dto/create-master-vessel.dto";
import { ListMasterVesselsQueryDto } from "./dto/list-master-vessels.query.dto";
import { UpdateMasterVesselDto } from "./dto/update-master-vessel.dto";
import { MasterVesselsService } from "./master-vessels.service";

@Controller("master-data/lighter-vessels")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MASTER_DATA_VIEWER_ROLES)
export class LighterVesselsController {
  constructor(private readonly masterVessels: MasterVesselsService) {}

  @Get()
  list(@Query() query: ListMasterVesselsQueryDto) {
    return this.masterVessels.list("lighter", query);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.masterVessels.getById("lighter", id);
    if (!row) {
      throw new NotFoundException("Lighter vessel was not found");
    }
    return row;
  }

  @Post()
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  create(@Body() dto: CreateMasterVesselDto) {
    return this.masterVessels.create("lighter", dto);
  }

  @Patch(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  patch(@Param("id") id: string, @Body() dto: UpdateMasterVesselDto) {
    return this.masterVessels.update("lighter", id, dto);
  }

  @Delete(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  remove(@Param("id") id: string) {
    return this.masterVessels.softDelete("lighter", id);
  }
}
