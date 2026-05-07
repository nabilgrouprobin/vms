import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { allocateUniqueCode } from "./master-code.util";
import { CreateMasterLocationDto } from "./dto/create-master-location.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterLocationDto } from "./dto/update-master-location.dto";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

const locationSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  address: true,
  district: true,
  division: true,
  country: true,
  postalCode: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true
} as const;

@Injectable()
export class MasterLocationsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseLimit(raw?: string): number {
    const n = parseInt(raw ?? "", 10);
    if (!Number.isFinite(n) || n < 1) {
      return DEFAULT_LIMIT;
    }
    return Math.min(n, MAX_LIMIT);
  }

  /** For dropdowns (e.g. ghats). */
  async listOptions() {
    return this.prisma.location.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ name: "asc" }],
      take: 500,
      select: { id: true, code: true, name: true, type: true }
    });
  }

  async list(query: ListMasterReferenceQueryDto) {
    const limit = this.parseLimit(query.limit);
    const includeInactive = query.includeInactive === "true";
    const search = query.search?.trim();

    const where: Prisma.LocationWhereInput = {
      deletedAt: null,
      ...(includeInactive ? {} : { isActive: true }),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const rows = await this.prisma.location.findMany({
      where,
      orderBy: [{ code: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: locationSelect
    });

    const nextCursor = rows.length > limit ? rows[limit].id : null;
    return { data: rows.slice(0, limit), nextCursor, limit };
  }

  async getById(id: string) {
    return this.prisma.location.findFirst({
      where: { id, deletedAt: null },
      select: locationSelect
    });
  }

  async create(dto: CreateMasterLocationDto) {
    const code = await allocateUniqueCode(
      async (c) =>
        !!(await this.prisma.location.findFirst({ where: { code: c }, select: { id: true } })),
      "LOC"
    );

    try {
      return await this.prisma.location.create({
        data: {
          code,
          name: dto.name.trim(),
          type: dto.type,
          address: dto.address?.trim() || null,
          district: dto.district?.trim() || null,
          division: dto.division?.trim() || null,
          country: dto.country?.trim() || "Bangladesh",
          postalCode: dto.postalCode?.trim() || null
        },
        select: locationSelect
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new BadRequestException(
          "Another location already uses this code for the same type."
        );
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateMasterLocationDto) {
    const existing = await this.prisma.location.findFirst({
      where: { id, deletedAt: null },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("Location was not found");
    }

    const data: Prisma.LocationUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.type !== undefined) {
      data.type = dto.type;
    }
    if (dto.address !== undefined) {
      data.address =
        dto.address === null || dto.address === "" ? null : dto.address.trim();
    }
    if (dto.district !== undefined) {
      data.district =
        dto.district === null || dto.district === "" ? null : dto.district.trim();
    }
    if (dto.division !== undefined) {
      data.division =
        dto.division === null || dto.division === "" ? null : dto.division.trim();
    }
    if (dto.country !== undefined) {
      data.country =
        dto.country === null || dto.country === "" ? "Bangladesh" : dto.country.trim();
    }
    if (dto.postalCode !== undefined) {
      data.postalCode =
        dto.postalCode === null || dto.postalCode === "" ? null : dto.postalCode.trim();
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      if (dto.isActive === true) {
        data.deletedAt = null;
      }
    }

    if (Object.keys(data).length === 0) {
      return this.getById(id);
    }

    try {
      return await this.prisma.location.update({
        where: { id },
        data,
        select: locationSelect
      });
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new BadRequestException(
          "Another location already uses this code for the same type."
        );
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    const existing = await this.prisma.location.findFirst({
      where: { id, deletedAt: null },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("Location was not found");
    }
    return this.prisma.location.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true }
    });
  }
}
