import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards
} from "@nestjs/common";

import { Roles } from "../../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { SOF_EDITOR_ROLES, SOF_VIEWER_ROLES } from "../sof/constants/sof-roles";
import { ListVesselCallsQueryDto } from "./dto/list-vessel-calls.query.dto";
import { PatchVesselCallDto } from "./dto/patch-vessel-call.dto";
import { VesselCallsService } from "./vessel-calls.service";

@Controller("vessel-calls")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SOF_VIEWER_ROLES)
export class VesselCallsController {
  constructor(private readonly vesselCallsService: VesselCallsService) {}

  @Get()
  list(@Query() query: ListVesselCallsQueryDto) {
    return this.vesselCallsService.list(query);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.vesselCallsService.getById(id);
    if (!row) {
      throw new NotFoundException("Vessel call was not found");
    }
    return row;
  }

  @Patch(":id")
  @Roles(...SOF_EDITOR_ROLES)
  patch(@Param("id") id: string, @Body() dto: PatchVesselCallDto) {
    return this.vesselCallsService.patch(id, dto);
  }
}
