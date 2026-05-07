import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { allocateUniqueCode } from "./master-code.util";
import { CreateMasterOrganizationTypeDto } from "./dto/create-master-organization-type.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterOrganizationTypeDto } from "./dto/update-master-organization-type.dto";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

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

  private parseLimit(raw?: string): number {
    const n = parseInt(raw ?? "", 10);
    if (!Number.isFinite(n) || n < 1) {
      return DEFAULT_LIMIT;
    }
    return Math.min(n, MAX_LIMIT);
  }

  /** Labels for organization forms and imports. */
  async listOptions() {
    return this.prisma.organizationTypeDefinition.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ name: "asc" }, { code: "asc" }],
      take: 500,
      select: { id: true, code: true, name: true }
    });
  }

  async list(query: ListMasterReferenceQueryDto) {
    const limit = this.parseLimit(query.limit);
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

    const nextCursor = rows.length > limit ? rows[limit].id : null;
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
}
