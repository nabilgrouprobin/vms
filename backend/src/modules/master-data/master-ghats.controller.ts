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
import { CreateMasterGhatDto } from "./dto/create-master-ghat.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterGhatDto } from "./dto/update-master-ghat.dto";
import { MasterGhatsService } from "./master-ghats.service";

@Controller("master-data/ghats")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MASTER_DATA_VIEWER_ROLES)
export class MasterGhatsController {
  constructor(private readonly ghats: MasterGhatsService) {}

  @Get()
  list(@Query() query: ListMasterReferenceQueryDto) {
    return this.ghats.list(query);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.ghats.getById(id);
    if (!row) {
      throw new NotFoundException("Ghat was not found");
    }
    return row;
  }

  @Post()
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  create(@Body() dto: CreateMasterGhatDto) {
    return this.ghats.create(dto);
  }

  @Patch(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  patch(@Param("id") id: string, @Body() dto: UpdateMasterGhatDto) {
    return this.ghats.update(id, dto);
  }

  @Delete(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  remove(@Param("id") id: string) {
    return this.ghats.softDelete(id);
  }
}
