import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { ListVesselCallsQueryDto } from "./dto/list-vessel-calls.query.dto";
import { PatchVesselCallDto } from "./dto/patch-vessel-call.dto";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

@Injectable()
export class VesselCallsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListVesselCallsQueryDto) {
    const limit = this.parseLimit(query.limit);
    const motherOnly = query.motherVesselOnly !== "false";

    const where: Prisma.VesselCallWhereInput = {
      ...(motherOnly ? { vessel: { isMotherVessel: true } } : {}),
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

    const nextCursor = rows.length > limit ? rows[limit].id : null;

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

  private parseLimit(raw?: string): number {
    const n = raw ? Number.parseInt(raw, 10) : DEFAULT_LIMIT;
    if (!Number.isFinite(n) || n < 1) {
      return DEFAULT_LIMIT;
    }
    return Math.min(n, MAX_LIMIT);
  }
}
