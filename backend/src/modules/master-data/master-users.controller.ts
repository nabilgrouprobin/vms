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
  Req,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import type { Request } from "express";

import { Roles } from "../../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import type { AuthedRequestUser } from "../../auth/strategies/jwt.strategy";
import { MASTER_DATA_EDITOR_ROLES, MASTER_DATA_VIEWER_ROLES } from "./constants/master-data-roles";
import { BatchUserRoleAssignmentsDto } from "./dto/batch-user-role-assignments.dto";
import { CreateMasterUserDto } from "./dto/create-master-user.dto";
import { CreateUserRoleAssignmentDto } from "./dto/create-user-role-assignment.dto";
import { ListMasterUsersQueryDto } from "./dto/list-master-users.query.dto";
import { UpdateMasterUserDto } from "./dto/update-master-user.dto";
import { MasterUsersService } from "./master-users.service";

type AuthedRequest = Request & { user?: AuthedRequestUser };

@Controller("master-data/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...MASTER_DATA_VIEWER_ROLES)
export class MasterUsersController {
  constructor(private readonly users: MasterUsersService) {}

  @Get()
  list(@Query() query: ListMasterUsersQueryDto) {
    return this.users.list(query);
  }

  @Get(":id/roles")
  listRoles(@Param("id") id: string) {
    return this.users.listRoleAssignments(id);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.users.getById(id);
    if (!row) {
      throw new NotFoundException("User was not found");
    }
    return row;
  }

  @Post()
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  create(@Body() dto: CreateMasterUserDto) {
    return this.users.create(dto);
  }

  @Patch(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  patch(@Param("id") id: string, @Body() dto: UpdateMasterUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(":id")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  remove(@Param("id") id: string) {
    return this.users.softDelete(id);
  }

  @Post(":id/roles/batch")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  addRolesBatch(
    @Param("id") id: string,
    @Body() dto: BatchUserRoleAssignmentsDto,
    @Req() req: AuthedRequest
  ) {
    const grantor = req.user?.userId;
    if (!grantor) {
      throw new UnauthorizedException();
    }
    return this.users.addRoleAssignmentsBatch(id, dto, grantor);
  }

  @Post(":id/roles")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  addRole(
    @Param("id") id: string,
    @Body() dto: CreateUserRoleAssignmentDto,
    @Req() req: AuthedRequest
  ) {
    const grantor = req.user?.userId;
    if (!grantor) {
      throw new UnauthorizedException();
    }
    return this.users.addRoleAssignment(id, dto, grantor);
  }

  @Delete(":id/roles/:assignmentId")
  @Roles(...MASTER_DATA_EDITOR_ROLES)
  removeRole(@Param("id") id: string, @Param("assignmentId") assignmentId: string) {
    return this.users.removeRoleAssignment(id, assignmentId);
  }
}
