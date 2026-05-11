import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { MAX_OPTION_LIST_ROWS } from "../../lib/limits";
import { PrismaService } from "../../prisma/prisma.service";
import { parseLimit } from "../../lib/parse-limit";
import { allocateUniqueCode } from "./master-code.util";
import { CreateMasterOrganizationTypeDto } from "./dto/create-master-organization-type.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterOrganizationTypeDto } from "./dto/update-master-organization-type.dto";
import { rethrowPrismaDeleteError } from "./utils/rethrow-prisma-delete-error";

const DEFAULT_LIST_LIMIT = 30;


const rowSelect = {
  id: true,
  code: true,
  name: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { organizations: true } }
} as const;

@Injectable()
export class MasterOrganizationTypesService {
  constructor(private readonly prisma: PrismaService) {}


  /** Labels for organization forms and imports. */
  async listOptions() {
    return this.prisma.organizationTypeDefinition.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ name: "asc" }, { code: "asc" }],
      take: MAX_OPTION_LIST_ROWS,
      select: { id: true, code: true, name: true }
    });
  }

  async list(query: ListMasterReferenceQueryDto) {
    const limit = parseLimit(query.limit, DEFAULT_LIST_LIMIT);
    const includeInactive = query.includeInactive === "true";
    const search = query.search?.trim();

    const where: Prisma.OrganizationTypeDefinitionWhereInput = {
      ...(includeInactive ? {} : { deletedAt: null }),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const rows = await this.prisma.organizationTypeDefinition.findMany({
      where,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: rowSelect
    });

    const nextCursor = rows.length > limit ? rows[limit - 1].id : null;
    return { data: rows.slice(0, limit), nextCursor, limit };
  }

  async getById(id: string) {
    return this.prisma.organizationTypeDefinition.findFirst({
      where: { id },
      select: rowSelect
    });
  }

  async create(dto: CreateMasterOrganizationTypeDto) {
    const code = await allocateUniqueCode(
      async (c) =>
        !!(await this.prisma.organizationTypeDefinition.findFirst({
          where: { code: c },
          select: { id: true }
        })),
      "ORGTYP"
    );

    try {
      return await this.prisma.organizationTypeDefinition.create({
        data: {
          code,
          name: dto.name.trim(),
          isActive: true
        },
        select: rowSelect
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Could not allocate a unique organization type code.");
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateMasterOrganizationTypeDto) {
    const existing = await this.prisma.organizationTypeDefinition.findFirst({
      where: { id },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("Organization type was not found");
    }

    const data: Prisma.OrganizationTypeDefinitionUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      if (dto.isActive === true) {
        data.deletedAt = null;
      }
    }

    if (Object.keys(data).length === 0) {
      const row = await this.getById(id);
      if (!row) throw new NotFoundException("Organization type was not found");
      return row;
    }

    return this.prisma.organizationTypeDefinition.update({
      where: { id },
      data,
      select: rowSelect
    });
  }

  async softDelete(id: string) {
    const existing = await this.prisma.organizationTypeDefinition.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, _count: { select: { organizations: true } } }
    });
    if (!existing) {
      throw new NotFoundException("Organization type was not found");
    }
    if (existing._count.organizations > 0) {
      throw new ConflictException(
        "This organization type is still assigned to organizations; reassign them before archiving."
      );
    }

    return this.prisma.organizationTypeDefinition.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false
      },
      select: rowSelect
    });
  }

  async hardDelete(id: string) {
    const existing = await this.prisma.organizationTypeDefinition.findFirst({
      where: { id, isActive: false },
      select: { id: true, _count: { select: { organizations: true } } }
    });
    if (!existing) {
      throw new NotFoundException(
        "Organization type was not found or is still active. Deactivate it before removing permanently."
      );
    }
    if (existing._count.organizations > 0) {
      throw new ConflictException(
        "This organization type is still assigned to organizations; reassign them first."
      );
    }
    try {
      await this.prisma.organizationTypeDefinition.delete({ where: { id } });
    } catch (e) {
      rethrowPrismaDeleteError(e);
    }
    return { ok: true as const };
  }
}
