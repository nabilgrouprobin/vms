import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { parseLimit } from "../../lib/parse-limit";
import { CreateMasterVesselDto } from "./dto/create-master-vessel.dto";
import { ListMasterVesselsQueryDto } from "./dto/list-master-vessels.query.dto";
import { UpdateMasterVesselDto } from "./dto/update-master-vessel.dto";
import { decString, toDecimalOrNull } from "./utils/decimal-json";
import { rethrowPrismaDeleteError } from "./utils/rethrow-prisma-delete-error";

const DEFAULT_LIST_LIMIT = 30;

export type MasterVesselKind = "mother" | "lighter";


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
  hullDisplayCode: true,
  isActive: true,
  isMotherVessel: true,
  isLighter: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.VesselSelect;

type VesselListRow = {
  id: string;
  name: string;
  imoNo: string | null;
  flag: string | null;
  vesselType: string | null;
  yearBuilt: number | null;
  deadweightTon: Prisma.Decimal | null;
  maxDraftMeters: Prisma.Decimal | null;
  lengthOverallM: Prisma.Decimal | null;
  beamM: Prisma.Decimal | null;
  hullDisplayCode: number;
  isActive: boolean;
  isMotherVessel: boolean;
  isLighter: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { motherCalls: number } | { lighterTrips: number };
};

@Injectable()
export class MasterVesselsService {
  constructor(private readonly prisma: PrismaService) {}

  private kindWhere(kind: MasterVesselKind): Prisma.VesselWhereInput {
    return kind === "mother" ? { isMotherVessel: true } : { isLighter: true };
  }

  /** One global serial for mother + lighter hulls so port `callNo` stays unique. */
  private async nextHullDisplayCode(): Promise<number> {
    const agg = await this.prisma.vessel.aggregate({
      where: { OR: [{ isMotherVessel: true }, { isLighter: true }] },
      _max: { hullDisplayCode: true }
    });
    return (agg._max.hullDisplayCode ?? 0) + 1;
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
      hullDisplayCode: row.hullDisplayCode,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      _count: row._count
    };
  }

  async list(kind: MasterVesselKind, query: ListMasterVesselsQueryDto) {
    const limit = parseLimit(query.limit, DEFAULT_LIST_LIMIT);
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

    const nextCursor = rows.length > limit ? rows[limit - 1].id : null;
    const slice = rows.slice(0, limit) as unknown as VesselListRow[];
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
    return row ? this.mapVessel(kind, row as unknown as VesselListRow) : null;
  }

  async create(kind: MasterVesselKind, dto: CreateMasterVesselDto) {
    const name = dto.name.trim();
    // Retry on hull-code collision: MAX(...)+1 is racy, so two concurrent
    // creates can pick the same code. The unique constraint surfaces P2002
    // with target "hull_display_code" — recompute and try again, capped.
    const HULL_RETRIES = 5;
    for (let attempt = 0; attempt < HULL_RETRIES; attempt += 1) {
      const nextHullCode = await this.nextHullDisplayCode();
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
            isLighter: kind === "lighter",
            hullDisplayCode: nextHullCode
          },
          select: {
            ...vesselSelect,
            _count:
              kind === "mother"
                ? { select: { motherCalls: true } }
                : { select: { lighterTrips: true } }
          }
        });
        return this.mapVessel(kind, row as unknown as VesselListRow);
      } catch (e: any) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          const target = (e.meta as { target?: string[] | string } | undefined)?.target;
          const targetList = Array.isArray(target) ? target : target ? [target] : [];
          const onlyHullClash = targetList.some((t) =>
            t.includes("hull_display_code")
          );
          if (onlyHullClash && attempt < HULL_RETRIES - 1) {
            continue;
          }
          throw new BadRequestException(
            "Another vessel already uses this name or IMO number."
          );
        }
        throw e;
      }
    }
    throw new BadRequestException(
      "Could not allocate a unique hull display code after several attempts. Please retry."
    );
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
      return this.mapVessel(kind, row as unknown as VesselListRow);
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

  /** Permanent remove — only allowed when inactive and unused (no calls, trips, stock movements). */
  async hardDelete(kind: MasterVesselKind, id: string) {
    const row = await this.prisma.vessel.findFirst({
      where: { id, ...this.kindWhere(kind), isActive: false },
      select: {
        id: true,
        _count: { select: { motherCalls: true, lighterTrips: true, stockMovements: true } }
      }
    });
    if (!row) {
      throw new NotFoundException(
        "Vessel was not found or is still active. Deactivate it before removing permanently."
      );
    }
    const { motherCalls, lighterTrips, stockMovements } = row._count;
    if (motherCalls > 0 || lighterTrips > 0 || stockMovements > 0) {
      throw new BadRequestException(
        `Cannot permanently delete while linked to ${motherCalls} mother call(s), ${lighterTrips} lighter trip(s), and ${stockMovements} stock movement(s).`
      );
    }
    try {
      await this.prisma.vessel.delete({ where: { id } });
    } catch (e) {
      rethrowPrismaDeleteError(e);
    }
    return { ok: true as const };
  }
}
