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
import { CreateMasterProductDto } from "./dto/create-master-product.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterProductDto } from "./dto/update-master-product.dto";
import { MasterProductsService } from "./master-products.service";

@Controller("master-data/products")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MASTER_DATA_VIEWER_ROLES)
export class MasterProductsController {
  constructor(private readonly products: MasterProductsService) {}

  @Get()
  list(@Query() query: ListMasterReferenceQueryDto) {
    return this.products.list(query);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.products.getById(id);
    if (!row) {
      throw new NotFoundException("Product was not found");
    }
    return row;
  }

  @Post()
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  create(@Body() dto: CreateMasterProductDto) {
    return this.products.create(dto);
  }

  @Patch(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  patch(@Param("id") id: string, @Body() dto: UpdateMasterProductDto) {
    return this.products.update(id, dto);
  }

  @Post(":id/purge")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  purge(@Param("id") id: string) {
    return this.products.hardDelete(id);
  }

  @Delete(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  remove(@Param("id") id: string) {
    return this.products.softDelete(id);
  }
}
