import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";

import { Roles } from "../../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { SOF_EDITOR_ROLES, SOF_VIEWER_ROLES } from "../sof/constants/sof-roles";
import { UpdateImportContractDto } from "./dto/update-import-contract.dto";
import { ImportContractsService } from "./import-contracts.service";

@Controller("import-contracts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...SOF_VIEWER_ROLES)
export class ImportContractsController {
  constructor(private readonly importContractsService: ImportContractsService) {}

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.importContractsService.getById(id);
  }

  @Patch(":id")
  @Roles(...SOF_EDITOR_ROLES)
  update(@Param("id") id: string, @Body() dto: UpdateImportContractDto) {
    return this.importContractsService.update(id, dto);
  }
}
