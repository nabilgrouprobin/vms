import {
  Body,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query
} from "@nestjs/common";

import { Roles } from "../../auth/decorators/roles.decorator";
import { MASTER_DATA_EDITOR_ROLES } from "./constants/master-data-roles";
import { CreateMasterVesselDto } from "./dto/create-master-vessel.dto";
import { ListMasterVesselsQueryDto } from "./dto/list-master-vessels.query.dto";
import { UpdateMasterVesselDto } from "./dto/update-master-vessel.dto";
import { MasterVesselsService, type MasterVesselKind } from "./master-vessels.service";

/**
 * Shared CRUD body for the mother + lighter vessel controllers. Each concrete
 * controller in `mother-vessels.controller.ts` / `lighter-vessels.controller.ts`
 * extends this class and only differs by:
 *
 *   - `@Controller("master-data/{kind}-vessels")` URL prefix
 *   - `kind` ("mother" | "lighter") returned by `vesselKind()`
 *   - human-readable noun used in the 404 message
 *
 * Keeps the route surface identical between the two flavours while making
 * sure the underlying service code lives in exactly one place.
 */
export abstract class MasterVesselsControllerBase {
  protected constructor(protected readonly masterVessels: MasterVesselsService) {}

  protected abstract vesselKind(): MasterVesselKind;
  protected abstract notFoundLabel(): string;

  @Get()
  list(@Query() query: ListMasterVesselsQueryDto) {
    return this.masterVessels.list(this.vesselKind(), query);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.masterVessels.getById(this.vesselKind(), id);
    if (!row) {
      throw new NotFoundException(`${this.notFoundLabel()} was not found`);
    }
    return row;
  }

  @Post()
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  create(@Body() dto: CreateMasterVesselDto) {
    return this.masterVessels.create(this.vesselKind(), dto);
  }

  @Patch(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  patch(@Param("id") id: string, @Body() dto: UpdateMasterVesselDto) {
    return this.masterVessels.update(this.vesselKind(), id, dto);
  }

  @Post(":id/purge")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  purge(@Param("id") id: string) {
    return this.masterVessels.hardDelete(this.vesselKind(), id);
  }

  @Delete(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  remove(@Param("id") id: string) {
    return this.masterVessels.softDelete(this.vesselKind(), id);
  }
}
