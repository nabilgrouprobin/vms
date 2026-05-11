import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { MAX_OPTION_LIST_ROWS } from "../../lib/limits";
import { PrismaService } from "../../prisma/prisma.service";
import { parseLimit } from "../../lib/parse-limit";
import { allocateUniqueCode } from "./master-code.util";
import { CreateMasterOrganizationDto } from "./dto/create-master-organization.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterOrganizationDto } from "./dto/update-master-organization.dto";
import { rethrowPrismaDeleteError } from "./utils/rethrow-prisma-delete-error";

const DEFAULT_LIST_LIMIT = 30;


const orgSelect = {
  id: true,
  code: true,
  name: true,
  organizationType: { select: { id: true, code: true, name: true } },
  address: true,
  contactPerson: true,
  contactNo: true,
  email: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { users: true } }
} as const;

@Injectable()
export class MasterOrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireAssignableOrganizationType(id: string) {
    const row = await this.prisma.organizationTypeDefinition.findFirst({
      where: { id, deletedAt: null, isActive: true },
      select: { id: true }
    });
    if (!row) {
      throw new BadRequestException("Organization type was not found or is inactive");
    }
    return row;
  }


  async listOptions() {
    const rows = await this.prisma.organization.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ name: "asc" }, { code: "asc" }],
      take: MAX_OPTION_LIST_ROWS,
      select: {
        id: true,
        code: true,
        name: true,
        organizationType: { select: { code: true } }
      }
    });
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      type: r.organizationType.code
    }));
  }

  async list(query: ListMasterReferenceQueryDto) {
    const limit = parseLimit(query.limit, DEFAULT_LIST_LIMIT);
    const includeInactive = query.includeInactive === "true";
    const search = query.search?.trim();

    const where: Prisma.OrganizationWhereInput = {
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

    const rows = await this.prisma.organization.findMany({
      where,
      orderBy: [{ code: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: orgSelect
    });

    const nextCursor = rows.length > limit ? rows[limit - 1].id : null;
    return { data: rows.slice(0, limit), nextCursor, limit };
  }

  async getById(id: string) {
    return this.prisma.organization.findFirst({
      where: { id },
      select: orgSelect
    });
  }

  async create(dto: CreateMasterOrganizationDto) {
    const name = dto.name.trim();
    await this.requireAssignableOrganizationType(dto.organizationTypeId);

    const code = await allocateUniqueCode(
      async (c) =>
        !!(await this.prisma.organization.findFirst({ where: { code: c }, select: { id: true } })),
      "ORG"
    );

    try {
      return await this.prisma.organization.create({
        data: {
          code,
          name,
          organizationTypeId: dto.organizationTypeId,
          address: dto.address?.trim() || null,
          contactPerson: dto.contactPerson?.trim() || null,
          contactNo: dto.contactNo?.trim() || null,
          email: dto.email?.trim() || null,
          isActive: true
        },
        select: orgSelect
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Organization code or unique field already exists");
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateMasterOrganizationDto) {
    const existing = await this.prisma.organization.findFirst({
      where: { id },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("Organization was not found");
    }

    const data: Prisma.OrganizationUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.organizationTypeId !== undefined) {
      await this.requireAssignableOrganizationType(dto.organizationTypeId);
      data.organizationType = { connect: { id: dto.organizationTypeId } };
    }
    if (dto.address !== undefined) data.address = dto.address?.trim() || null;
    if (dto.contactPerson !== undefined) data.contactPerson = dto.contactPerson?.trim() || null;
    if (dto.contactNo !== undefined) data.contactNo = dto.contactNo?.trim() || null;
    if (dto.email !== undefined) data.email = dto.email?.trim() || null;
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      if (dto.isActive === true) {
        data.deletedAt = null;
      }
    }

    if (Object.keys(data).length === 0) {
      const row = await this.getById(id);
      if (!row) throw new NotFoundException("Organization was not found");
      return row;
    }

    try {
      return await this.prisma.organization.update({
        where: { id },
        data,
        select: orgSelect
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Organization code or unique field already exists");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    const existing = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("Organization was not found");
    }
    return this.prisma.organization.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false
      },
      select: orgSelect
    });
  }

  async hardDelete(id: string) {
    const existing = await this.prisma.organization.findFirst({
      where: { id, isActive: false },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException(
        "Organization was not found or is still active. Deactivate it before removing permanently."
      );
    }
    try {
      await this.prisma.organization.delete({ where: { id } });
    } catch (e) {
      rethrowPrismaDeleteError(e);
    }
    return { ok: true as const };
  }
}
