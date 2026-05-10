import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SofEventTypeCategory, SofEventTypeScope } from "@prisma/client";

import { MAX_OPTION_LIST_ROWS } from "../../lib/limits";
import { PrismaService } from "../../prisma/prisma.service";
import { parseLimit } from "../../lib/parse-limit";
import { allocateUniqueCode } from "./master-code.util";
import { CreateMasterSofEventTypeDto } from "./dto/create-master-sof-event-type.dto";
import { ListMasterSofEventTypesMasterQueryDto } from "./dto/list-master-sof-event-types-master.query.dto";
import { UpdateMasterSofEventTypeDto } from "./dto/update-master-sof-event-type.dto";
import { rethrowPrismaDeleteError } from "./utils/rethrow-prisma-delete-error";

const DEFAULT_LIST_LIMIT = 30;


const rowSelect = {
  id: true,
  code: true,
  name: true,
  scope: true,
  category: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { sofEvents: true } }
} satisfies Prisma.SofEventTypeDefinitionSelect;

type MasterSofEventTypeRow = {
  id: string;
  code: string;
  name: string;
  scope: SofEventTypeScope;
  category: "NORMAL" | "HOLD_DELAY";
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { sofEvents: number };
};

@Injectable()
export class MasterSofEventTypesService {
  constructor(private readonly prisma: PrismaService) {}


  /** Types offered in SOF event pickers for the given operational scope. */
  async listOptions(forSofScope: "MOTHER_VESSEL" | "LIGHTER_VESSEL") {
    const scoped: SofEventTypeScope[] =
      forSofScope === "MOTHER_VESSEL"
        ? [SofEventTypeScope.BOTH, SofEventTypeScope.MOTHER_VESSEL]
        : [SofEventTypeScope.BOTH, SofEventTypeScope.LIGHTER_VESSEL];

    return this.prisma.sofEventTypeDefinition.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        scope: { in: scoped }
      },
      orderBy: [{ name: "asc" }, { code: "asc" }],
      take: MAX_OPTION_LIST_ROWS,
      select: { id: true, code: true, name: true, scope: true, category: true }
    });
  }

  async list(query: ListMasterSofEventTypesMasterQueryDto) {
    const limit = parseLimit(query.limit, DEFAULT_LIST_LIMIT);
    const includeInactive = query.includeInactive === "true";
    const search = query.search?.trim();
    const scopeFilter =
      query.scope && query.scope !== "ALL"
        ? (query.scope as SofEventTypeScope)
        : undefined;

    const where: Prisma.SofEventTypeDefinitionWhereInput = {
      ...(scopeFilter ? { scope: scopeFilter } : {}),
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

    const rows = await this.prisma.sofEventTypeDefinition.findMany({
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
    return this.prisma.sofEventTypeDefinition.findFirst({
      where: { id },
      select: rowSelect
    });
  }

  async create(dto: CreateMasterSofEventTypeDto) {
    const code = await allocateUniqueCode(
      async (c) =>
        !!(await this.prisma.sofEventTypeDefinition.findFirst({
          where: { code: c },
          select: { id: true }
        })),
      "EVT"
    );

    try {
      return await this.prisma.sofEventTypeDefinition.create({
        data: {
          code,
          name: dto.name.trim(),
          scope: dto.scope,
          category: dto.category ?? SofEventTypeCategory.NORMAL,
          isActive: true
        },
        select: rowSelect
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Could not allocate a unique event type code.");
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateMasterSofEventTypeDto) {
    const existing = await this.prisma.sofEventTypeDefinition.findFirst({
      where: { id },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("SOF event type was not found");
    }

    const data: Prisma.SofEventTypeDefinitionUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.scope !== undefined) data.scope = dto.scope;
    if (dto.category !== undefined) {
      data.category = dto.category as SofEventTypeCategory;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      if (dto.isActive === true) {
        data.deletedAt = null;
      }
    }

    if (Object.keys(data).length === 0) {
      const row = await this.getById(id);
      if (!row) throw new NotFoundException("SOF event type was not found");
      return row;
    }

    return this.prisma.sofEventTypeDefinition.update({
      where: { id },
      data,
      select: rowSelect
    });
  }

  async softDelete(id: string) {
    const existing = await this.prisma.sofEventTypeDefinition.findFirst({
      where: { id, deletedAt: null },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("SOF event type was not found");
    }

    return this.prisma.sofEventTypeDefinition.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false
      },
      select: rowSelect
    });
  }

  async hardDelete(id: string) {
    const existing = await this.prisma.sofEventTypeDefinition.findFirst({
      where: { id, isActive: false },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException(
        "SOF event type was not found or is still active. Deactivate it before removing permanently."
      );
    }
    try {
      await this.prisma.sofEventTypeDefinition.delete({ where: { id } });
    } catch (e) {
      rethrowPrismaDeleteError(e);
    }
    return { ok: true as const };
  }
}
