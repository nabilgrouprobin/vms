import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";

import { PrismaService } from "../../prisma/prisma.service";
import { parseLimit } from "../../lib/parse-limit";
import {
  buildPortCallNo,
  dhakaDayBounds,
  formatOpsDateSegment,
  OPS_TIME_ZONE
} from "./call-numbering.util";
import { CreateVesselCallDto } from "./dto/create-vessel-call.dto";
import { ListVesselCallsQueryDto } from "./dto/list-vessel-calls.query.dto";
import { PatchVesselCallDto } from "./dto/patch-vessel-call.dto";

const DEFAULT_LIST_LIMIT = 24;


@Injectable()
export class VesselCallsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListVesselCallsQueryDto) {
    const limit = parseLimit(query.limit, DEFAULT_LIST_LIMIT);

    /**
     * Hull filter precedence (preserves backwards-compat with `motherVesselOnly`):
     *   1. `hullKind === "all"` or `motherVesselOnly === "false"` → no hull filter
     *   2. `hullKind === "lighter"` → lighter hulls only
     *   3. `hullKind === "mother"` (default when omitted) → mother hulls only
     *
     * Without this, the lighter tab in the picker and the lighter tab on the
     * vessel-calls CRUD page silently fall back to mother-only and surface the
     * wrong vessel names.
     */
    const hullKind = query.hullKind ?? (query.motherVesselOnly === "false" ? "all" : "mother");
    const vesselFilter: Prisma.VesselWhereInput = {
      ...(hullKind === "mother" ? { isMotherVessel: true } : {}),
      ...(hullKind === "lighter" ? { isLighter: true } : {}),
      ...(query.vesselId ? { id: query.vesselId } : {})
    };

    const where: Prisma.VesselCallWhereInput = {
      ...(Object.keys(vesselFilter).length > 0 ? { vessel: vesselFilter } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { callNo: { contains: query.search, mode: "insensitive" } },
              { cargoNameSnapshot: { contains: query.search, mode: "insensitive" } },
              {
                vessel: {
                  name: { contains: query.search, mode: "insensitive" }
                }
              }
            ]
          }
        : {})
    };

    const rows = await this.prisma.vesselCall.findMany({
      where,
      orderBy: [{ eta: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        callNo: true,
        status: true,
        eta: true,
        ata: true,
        currentAnchorage: true,
        totalDischargeMt: true,
        cargoNameSnapshot: true,
        vessel: {
          select: {
            id: true,
            name: true,
            imoNo: true,
            flag: true,
            isMotherVessel: true,
            isLighter: true
          }
        },
        arrivalLocation: {
          select: { id: true, name: true, type: true }
        },
        statementOfFacts: {
          select: { id: true, sofNo: true, status: true, scope: true }
        },
        _count: {
          select: { lighterTrips: true, lighterAssignments: true }
        }
      }
    });

    const nextCursor = rows.length > limit ? rows[limit - 1].id : null;

    return {
      data: rows.slice(0, limit),
      nextCursor,
      limit
    };
  }

  async patch(id: string, dto: PatchVesselCallDto) {
    const existing = await this.prisma.vesselCall.findFirst({
      where: {
        id,
        vessel: { isMotherVessel: true }
      }
    });
    if (!existing) {
      throw new NotFoundException("Mother vessel call was not found");
    }

    const data: Prisma.VesselCallUpdateInput = {};
    if (dto.laytimeTimeZone !== undefined) {
      data.laytimeTimeZone = dto.laytimeTimeZone;
    }

    if (dto.importContractId !== undefined) {
      if (dto.importContractId === null) {
        data.importContract = { disconnect: true };
      } else {
        const ic = await this.prisma.importContract.findFirst({
          where: { id: dto.importContractId, deletedAt: null }
        });
        if (!ic) {
          throw new BadRequestException("Import contract was not found or is deleted");
        }
        data.importContract = { connect: { id: dto.importContractId } };
      }
    }

    if (dto.approxTotalWeightTon !== undefined) {
      data.approxTotalWeightTon =
        dto.approxTotalWeightTon === null ? null : new Prisma.Decimal(dto.approxTotalWeightTon);
    }

    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    return this.prisma.vesselCall.update({
      where: { id },
      data
    });
  }

  async getById(id: string) {
    return this.prisma.vesselCall.findFirst({
      where: {
        id,
        vessel: { isMotherVessel: true }
      },
      include: {
        vessel: true,
        arrivalLocation: true,
        shippingAgent: { select: { id: true, name: true, code: true } },
        stevedore: { select: { id: true, name: true, code: true } },
        cnf: { select: { id: true, name: true, code: true } },
        statementOfFacts: {
          include: {
            _count: { select: { events: true, hourlyStatuses: true } }
          }
        },
        lighterTrips: {
          where: { deletedAt: null },
          orderBy: { assignedAt: "desc" },
          take: 50,
          select: {
            id: true,
            tripNo: true,
            status: true,
            assignedAt: true,
            lighterVessel: { select: { id: true, name: true } },
            statementOfFacts: { select: { id: true, sofNo: true, status: true } }
          }
        }
      }
    });
  }

  async create(dto: CreateVesselCallDto) {
    const hullKind = dto.hullKind ?? "mother";
    const vessel = await this.prisma.vessel.findFirst({
      where: {
        id: dto.vesselId,
        isActive: true,
        ...(hullKind === "mother" ? { isMotherVessel: true } : { isLighter: true })
      },
      select: { id: true, hullDisplayCode: true, name: true }
    });
    if (!vessel) {
      throw new BadRequestException(
        hullKind === "mother"
          ? "Mother hull was not found, is inactive, or is not registered as a mother vessel."
          : "Lighter hull was not found, is inactive, or is not registered as a lighter."
      );
    }

    // Resolve a callNo: explicit override, else generate "YY-MM-DD-{hull}-{seq}".
    const callNo = dto.callNo?.trim()
      ? dto.callNo.trim()
      : await this.generateCallNo(vessel.id, vessel.hullDisplayCode);

    const eta = this.parseIsoDate(dto.eta, "eta");

    try {
      const created = await this.prisma.vesselCall.create({
        data: {
          callNo,
          vesselId: vessel.id,
          cargoNameSnapshot: dto.cargoNameSnapshot ?? null,
          eta,
          ...(dto.status ? { status: dto.status } : {})
        },
        select: {
          id: true,
          callNo: true,
          status: true,
          eta: true,
          ata: true,
          currentAnchorage: true,
          totalDischargeMt: true,
          cargoNameSnapshot: true,
          vessel: {
            select: {
              id: true,
              name: true,
              imoNo: true,
              flag: true,
              isMotherVessel: true,
              isLighter: true
            }
          },
          arrivalLocation: { select: { id: true, name: true, type: true } },
          statementOfFacts: {
            select: { id: true, sofNo: true, status: true, scope: true }
          },
          _count: {
            select: { lighterTrips: true, lighterAssignments: true }
          }
        }
      });
      return created;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException(
          `Call number "${callNo}" already exists for this date and hull.`
        );
      }
      throw e;
    }
  }

  /** Hard-delete a vessel call. Refuses if the call has SOF / lighter trips / discharges attached. */
  async remove(id: string) {
    const existing = await this.prisma.vesselCall.findFirst({
      where: { id },
      select: {
        id: true,
        statementOfFacts: { select: { id: true } },
        _count: {
          select: { lighterTrips: true, lighterAssignments: true }
        }
      }
    });
    if (!existing) {
      throw new NotFoundException("Vessel call was not found");
    }
    const hasSof = existing.statementOfFacts !== null;
    const { lighterTrips, lighterAssignments } = existing._count;
    if (hasSof || lighterTrips > 0 || lighterAssignments > 0) {
      throw new BadRequestException(
        `Cannot delete a vessel call with ${hasSof ? "an attached SOF" : "no SOF"}, ${lighterTrips} lighter trip(s), and ${lighterAssignments} lighter assignment(s).`
      );
    }
    try {
      await this.prisma.vesselCall.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2003") {
          throw new BadRequestException(
            "Cannot delete: other records still reference this vessel call."
          );
        }
        if (e.code === "P2025") {
          throw new NotFoundException("Vessel call was not found.");
        }
      }
      throw e;
    }
    return { ok: true as const, id };
  }

  /** Generate the next `YY-MM-DD-{hull}-{seq}` call number for the given hull on today's Asia/Dhaka day. */
  private async generateCallNo(vesselId: string, hullDisplayCode: number): Promise<string> {
    const now = DateTime.now().setZone(OPS_TIME_ZONE);
    const dateSeg = formatOpsDateSegment(now);
    const { startUtc, endExclusiveUtc } = dhakaDayBounds(now);

    // Count this hull's calls created today (Asia/Dhaka) to derive the next seq.
    const todayCount = await this.prisma.vesselCall.count({
      where: {
        vesselId,
        createdAt: { gte: startUtc, lt: endExclusiveUtc }
      }
    });
    return buildPortCallNo(dateSeg, hullDisplayCode, todayCount + 1);
  }

  private parseIsoDate(value: string | null | undefined, field: string): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO 8601 date-time`);
    }
    return d;
  }
}
