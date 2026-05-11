import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../../prisma/prisma.service";
import { parseLimit } from "../../lib/parse-limit";
import { BatchUserRoleAssignmentsDto } from "./dto/batch-user-role-assignments.dto";
import { CreateMasterUserDto } from "./dto/create-master-user.dto";
import { CreateUserRoleAssignmentDto } from "./dto/create-user-role-assignment.dto";
import { ListMasterUsersQueryDto } from "./dto/list-master-users.query.dto";
import { rethrowPrismaDeleteError } from "./utils/rethrow-prisma-delete-error";
import { UpdateMasterUserDto } from "./dto/update-master-user.dto";

const DEFAULT_LIST_LIMIT = 24;


const userListSelect = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  isActive: true,
  lastLoginAt: true,
  organizationId: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { roles: true } }
} as const;

@Injectable()
export class MasterUsersService {
  constructor(private readonly prisma: PrismaService) {}


  async list(query: ListMasterUsersQueryDto) {
    const limit = parseLimit(query.limit, DEFAULT_LIST_LIMIT);
    const includeInactive = query.includeInactive === "true";
    const search = query.search?.trim();

    const where: Prisma.UserWhereInput = {
      ...(includeInactive ? {} : { deletedAt: null }),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { fullName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const rows = await this.prisma.user.findMany({
      where,
      orderBy: [{ email: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: userListSelect
    });

    const nextCursor = rows.length > limit ? rows[limit - 1].id : null;
    return {
      data: rows.slice(0, limit),
      nextCursor,
      limit
    };
  }

  async getById(id: string, opts?: { includeDeleted?: boolean }) {
    const row = await this.prisma.user.findFirst({
      where: {
        id,
        ...(opts?.includeDeleted ? {} : { deletedAt: null })
      },
      select: userListSelect
    });
    return row;
  }

  async create(dto: CreateMasterUserDto) {
    const email = dto.email?.trim() ? dto.email.toLowerCase().trim() : null;
    const phone = dto.phone.trim();

    const dup = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone }, ...(email ? [{ email }] : [])]
      },
      select: { id: true, email: true, phone: true }
    });
    if (dup) {
      if (dup.phone === phone) {
        throw new ConflictException("Phone number is already in use");
      }
      throw new ConflictException("Email is already in use");
    }

    if (dto.organizationId) {
      const org = await this.prisma.organization.findFirst({
        where: { id: dto.organizationId, deletedAt: null, isActive: true }
      });
      if (!org) {
        throw new BadRequestException("Organization was not found");
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email,
        phone,
        fullName: dto.fullName.trim(),
        passwordHash,
        organizationId: dto.organizationId ?? undefined,
        isActive: true
      },
      select: userListSelect
    });
  }

  async update(id: string, dto: UpdateMasterUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { id },
      select: { id: true, email: true, phone: true, deletedAt: true }
    });
    if (!existing) {
      throw new NotFoundException("User was not found");
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.fullName !== undefined) {
      data.fullName = dto.fullName.trim();
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      if (dto.isActive && existing.deletedAt) {
        data.deletedAt = null;
      }
    }

    if (dto.email !== undefined) {
      if (dto.email === null || dto.email.trim() === "") {
        data.email = null;
      } else {
        const email = dto.email.toLowerCase().trim();
        const conflict = await this.prisma.user.findFirst({
          where: { email, NOT: { id } },
          select: { id: true }
        });
        if (conflict) {
          throw new ConflictException("Email is already in use");
        }
        data.email = email;
      }
    }

    if (dto.phone !== undefined) {
      const phone = dto.phone.trim();
      const conflict = await this.prisma.user.findFirst({
        where: { phone, NOT: { id } },
        select: { id: true }
      });
      if (conflict) {
        throw new ConflictException("Phone number is already in use");
      }
      data.phone = phone;
    }

    if (dto.organizationId !== undefined) {
      if (dto.organizationId === null) {
        data.organization = { disconnect: true };
      } else {
        const org = await this.prisma.organization.findFirst({
          where: { id: dto.organizationId, deletedAt: null, isActive: true }
        });
        if (!org) {
          throw new BadRequestException("Organization was not found");
        }
        data.organization = { connect: { id: dto.organizationId } };
      }
    }

    if (dto.password !== undefined && dto.password.trim().length > 0) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (Object.keys(data).length === 0) {
      const row = await this.getById(id, { includeDeleted: true });
      if (!row) throw new NotFoundException("User was not found");
      return row;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: userListSelect
    });
  }

  async softDelete(id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("User was not found");
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false
      },
      select: userListSelect
    });
  }

  async hardDelete(id: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, isActive: false },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException(
        "User was not found or is still active. Deactivate them before removing permanently."
      );
    }
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (e) {
      rethrowPrismaDeleteError(e);
    }
    return { ok: true as const };
  }

  async listRoleAssignments(userId: string) {
    await this.ensureUserExists(userId);
    return this.prisma.userRoleAssignment.findMany({
      where: { userId },
      orderBy: [{ role: "asc" }, { id: "asc" }],
      select: {
        id: true,
        role: true,
        locationId: true,
        grantedBy: true,
        grantedAt: true,
        expiresAt: true,
        location: { select: { id: true, code: true, name: true, type: true } }
      }
    });
  }

  async addRoleAssignmentsBatch(userId: string, dto: BatchUserRoleAssignmentsDto, grantedById: string) {
    await this.ensureUserExists(userId);
    const locId = dto.locationId?.trim() ? dto.locationId.trim() : null;
    if (locId) {
      const loc = await this.prisma.location.findFirst({
        where: { id: locId, deletedAt: null },
        select: { id: true }
      });
      if (!loc) {
        throw new BadRequestException("Location was not found");
      }
    }
    const uniqueRoles = [...new Set(dto.roles)];
    await this.prisma.userRoleAssignment.createMany({
      data: uniqueRoles.map((role) => ({
        userId,
        role,
        locationId: locId,
        grantedBy: grantedById
      })),
      skipDuplicates: true
    });
    return this.listRoleAssignments(userId);
  }

  async addRoleAssignment(userId: string, dto: CreateUserRoleAssignmentDto, grantedById: string) {
    await this.ensureUserExists(userId);

    if (dto.locationId) {
      const loc = await this.prisma.location.findFirst({
        where: { id: dto.locationId, deletedAt: null },
        select: { id: true }
      });
      if (!loc) {
        throw new BadRequestException("Location was not found");
      }
    }

    try {
      return await this.prisma.userRoleAssignment.create({
        data: {
          userId,
          role: dto.role,
          locationId: dto.locationId ?? undefined,
          grantedBy: grantedById
        },
        select: {
          id: true,
          role: true,
          locationId: true,
          grantedBy: true,
          grantedAt: true,
          expiresAt: true,
          location: { select: { id: true, code: true, name: true, type: true } }
        }
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("This role is already assigned for this user and location");
      }
      throw e;
    }
  }

  async removeRoleAssignment(userId: string, assignmentId: string) {
    const row = await this.prisma.userRoleAssignment.findFirst({
      where: { id: assignmentId, userId },
      select: { id: true }
    });
    if (!row) {
      throw new NotFoundException("Role assignment was not found");
    }
    await this.prisma.userRoleAssignment.delete({
      where: { id: assignmentId }
    });
    return { ok: true as const };
  }

  private async ensureUserExists(userId: string) {
    const u = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true }
    });
    if (!u) {
      throw new NotFoundException("User was not found");
    }
  }
}
