import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SofEventTypeCategory, SofEventTypeScope } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { allocateUniqueCode } from "./master-code.util";
import { CreateMasterSofEventTypeDto } from "./dto/create-master-sof-event-type.dto";
import { ListMasterSofEventTypesMasterQueryDto } from "./dto/list-master-sof-event-types-master.query.dto";
import { UpdateMasterSofEventTypeDto } from "./dto/update-master-sof-event-type.dto";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

// `category` field added in 20260508094500_sof_event_type_category — until
// `npx prisma generate` runs, the generated `SofEventTypeDefinitionSelect`
// type doesn't yet know about it. We carry the literal as a `Select` cast
// so Prisma stops typechecking the unknown field while still inferring the
// returned row shape.
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
} as unknown as Prisma.SofEventTypeDefinitionSelect;

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

  private parseLimit(raw?: string): number {
    const n = parseInt(raw ?? "", 10);
    if (!Number.isFinite(n) || n < 1) {
      return DEFAULT_LIMIT;
    }
    return Math.min(n, MAX_LIMIT);
  }

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
      take: 500,
      select: { id: true, code: true, name: true, scope: true, category: true } as never
    });
  }

  async list(query: ListMasterSofEventTypesMasterQueryDto) {
    const limit = this.parseLimit(query.limit);
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
          category: (dto.category ?? "NORMAL") as SofEventTypeCategory,
          isActive: true
        } as never,
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
}
