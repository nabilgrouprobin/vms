import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { allocateUniqueCode } from "./master-code.util";
import { CreateMasterGhatDto } from "./dto/create-master-ghat.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterGhatDto } from "./dto/update-master-ghat.dto";
import { decString, toDecimalOrNull } from "./utils/decimal-json";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

const ghatSelect = {
  id: true,
  code: true,
  name: true,
  locationId: true,
  unloadingCapacityMtPerDay: true,
  numberOfJetties: true,
  hasWarehouseStorage: true,
  warehouseCapacityMt: true,
  hasTruckScale: true,
  workingStartHour: true,
  workingEndHour: true,
  contactPerson: true,
  contactNo: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  location: { select: { id: true, code: true, name: true, type: true } }
} as const;

type GhatRow = Prisma.GhatGetPayload<{ select: typeof ghatSelect }>;

@Injectable()
export class MasterGhatsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseLimit(raw?: string): number {
    const n = parseInt(raw ?? "", 10);
    if (!Number.isFinite(n) || n < 1) {
      return DEFAULT_LIMIT;
    }
    return Math.min(n, MAX_LIMIT);
  }

  private mapGhat(row: GhatRow) {
    return {
      ...row,
      unloadingCapacityMtPerDay: decString(row.unloadingCapacityMtPerDay),
      warehouseCapacityMt: decString(row.warehouseCapacityMt)
    };
  }

  async list(query: ListMasterReferenceQueryDto) {
    const limit = this.parseLimit(query.limit);
    const includeInactive = query.includeInactive === "true";
    const search = query.search?.trim();

    const where: Prisma.GhatWhereInput = {
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

    const rows = await this.prisma.ghat.findMany({
      where,
      orderBy: [{ code: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: ghatSelect
    });

    const nextCursor = rows.length > limit ? rows[limit].id : null;
    return {
      data: rows.slice(0, limit).map((r) => this.mapGhat(r)),
      nextCursor,
      limit
    };
  }

  async getById(id: string) {
    const row = await this.prisma.ghat.findFirst({ where: { id }, select: ghatSelect });
    return row ? this.mapGhat(row) : null;
  }

  async create(dto: CreateMasterGhatDto) {
    const loc = await this.prisma.location.findFirst({
      where: { id: dto.locationId, deletedAt: null, isActive: true },
      select: { id: true }
    });
    if (!loc) {
      throw new BadRequestException("Location was not found or is inactive.");
    }

    const code = await allocateUniqueCode(
      async (c) =>
        !!(await this.prisma.ghat.findFirst({ where: { code: c }, select: { id: true } })),
      "GHT"
    );

    try {
      const row = await this.prisma.ghat.create({
        data: {
          code,
          name: dto.name.trim(),
          locationId: dto.locationId,
          numberOfJetties: dto.numberOfJetties ?? 1,
          hasWarehouseStorage: dto.hasWarehouseStorage ?? false,
          hasTruckScale: dto.hasTruckScale ?? false,
          workingStartHour: dto.workingStartHour?.trim() || null,
          workingEndHour: dto.workingEndHour?.trim() || null,
          contactPerson: dto.contactPerson?.trim() || null,
          contactNo: dto.contactNo?.trim() || null,
          unloadingCapacityMtPerDay: toDecimalOrNull(dto.unloadingCapacityMtPerDay),
          warehouseCapacityMt: toDecimalOrNull(dto.warehouseCapacityMt)
        },
        select: ghatSelect
      });
      return this.mapGhat(row);
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new BadRequestException("Another ghat already uses this code.");
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateMasterGhatDto) {
    const existing = await this.prisma.ghat.findFirst({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException("Ghat was not found");
    }

    if (dto.locationId) {
      const loc = await this.prisma.location.findFirst({
        where: { id: dto.locationId, deletedAt: null, isActive: true },
        select: { id: true }
      });
      if (!loc) {
        throw new BadRequestException("Location was not found or is inactive.");
      }
    }

    const data: Prisma.GhatUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.locationId !== undefined) {
      data.location = { connect: { id: dto.locationId } };
    }
    if (dto.numberOfJetties !== undefined) {
      data.numberOfJetties = dto.numberOfJetties;
    }
    if (dto.hasWarehouseStorage !== undefined) {
      data.hasWarehouseStorage = dto.hasWarehouseStorage;
    }
    if (dto.hasTruckScale !== undefined) {
      data.hasTruckScale = dto.hasTruckScale;
    }
    if (dto.workingStartHour !== undefined) {
      data.workingStartHour =
        dto.workingStartHour === null || dto.workingStartHour === ""
          ? null
          : dto.workingStartHour.trim();
    }
    if (dto.workingEndHour !== undefined) {
      data.workingEndHour =
        dto.workingEndHour === null || dto.workingEndHour === ""
          ? null
          : dto.workingEndHour.trim();
    }
    if (dto.contactPerson !== undefined) {
      data.contactPerson =
        dto.contactPerson === null || dto.contactPerson === ""
          ? null
          : dto.contactPerson.trim();
    }
    if (dto.contactNo !== undefined) {
      data.contactNo =
        dto.contactNo === null || dto.contactNo === "" ? null : dto.contactNo.trim();
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }
    if (dto.unloadingCapacityMtPerDay !== undefined) {
      data.unloadingCapacityMtPerDay = toDecimalOrNull(dto.unloadingCapacityMtPerDay);
    }
    if (dto.warehouseCapacityMt !== undefined) {
      data.warehouseCapacityMt = toDecimalOrNull(dto.warehouseCapacityMt);
    }

    if (Object.keys(data).length === 0) {
      return this.getById(id);
    }

    try {
      const row = await this.prisma.ghat.update({
        where: { id },
        data,
        select: ghatSelect
      });
      return this.mapGhat(row);
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new BadRequestException("Another ghat already uses this code.");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    const existing = await this.prisma.ghat.findFirst({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException("Ghat was not found");
    }
    return this.prisma.ghat.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true }
    });
  }
}
