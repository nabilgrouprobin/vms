import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { CreateMasterVesselDto } from "./dto/create-master-vessel.dto";
import { ListMasterVesselsQueryDto } from "./dto/list-master-vessels.query.dto";
import { UpdateMasterVesselDto } from "./dto/update-master-vessel.dto";
import { decString, toDecimalOrNull } from "./utils/decimal-json";

export type MasterVesselKind = "mother" | "lighter";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

const vesselSelect = {
  id: true,
  name: true,
  imoNo: true,
  flag: true,
  vesselType: true,
  yearBuilt: true,
  deadweightTon: true,
  maxDraftMeters: true,
  lengthOverallM: true,
  beamM: true,
  isActive: true,
  isMotherVessel: true,
  isLighter: true,
  createdAt: true,
  updatedAt: true
} as const;

type VesselListRow = Prisma.VesselGetPayload<{ select: typeof vesselSelect }> & {
  _count: { motherCalls: number } | { lighterTrips: number };
};

@Injectable()
export class MasterVesselsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseLimit(raw?: string): number {
    const n = parseInt(raw ?? "", 10);
    if (!Number.isFinite(n) || n < 1) {
      return DEFAULT_LIMIT;
    }
    return Math.min(n, MAX_LIMIT);
  }

  private kindWhere(kind: MasterVesselKind): Prisma.VesselWhereInput {
    return kind === "mother" ? { isMotherVessel: true } : { isLighter: true };
  }

  private mapVessel(kind: MasterVesselKind, row: VesselListRow) {
    return {
      id: row.id,
      name: row.name,
      imoNo: row.imoNo,
      flag: row.flag,
      vesselType: row.vesselType,
      yearBuilt: row.yearBuilt,
      deadweightTon: decString(row.deadweightTon),
      maxDraftMeters: decString(row.maxDraftMeters),
      lengthOverallM: decString(row.lengthOverallM),
      beamM: decString(row.beamM),
      isActive: row.isActive,
      isMotherVessel: row.isMotherVessel,
      isLighter: row.isLighter,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      _count: row._count
    };
  }

  async list(kind: MasterVesselKind, query: ListMasterVesselsQueryDto) {
    const limit = this.parseLimit(query.limit);
    const includeInactive = query.includeInactive === "true";
    const search = query.search?.trim();

    const where: Prisma.VesselWhereInput = {
      ...this.kindWhere(kind),
      ...(includeInactive ? {} : { isActive: true }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { imoNo: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const rows = await this.prisma.vessel.findMany({
      where,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: {
        ...vesselSelect,
        _count:
          kind === "mother"
            ? { select: { motherCalls: true } }
            : { select: { lighterTrips: true } }
      }
    });

    const nextCursor = rows.length > limit ? rows[limit].id : null;
    const slice = rows.slice(0, limit) as VesselListRow[];
    return {
      data: slice.map((r) => this.mapVessel(kind, r)),
      nextCursor,
      limit
    };
  }

  async getById(kind: MasterVesselKind, id: string) {
    const row = await this.prisma.vessel.findFirst({
      where: { id, ...this.kindWhere(kind) },
      select: {
        ...vesselSelect,
        _count:
          kind === "mother"
            ? { select: { motherCalls: true } }
            : { select: { lighterTrips: true } }
      }
    });
    return row ? this.mapVessel(kind, row as VesselListRow) : null;
  }

  async create(kind: MasterVesselKind, dto: CreateMasterVesselDto) {
    const name = dto.name.trim();
    try {
      const row = await this.prisma.vessel.create({
        data: {
          name,
          imoNo: dto.imoNo?.trim() || null,
          flag: dto.flag?.trim() || null,
          vesselType: dto.vesselType?.trim() || null,
          yearBuilt: dto.yearBuilt ?? null,
          deadweightTon: toDecimalOrNull(dto.deadweightTon),
          maxDraftMeters: toDecimalOrNull(dto.maxDraftMeters),
          lengthOverallM: toDecimalOrNull(dto.lengthOverallM),
          beamM: toDecimalOrNull(dto.beamM),
          isMotherVessel: kind === "mother",
          isLighter: kind === "lighter"
        },
        select: {
          ...vesselSelect,
          _count:
            kind === "mother"
              ? { select: { motherCalls: true } }
              : { select: { lighterTrips: true } }
        }
      });
      return this.mapVessel(kind, row as VesselListRow);
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new BadRequestException(
          "Another vessel already uses this name or IMO number."
        );
      }
      throw e;
    }
  }

  async update(kind: MasterVesselKind, id: string, dto: UpdateMasterVesselDto) {
    const existing = await this.prisma.vessel.findFirst({
      where: { id, ...this.kindWhere(kind) },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("Vessel was not found");
    }

    const data: Prisma.VesselUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.imoNo !== undefined) {
      data.imoNo = dto.imoNo === null || dto.imoNo === "" ? null : dto.imoNo.trim();
    }
    if (dto.flag !== undefined) {
      data.flag = dto.flag === null || dto.flag === "" ? null : dto.flag.trim();
    }
    if (dto.vesselType !== undefined) {
      data.vesselType =
        dto.vesselType === null || dto.vesselType === "" ? null : dto.vesselType.trim();
    }
    if (dto.yearBuilt !== undefined) {
      data.yearBuilt = dto.yearBuilt;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }
    if (dto.deadweightTon !== undefined) {
      data.deadweightTon = toDecimalOrNull(dto.deadweightTon);
    }
    if (dto.maxDraftMeters !== undefined) {
      data.maxDraftMeters = toDecimalOrNull(dto.maxDraftMeters);
    }
    if (dto.lengthOverallM !== undefined) {
      data.lengthOverallM = toDecimalOrNull(dto.lengthOverallM);
    }
    if (dto.beamM !== undefined) {
      data.beamM = toDecimalOrNull(dto.beamM);
    }

    if (Object.keys(data).length === 0) {
      return this.getById(kind, id);
    }

    try {
      const row = await this.prisma.vessel.update({
        where: { id },
        data,
        select: {
          ...vesselSelect,
          _count:
            kind === "mother"
              ? { select: { motherCalls: true } }
              : { select: { lighterTrips: true } }
        }
      });
      return this.mapVessel(kind, row as VesselListRow);
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new BadRequestException(
          "Another vessel already uses this name or IMO number."
        );
      }
      throw e;
    }
  }

  /** Soft-deactivate (`isActive: false`). */
  async softDelete(kind: MasterVesselKind, id: string) {
    const existing = await this.prisma.vessel.findFirst({
      where: { id, ...this.kindWhere(kind) },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("Vessel was not found");
    }
    return this.prisma.vessel.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true }
    });
  }
}
