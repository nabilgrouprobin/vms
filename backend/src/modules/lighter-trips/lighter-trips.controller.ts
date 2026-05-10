import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from "@nestjs/common";

import { CurrentUserId } from "../../auth/decorators/current-user-id.decorator";
import { Roles } from "../../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { SofService } from "../sof/sof.service";
import {
  LIGHTER_TRIP_EDITOR_ROLES,
  LIGHTER_TRIP_VIEWER_ROLES
} from "./constants/lighter-trip-roles";
import { CreateLighterTripDto } from "./dto/create-lighter-trip.dto";
import { ListLighterTripsQueryDto } from "./dto/list-lighter-trips.query.dto";
import { UpdateLighterTripDto } from "./dto/update-lighter-trip.dto";
import { LighterTripsService } from "./lighter-trips.service";

@Controller("lighter-trips")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...LIGHTER_TRIP_VIEWER_ROLES)
export class LighterTripsController {
  constructor(
    private readonly lighterTripsService: LighterTripsService,
    private readonly sofService: SofService
  ) {}

  @Get()
  list(@Query() query: ListLighterTripsQueryDto) {
    return this.lighterTripsService.list(query);
  }

  @Get("discharge-metrics-by-calls")
  dischargeMetricsByCalls(@Query("vesselCallIds") vesselCallIds: string) {
    return this.lighterTripsService.dischargeMetricsForVesselCallIds(vesselCallIds);
  }

  @Get("vessel-calls/:vesselCallId/open-assignments")
  openAssignments(@Param("vesselCallId") vesselCallId: string) {
    return this.lighterTripsService.listOpenAssignmentsForVesselCall(vesselCallId);
  }

  @Get("meta/lighter-vessels")
  lighterVessels(
    @Query("search") search?: string,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("id") id?: string,
    @Query("includeInactive") includeInactive?: string
  ) {
    return this.lighterTripsService.listLighterVesselsForPicker(
      search,
      limit,
      id,
      cursor,
      includeInactive
    );
  }

  @Post()
  @Roles(...LIGHTER_TRIP_EDITOR_ROLES)
  create(@Body() dto: CreateLighterTripDto, @CurrentUserId() userId: string) {
    return this.lighterTripsService.create(dto, userId);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.lighterTripsService.getById(id);
  }

  @Patch(":id")
  @Roles(...LIGHTER_TRIP_EDITOR_ROLES)
  update(@Param("id") id: string, @Body() dto: UpdateLighterTripDto) {
    return this.lighterTripsService.update(id, dto);
  }

  /** Approve the lighter SOF for this trip (SOF must be VERIFIED, etc.). */
  @Post(":id/approve-lighter-sof")
  @Roles(...LIGHTER_TRIP_EDITOR_ROLES)
  approveLighterSof(@Param("id") id: string, @CurrentUserId() userId: string) {
    return this.sofService.approveLighterVesselSofForTrip(id, userId);
  }
}
