import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";
import { SOFScope } from "@prisma/client";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { SOF_EDITOR_ROLES, SOF_VIEWER_ROLES } from "./constants/sof-roles";
import { CreateLighterVesselSofDto } from "./dto/create-lighter-vessel-sof.dto";
import { CreateMotherVesselDailyDischargeDto } from "./dto/create-mother-vessel-daily-discharge.dto";
import { CreateMotherVesselSofDto } from "./dto/create-mother-vessel-sof.dto";
import { CreateSofEventDto } from "./dto/create-sof-event.dto";
import { ListLighterVesselSofsQueryDto } from "./dto/list-lighter-vessel-sofs.query.dto";
import { ListMotherVesselSofsQueryDto } from "./dto/list-mother-vessel-sofs.query.dto";
import { UpdateLighterVesselSofDto } from "./dto/update-lighter-vessel-sof.dto";
import { UpdateMotherVesselDailyDischargeDto } from "./dto/update-mother-vessel-daily-discharge.dto";
import { UpdateMotherVesselSofDto } from "./dto/update-mother-vessel-sof.dto";
import { UpdateSofEventDto } from "./dto/update-sof-event.dto";
import { SofService } from "./sof.service";

@Controller("sof")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SOF_VIEWER_ROLES)
export class SofController {
  constructor(private readonly sofService: SofService) {}

  @Get("options")
  getSofOptions() {
    return this.sofService.getSofOptions();
  }

  @Get("mother-vessels")
  listMotherVesselSofs(@Query() query: ListMotherVesselSofsQueryDto) {
    return this.sofService.listMotherVesselSofs(query);
  }

  @Post("mother-vessels")
  @Roles(...SOF_EDITOR_ROLES)
  createMotherVesselSof(@Body() dto: CreateMotherVesselSofDto) {
    return this.sofService.createMotherVesselSof(dto);
  }

  @Get("mother-vessels/:id")
  getMotherVesselSof(@Param("id") id: string) {
    return this.sofService.getMotherVesselSof(id);
  }

  @Patch("mother-vessels/:id")
  @Roles(...SOF_EDITOR_ROLES)
  updateMotherVesselSof(@Param("id") id: string, @Body() dto: UpdateMotherVesselSofDto) {
    return this.sofService.updateMotherVesselSof(id, dto);
  }

  @Delete("mother-vessels/:id")
  @Roles(...SOF_EDITOR_ROLES)
  deleteMotherVesselSof(@Param("id") id: string) {
    return this.sofService.deleteMotherVesselSof(id);
  }

  @Get("mother-vessels/:id/events")
  listSofEvents(@Param("id") id: string, @Query() query: ListMotherVesselSofsQueryDto) {
    return this.sofService.listSofEvents(id, query, SOFScope.MOTHER_VESSEL);
  }

  @Post("mother-vessels/:id/events")
  @Roles(...SOF_EDITOR_ROLES)
  createSofEvent(@Param("id") id: string, @Body() dto: CreateSofEventDto) {
    return this.sofService.createSofEvent(id, dto, SOFScope.MOTHER_VESSEL);
  }

  @Get("lighter-vessels")
  listLighterVesselSofs(@Query() query: ListLighterVesselSofsQueryDto) {
    return this.sofService.listLighterVesselSofs(query);
  }

  @Post("lighter-vessels")
  @Roles(...SOF_EDITOR_ROLES)
  createLighterVesselSof(@Body() dto: CreateLighterVesselSofDto) {
    return this.sofService.createLighterVesselSof(dto);
  }

  @Get("lighter-vessels/:id")
  getLighterVesselSof(@Param("id") id: string) {
    return this.sofService.getLighterVesselSof(id);
  }

  @Patch("lighter-vessels/:id")
  @Roles(...SOF_EDITOR_ROLES)
  updateLighterVesselSof(@Param("id") id: string, @Body() dto: UpdateLighterVesselSofDto) {
    return this.sofService.updateLighterVesselSof(id, dto);
  }

  @Delete("lighter-vessels/:id")
  @Roles(...SOF_EDITOR_ROLES)
  deleteLighterVesselSof(@Param("id") id: string) {
    return this.sofService.deleteLighterVesselSof(id);
  }

  @Get("lighter-vessels/:id/events")
  listLighterSofEvents(@Param("id") id: string, @Query() query: ListMotherVesselSofsQueryDto) {
    return this.sofService.listSofEvents(id, query, SOFScope.LIGHTER_VESSEL);
  }

  @Post("lighter-vessels/:id/events")
  @Roles(...SOF_EDITOR_ROLES)
  createLighterSofEvent(@Param("id") id: string, @Body() dto: CreateSofEventDto) {
    return this.sofService.createSofEvent(id, dto, SOFScope.LIGHTER_VESSEL);
  }

  @Patch("events/:eventId")
  @Roles(...SOF_EDITOR_ROLES)
  updateSofEvent(@Param("eventId") eventId: string, @Body() dto: UpdateSofEventDto) {
    return this.sofService.updateSofEvent(eventId, dto);
  }

  @Delete("events/:eventId")
  @Roles(...SOF_EDITOR_ROLES)
  deleteSofEvent(@Param("eventId") eventId: string) {
    return this.sofService.deleteSofEvent(eventId);
  }

  @Get("mother-vessels/:id/daily-discharges")
  listDailyDischarges(@Param("id") id: string) {
    return this.sofService.listDailyDischarges(id);
  }

  @Post("mother-vessels/:id/daily-discharges")
  @Roles(...SOF_EDITOR_ROLES)
  createDailyDischarge(@Param("id") id: string, @Body() dto: CreateMotherVesselDailyDischargeDto) {
    return this.sofService.createDailyDischarge(id, dto);
  }

  @Patch("daily-discharges/:dischargeId")
  @Roles(...SOF_EDITOR_ROLES)
  updateDailyDischarge(
    @Param("dischargeId") dischargeId: string,
    @Body() dto: UpdateMotherVesselDailyDischargeDto
  ) {
    return this.sofService.updateDailyDischarge(dischargeId, dto);
  }

  @Delete("daily-discharges/:dischargeId")
  @Roles(...SOF_EDITOR_ROLES)
  deleteDailyDischarge(@Param("dischargeId") dischargeId: string) {
    return this.sofService.deleteDailyDischarge(dischargeId);
  }

  @Post("mother-vessels/:id/laytime/recalculate")
  @Roles(...SOF_EDITOR_ROLES)
  recalculateMotherLaytime(@Param("id") id: string) {
    return this.sofService.recalculateMotherLaytime(id);
  }

  @Post("lighter-vessels/:id/laytime/recalculate")
  @Roles(...SOF_EDITOR_ROLES)
  recalculateLighterLaytime(@Param("id") id: string) {
    return this.sofService.recalculateLighterLaytime(id);
  }
}
