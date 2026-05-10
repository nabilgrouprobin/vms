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
import { CreateMasterSofEventTypeDto } from "./dto/create-master-sof-event-type.dto";
import { ListMasterSofEventTypesMasterQueryDto } from "./dto/list-master-sof-event-types-master.query.dto";
import { ListSofEventTypesQueryDto } from "./dto/list-sof-event-types.query.dto";
import { UpdateMasterSofEventTypeDto } from "./dto/update-master-sof-event-type.dto";
import { MasterSofEventTypesService } from "./master-sof-event-types.service";

@Controller("master-data/sof-event-types")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MASTER_DATA_VIEWER_ROLES)
export class MasterSofEventTypesController {
  constructor(private readonly types: MasterSofEventTypesService) {}

  /** For SOF event forms (mother vs lighter). */
  @Get("options")
  listOptions(@Query() query: ListSofEventTypesQueryDto) {
    const scope = query.forSofScope ?? "MOTHER_VESSEL";
    return this.types.listOptions(scope);
  }

  @Get()
  list(@Query() query: ListMasterSofEventTypesMasterQueryDto) {
    return this.types.list(query);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.types.getById(id);
    if (!row) {
      throw new NotFoundException("SOF event type was not found");
    }
    return row;
  }

  @Post()
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  create(@Body() dto: CreateMasterSofEventTypeDto) {
    return this.types.create(dto);
  }

  @Patch(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  patch(@Param("id") id: string, @Body() dto: UpdateMasterSofEventTypeDto) {
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
