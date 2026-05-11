import { randomUUID } from "node:crypto";

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { LighterTripStatus, LocationType, Prisma } from "@prisma/client";
import { DateTime } from "luxon";

import {
  MAX_DISCHARGE_METRICS_VESSEL_CALL_IDS,
  MAX_GHAT_AGING_LIMIT
} from "../../lib/limits";
import { PrismaService } from "../../prisma/prisma.service";
import { parseLimit, parseOptionalDate } from "../sof/validators/sof.validator";
import { DEFAULT_SOF_PAGE_SIZE, MAX_SOF_PAGE_SIZE } from "../sof/constants/sof.constants";
import { CreateLighterTripDto } from "./dto/create-lighter-trip.dto";
import { ListLighterTripsQueryDto } from "./dto/list-lighter-trips.query.dto";
import { UpdateLighterTripDto } from "./dto/update-lighter-trip.dto";
import { aggregateBoardMetrics, type TripBoardSelect } from "./lighter-trip-board-metrics";
import { buildLighterAssignmentSyncData } from "./lighter-trip-assignment-sync";
import {
  OPS_TIME_ZONE,
  buildLighterTripNo,
  dhakaDayBounds,
  formatOpsDateSegment
} from "../vessel-calls/call-numbering.util";

const LIGHTER_TRIP_DETAIL_INCLUDE = {
  lighterVessel: {
    select: {
      id: true,
      name: true,
      imoNo: true,
      flag: true,
      isLighter: true
    }
  },
  vesselCall: {
    select: {
      id: true,
      callNo: true,
      status: true,
      totalDischargeMt: true,
      cargoNameSnapshot: true,
      vessel: { select: { id: true, name: true, imoNo: true, hullDisplayCode: true } }
    }
  },
  lighterPortCall: {
    select: {
      id: true,
      callNo: true,
      status: true
    }
  },
  statementOfFacts: {
    select: { id: true, sofNo: true, status: true }
  },
  lighterAssignment: {
    select: {
      id: true,
      assignmentNo: true,
      status: true,
      estimatedQtyMt: true,
      surveyorLoadedQtyMt: true,
      actualDischargedQtyMt: true,
      carrierConfirmedDate: true,
      holdReason: true,
      readyDate: true,
      departedDate: true,
      arrivedMvDate: true,
      alongsideDate: true,
      loadingStartDate: true,
      loadingSuspendedDate: true,
      loadingResumedDate: true,
      loadingCompleteDate: true,
      departedMvDate: true,
      arrivedGhatDate: true,
      unloadingStartDate: true,
      unloadingSuspendedDate: true,
      unloadingResumedDate: true,
      unloadingCompleteDate: true,
      destinationGhat: { select: { id: true, name: true } }
    }
  },
  cargoes: {
    select: {
      id: true,
      estimatedQtyTon: true,
      agreedQtyTon: true,
      loadedQtyTon: true,
      dischargedQtyTon: true,
      differenceQtyTon: true,
      remarks: true,
      product: { select: { id: true, name: true } }
    }
  },
  events: {
    orderBy: [{ eventTime: "desc" }, { id: "desc" }],
    take: 30,
    select: {
      id: true,
      eventTime: true,
      statusAfter: true,
      direction: true,
      remarks: true
    }
  },
  _count: {
    select: { events: true, cargoes: true }
  }
} satisfies Prisma.LighterTripSelect;

const TRIP_ASSIGNMENT_SYNC_SELECT = Prisma.validator<Prisma.LighterTripSelect>()({
  status: true,
  wayToMVReadyAt: true,
  wayToMVStartedAt: true,
  wayToMVCompletedAt: true,
  alongsideDate: true,
  loadingStartedAt: true,
  loadingCompletedAt: true,
  departedMvDate: true,
  arrivedGhatDate: true,
  unloadStartedAt: true,
  unloadCompletedAt: true
});

@Injectable()
export class LighterTripsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListLighterTripsQueryDto) {
    if (query.report === "ghat-aging") {
      if (!query.vesselCallId) {
        throw new BadRequestException("vesselCallId is required when report=ghat-aging");
      }
      return this.listGhatAgingReport(query);
    }

    const limit = Math.min(parseLimit(query.limit, DEFAULT_SOF_PAGE_SIZE), MAX_SOF_PAGE_SIZE);

    const lighterVesselId = query.lighterVesselId?.trim();
    const where: Prisma.LighterTripWhereInput = {
      deletedAt: null,
      lighterVessel: { isLighter: true },
      ...(query.vesselCallId ? { vesselCallId: query.vesselCallId } : {}),
      ...(lighterVesselId ? { lighterVesselId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { tripNo: { contains: query.search, mode: "insensitive" } },
              {
                lighterVessel: {
                  name: { contains: query.search, mode: "insensitive" }
                }
              },
              {
                vesselCall: {
                  callNo: { contains: query.search, mode: "insensitive" }
                }
              },
              {
                vesselCall: {
                  vessel: {
                    name: { contains: query.search, mode: "insensitive" }
                  }
                }
              }
            ]
          }
        : {})
    };

    const rows = await this.prisma.lighterTrip.findMany({
      where,
      orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        tripNo: true,
        status: true,
        assignedAt: true,
        lighterVessel: {
          select: { id: true, name: true, imoNo: true }
        },
        vesselCall: {
          select: {
            id: true,
            callNo: true,
            status: true,
            vessel: { select: { id: true, name: true } }
          }
        },
        lighterPortCallId: true,
        lighterPortCall: {
          select: { id: true, callNo: true, status: true }
        },
        statementOfFacts: {
          select: { id: true, sofNo: true, status: true }
        }
      } as unknown as Prisma.LighterTripSelect
    });

    const nextCursor = rows.length > limit ? rows[limit - 1].id : null;

    return {
      data: rows.slice(0, limit),
      nextCursor,
      limit
    };
  }

  private parseGhatAgingLimit(raw: string | undefined): number {
    if (!raw) {
      return 200;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1) {
      throw new BadRequestException("limit must be a positive integer");
    }
    return Math.min(n, MAX_GHAT_AGING_LIMIT);
  }

  private async listGhatAgingReport(query: ListLighterTripsQueryDto) {
    const limit = this.parseGhatAgingLimit(query.limit);

    const where: Prisma.LighterTripWhereInput = {
      deletedAt: null,
      lighterVessel: { isLighter: true },
      vesselCallId: query.vesselCallId!,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { tripNo: { contains: query.search, mode: "insensitive" } },
              {
                lighterVessel: {
                  name: { contains: query.search, mode: "insensitive" }
                }
              }
            ]
          }
        : {})
    };

    const rows = await this.prisma.lighterTrip.findMany({
      where,
      orderBy: [{ arrivedGhatDate: "desc" }, { assignedAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        tripNo: true,
        status: true,
        assignedAt: true,
        createdAt: true,
        wayToMVStartedAt: true,
        alongsideDate: true,
        loadingStartedAt: true,
        loadingCompletedAt: true,
        departedMvDate: true,
        wayToGhatStartedAt: true,
        arrivedGhatDate: true,
        unloadStartedAt: true,
        unloadCompletedAt: true,
        lighterVessel: {
          select: { id: true, name: true, imoNo: true }
        },
        vesselCall: {
          select: {
            id: true,
            callNo: true,
            status: true,
            vessel: { select: { id: true, name: true } }
          }
        },
        statementOfFacts: {
          select: { id: true, sofNo: true, status: true }
        },
        lighterAssignment: {
          select: {
            assignedDate: true,
            estimatedQtyMt: true,
            actualDischargedQtyMt: true,
            destinationGhat: {
              select: {
                name: true,
                location: { select: { name: true } }
              }
            },
            carrier: {
              select: {
                organization: { select: { name: true } }
              }
            }
          }
        },
        cargoes: {
          select: {
            estimatedQtyTon: true,
            loadedQtyTon: true,
            dischargedQtyTon: true,
            product: { select: { name: true } }
          }
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

  async getById(id: string) {
    const row = await this.prisma.lighterTrip.findFirst({
      where: { id, deletedAt: null },
      include: LIGHTER_TRIP_DETAIL_INCLUDE
    });

    if (!row) {
      throw new NotFoundException("Lighter trip was not found");
    }

    return row;
  }

  async update(id: string, dto: UpdateLighterTripDto) {
    const existing = await this.prisma.lighterTrip.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        status: true,
        vesselCallId: true,
        lighterVesselId: true,
        lighterAssignmentId: true
      }
    });

    if (!existing) {
      throw new NotFoundException("Lighter trip was not found");
    }

    if (existing.status === LighterTripStatus.CLOSED) {
      throw new BadRequestException("Cannot update a closed lighter trip");
    }

    const nextLighterHullId =
      dto.lighterVesselId !== undefined ? dto.lighterVesselId.trim() : existing.lighterVesselId;

    const data: Prisma.LighterTripUpdateInput = {};

    if (dto.remarks !== undefined) {
      data.remarks = dto.remarks;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.holdReason !== undefined) {
      data.holdReason = dto.holdReason;
    }

    if (dto.vesselCallId !== undefined && dto.vesselCallId !== existing.vesselCallId) {
      if (existing.lighterAssignmentId) {
        throw new BadRequestException(
          "Cannot change mother vessel call while this trip is linked to a lighter assignment; unlink or adjust the assignment first"
        );
      }
      const call = await this.prisma.vesselCall.findFirst({
        where: {
          id: dto.vesselCallId,
          vessel: { isMotherVessel: true }
        },
        select: { id: true }
      });
      if (!call) {
        throw new BadRequestException("Mother vessel call was not found");
      }
      data.vesselCall = { connect: { id: dto.vesselCallId } };
    }

    if (dto.lighterVesselId !== undefined && dto.lighterVesselId !== existing.lighterVesselId) {
      if (existing.lighterAssignmentId) {
        throw new BadRequestException(
          "Cannot change lighter hull while this trip is linked to a carrier assignment"
        );
      }
      const lighterVessel = await this.prisma.vessel.findFirst({
        where: { id: dto.lighterVesselId, isLighter: true, isActive: true },
        select: { id: true }
      });
      if (!lighterVessel) {
        throw new BadRequestException(
          "Lighter vessel was not found or is not an active lighter hull"
        );
      }
      const releasedForReuse: LighterTripStatus[] = [
        LighterTripStatus.UNLOADED,
        LighterTripStatus.CLOSED,
        LighterTripStatus.CANCELLED
      ];
      const activeOther = await this.prisma.lighterTrip.findFirst({
        where: {
          lighterVesselId: dto.lighterVesselId,
          deletedAt: null,
          id: { not: id },
          status: { notIn: releasedForReuse }
        },
        select: { id: true, tripNo: true, status: true }
      });
      if (activeOther) {
        throw new BadRequestException(
          `This lighter hull already has an unfinished trip (${activeOther.tripNo}, ${activeOther.status}). ` +
            "Finish or cancel that trip before assigning this hull here."
        );
      }
      data.lighterVessel = { connect: { id: dto.lighterVesselId } };
    }

    const dataExt = data as Prisma.LighterTripUpdateInput & {
      lighterPortCall?: { connect: { id: string } } | { disconnect: true };
    };
    if (dto.lighterPortCallId !== undefined) {
      if (dto.lighterPortCallId === null || dto.lighterPortCallId === "") {
        dataExt.lighterPortCall = { disconnect: true };
      } else {
        const lp = dto.lighterPortCallId.trim();
        await this.assertLighterPortCallMatchesHull(lp, nextLighterHullId);
        dataExt.lighterPortCall = { connect: { id: lp } };
      }
    } else if (
      dto.lighterVesselId !== undefined &&
      dto.lighterVesselId.trim() !== existing.lighterVesselId
    ) {
      dataExt.lighterPortCall = { disconnect: true };
    }

    const dateFields = [
      ["laytimeCommenceAt", dto.laytimeCommenceAt],
      ["wayToMVReadyAt", dto.wayToMVReadyAt],
      ["wayToMVStartedAt", dto.wayToMVStartedAt],
      ["wayToMVCompletedAt", dto.wayToMVCompletedAt],
      ["alongsideDate", dto.alongsideDate],
      ["loadingStartedAt", dto.loadingStartedAt],
      ["loadingCompletedAt", dto.loadingCompletedAt],
      ["departedMvDate", dto.departedMvDate],
      ["wayToGhatStartedAt", dto.wayToGhatStartedAt],
      ["wayToGhatCompletedAt", dto.wayToGhatCompletedAt],
      ["arrivedGhatDate", dto.arrivedGhatDate],
      ["unloadStartedAt", dto.unloadStartedAt],
      ["unloadCompletedAt", dto.unloadCompletedAt]
    ] as const;

    for (const [key, raw] of dateFields) {
      if (raw === undefined) continue;
      const parsed = parseOptionalDate(raw, key);
      if (parsed === undefined) continue;
      (data as Record<string, Date | null>)[key] = parsed;
    }

    const cargoUpdates = dto.cargoQtyUpdates ?? [];
    const hasTripScalarUpdates = Object.keys(data).length > 0;
    const hasCargoUpdates = cargoUpdates.length > 0;
    const carrierConfirmParsed =
      dto.carrierConfirmedAt === undefined
        ? undefined
        : parseOptionalDate(dto.carrierConfirmedAt, "carrierConfirmedAt");
    const hasCarrierConfirm = carrierConfirmParsed !== undefined;

    const hasAssignmentQtyPatch =
      !!existing.lighterAssignmentId &&
      (dto.assignmentSurveyorLoadedQtyMt !== undefined ||
        dto.assignmentActualDischargedQtyMt !== undefined);

    if (!hasTripScalarUpdates && !hasCargoUpdates && !hasCarrierConfirm && !hasAssignmentQtyPatch) {
      throw new BadRequestException("No fields to update");
    }

    const syncAssignment = dto.syncLighterAssignment !== false;
    const statusChanged = dto.status !== undefined && dto.status !== existing.status;
    const eventRemarks =
      dto.statusChangeRemarks?.trim() || (statusChanged ? "Trip status updated" : undefined);

    return this.prisma.$transaction(async (tx) => {
      if (hasTripScalarUpdates) {
        await tx.lighterTrip.update({
          where: { id },
          data: dataExt
        });
      }

      if (statusChanged && dto.status !== undefined) {
        await tx.lighterTripEvent.create({
          data: {
            tripId: id,
            statusAfter: dto.status,
            remarks: eventRemarks ?? "Trip status updated"
          }
        });
      }

      if (hasCargoUpdates) {
        const cargoIds = [...new Set(cargoUpdates.map((u) => u.id))];
        const ownedRows = await tx.lighterTripCargo.findMany({
          where: { id: { in: cargoIds }, tripId: id },
          select: { id: true }
        });
        const ownedIds = new Set(ownedRows.map((r) => r.id));
        const missing = cargoIds.find((cargoId) => !ownedIds.has(cargoId));
        if (missing) {
          throw new BadRequestException(`Cargo line ${missing} is not on this trip`);
        }

        const updateOps: Prisma.PrismaPromise<unknown>[] = [];
        for (const u of cargoUpdates) {
          const cargoData: Prisma.LighterTripCargoUpdateInput = {};
          if (u.estimatedQtyTon !== undefined) {
            const q = this.parseOptionalMtDecimal(u.estimatedQtyTon, "estimatedQtyTon");
            if (q !== undefined) cargoData.estimatedQtyTon = q;
          }
          if (u.loadedQtyTon !== undefined) {
            const q = this.parseOptionalMtDecimal(u.loadedQtyTon, "loadedQtyTon");
            if (q !== undefined) cargoData.loadedQtyTon = q;
          }
          if (u.dischargedQtyTon !== undefined) {
            const q = this.parseOptionalMtDecimal(u.dischargedQtyTon, "dischargedQtyTon");
            if (q !== undefined) cargoData.dischargedQtyTon = q;
          }
          if (Object.keys(cargoData).length > 0) {
            updateOps.push(
              tx.lighterTripCargo.update({
                where: { id: u.id },
                data: cargoData
              })
            );
          }
        }
        if (updateOps.length > 0) {
          await Promise.all(updateOps);
        }
      }

      if (hasCarrierConfirm && existing.lighterAssignmentId) {
        await tx.lighterAssignment.update({
          where: { id: existing.lighterAssignmentId },
          data: {
            carrierConfirmedDate: carrierConfirmParsed ?? null
          }
        });
      }

      if (hasAssignmentQtyPatch && existing.lighterAssignmentId) {
        const assignQty: Prisma.LighterAssignmentUpdateInput = {};
        if (dto.assignmentSurveyorLoadedQtyMt !== undefined) {
          const v = this.parseOptionalMtDecimal(
            dto.assignmentSurveyorLoadedQtyMt,
            "assignmentSurveyorLoadedQtyMt"
          );
          if (v !== undefined) {
            assignQty.surveyorLoadedQtyMt = v;
          }
        }
        if (dto.assignmentActualDischargedQtyMt !== undefined) {
          const v = this.parseOptionalMtDecimal(
            dto.assignmentActualDischargedQtyMt,
            "assignmentActualDischargedQtyMt"
          );
          if (v !== undefined) {
            assignQty.actualDischargedQtyMt = v;
          }
        }
        if (Object.keys(assignQty).length > 0) {
          await tx.lighterAssignment.update({
            where: { id: existing.lighterAssignmentId },
            data: assignQty
          });
        }
      }

      if (syncAssignment && existing.lighterAssignmentId) {
        const snap = await tx.lighterTrip.findFirst({
          where: { id },
          select: TRIP_ASSIGNMENT_SYNC_SELECT
        });
        if (snap) {
          await tx.lighterAssignment.update({
            where: { id: existing.lighterAssignmentId },
            data: buildLighterAssignmentSyncData(snap)
          });
        }
      }

      const out = await tx.lighterTrip.findFirst({
        where: { id },
        include: LIGHTER_TRIP_DETAIL_INCLUDE
      });
      if (!out) {
        throw new NotFoundException("Lighter trip was not found");
      }
      return out;
    });
  }

  async listOpenAssignmentsForVesselCall(vesselCallId: string) {
    const id = vesselCallId?.trim();
    if (!id) {
      throw new BadRequestException("vesselCallId is required");
    }
    const rows = await this.prisma.lighterAssignment.findMany({
      where: { vesselCallId: id, deletedAt: null, trip: null },
      orderBy: [{ assignedDate: "desc" }, { id: "desc" }],
      select: {
        id: true,
        assignmentNo: true,
        estimatedQtyMt: true,
        status: true,
        lighter: { select: { id: true, name: true } },
        carrier: { select: { id: true, organization: { select: { name: true } } } },
        destinationGhat: { select: { id: true, name: true } },
        trip: { select: { id: true } }
      }
    });
    return rows;
  }

  async listLighterVesselsForPicker(
    search?: string,
    limitRaw?: string,
    idRaw?: string,
    cursorRaw?: string,
    includeInactiveRaw?: string
  ): Promise<{
    data: Array<{
      id: string;
      name: string;
      imoNo: string | null;
      flag: string | null;
      isActive: boolean;
      activeTrip: {
        id: string;
        tripNo: string;
        status: string;
        vesselCall: { id: string; callNo: string; vessel: { name: string } };
      } | null;
    }>;
    nextCursor: string | null;
    limit: number;
  }> {
    const limit = Math.min(Math.max(parseInt(limitRaw ?? "24", 10) || 24, 1), 100);
    const id = idRaw?.trim();
    const cursor = cursorRaw?.trim();
    const includeInactive = includeInactiveRaw === "true";
    const q = search?.trim();

    const releasedForReuse: LighterTripStatus[] = [
      LighterTripStatus.UNLOADED,
      LighterTripStatus.CLOSED,
      LighterTripStatus.CANCELLED
    ];

    const enrichWithActiveTrips = async (
      vessels: Array<{
        id: string;
        name: string;
        imoNo: string | null;
        flag: string | null;
        isActive: boolean;
      }>
    ) => {
      if (!vessels.length) {
        return [];
      }
      const vesselIds = vessels.map((v) => v.id);
      const activeTrips = await this.prisma.lighterTrip.findMany({
        where: {
          lighterVesselId: { in: vesselIds },
          deletedAt: null,
          status: { notIn: releasedForReuse }
        },
        orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          tripNo: true,
          status: true,
          lighterVesselId: true,
          vesselCall: {
            select: {
              id: true,
              callNo: true,
              vessel: { select: { name: true } }
            }
          }
        }
      });

      const activeByVessel = new Map<string, (typeof activeTrips)[0]>();
      for (const t of activeTrips) {
        if (!activeByVessel.has(t.lighterVesselId)) {
          activeByVessel.set(t.lighterVesselId, t);
        }
      }

      return vessels.map((v) => {
        const t = activeByVessel.get(v.id);
        return {
          ...v,
          activeTrip: t
            ? {
                id: t.id,
                tripNo: t.tripNo,
                status: t.status,
                vesselCall: t.vesselCall
              }
            : null
        };
      });
    };

    if (id) {
      const vessel = await this.prisma.vessel.findFirst({
        where: { id, isLighter: true },
        select: { id: true, name: true, imoNo: true, flag: true, isActive: true }
      });
      if (!vessel) {
        return { data: [], nextCursor: null, limit };
      }
      const data = await enrichWithActiveTrips([vessel]);
      return { data, nextCursor: null, limit };
    }

    const vessels = await this.prisma.vessel.findMany({
      where: {
        isLighter: true,
        ...(includeInactive ? {} : { isActive: true }),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { imoNo: { contains: q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, name: true, imoNo: true, flag: true, isActive: true }
    });

    const nextCursor = vessels.length > limit ? vessels[limit].id : null;
    const slice = vessels.slice(0, limit);
    const data = await enrichWithActiveTrips(slice);
    return { data, nextCursor, limit };
  }

  /**
   * `YY-MM-DD-{motherHull}-{lighterHull}-{seq}` (Asia/Dhaka day; seq = trips that day for this
   * mother call + lighter hull, excluding soft-deleted rows).
   */
  private async allocateTripNo(
    tx: Prisma.TransactionClient,
    params: { motherVesselCallId: string; lighterVesselId: string }
  ): Promise<string> {
    const vc = await tx.vesselCall.findFirst({
      where: { id: params.motherVesselCallId },
      select: { vessel: { select: { hullDisplayCode: true } } }
    });
    const lighter = await tx.vessel.findFirst({
      where: { id: params.lighterVesselId, isLighter: true },
      select: { hullDisplayCode: true }
    });
    const motherCode = vc?.vessel.hullDisplayCode ?? 0;
    const lighterCode = lighter?.hullDisplayCode ?? 0;
    if (motherCode <= 0 || !vc) {
      throw new BadRequestException(
        "Mother vessel call is missing a hull registry number. Repair master data for the mother hull."
      );
    }
    if (lighterCode <= 0 || !lighter) {
      throw new BadRequestException(
        "Lighter hull is missing a registry number. Repair master data for the lighter."
      );
    }

    const nowDhaka = DateTime.now().setZone(OPS_TIME_ZONE);
    const dateSeg = formatOpsDateSegment(nowDhaka);
    const { startUtc, endExclusiveUtc } = dhakaDayBounds(nowDhaka);
    const count = await tx.lighterTrip.count({
      where: {
        vesselCallId: params.motherVesselCallId,
        lighterVesselId: params.lighterVesselId,
        deletedAt: null,
        createdAt: { gte: startUtc, lt: endExclusiveUtc }
      }
    });
    const seq = count + 1;
    return buildLighterTripNo(dateSeg, motherCode, lighterCode, seq);
  }

  private async allocateAssignmentNo(): Promise<string> {
    for (let i = 0; i < 8; i += 1) {
      const assignmentNo = `LA-${new Date().getFullYear()}-${randomUUID()
        .replace(/-/g, "")
        .slice(0, 8)
        .toUpperCase()}`;
      const clash = await this.prisma.lighterAssignment.findFirst({
        where: { assignmentNo },
        select: { id: true }
      });
      if (!clash) {
        return assignmentNo;
      }
    }
    throw new BadRequestException("Could not allocate a unique assignment number");
  }

  private makeAutoCode(prefix: string): string {
    return `${prefix}-${new Date().getFullYear()}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
  }

  private async ensureAutoCarrierWithLighter() {
    let carrier = await this.prisma.carrier.findFirst({
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      select: { id: true }
    });

    if (!carrier) {
      let orgType = await this.prisma.organizationTypeDefinition.findFirst({
        where: { deletedAt: null },
        orderBy: [{ isActive: "desc" }, { createdAt: "asc" }, { id: "asc" }],
        select: { id: true }
      });
      if (!orgType) {
        orgType = await this.prisma.organizationTypeDefinition.create({
          data: {
            code: this.makeAutoCode("AUTO-ORGTYPE"),
            name: "Auto Organization Type"
          },
          select: { id: true }
        });
      }

      const org = await this.prisma.organization.create({
        data: {
          code: this.makeAutoCode("AUTO-ORG"),
          name: "Auto Carrier Organization",
          organizationTypeId: orgType.id,
          isActive: true
        },
        select: { id: true }
      });

      carrier = await this.prisma.carrier.create({
        data: {
          code: this.makeAutoCode("AUTO-CARRIER"),
          name: "Auto Carrier",
          organizationId: org.id,
          isActive: true
        },
        select: { id: true }
      });
    }

    let lighter = await this.prisma.lighter.findFirst({
      where: { carrierId: carrier.id },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      select: { id: true }
    });
    if (!lighter) {
      lighter = await this.prisma.lighter.create({
        data: {
          name: "Auto Lighter",
          carrierId: carrier.id,
          capacityMt: new Prisma.Decimal("1000"),
          isActive: true
        },
        select: { id: true }
      });
    }

    return { carrierId: carrier.id, lighterId: lighter.id };
  }

  private async ensureAutoGhat() {
    let ghat = await this.prisma.ghat.findFirst({
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      select: { id: true }
    });
    if (ghat) {
      return ghat.id;
    }

    let location = await this.prisma.location.findFirst({
      where: { type: LocationType.GHAT, deletedAt: null },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      select: { id: true }
    });
    if (!location) {
      location = await this.prisma.location.create({
        data: {
          code: this.makeAutoCode("AUTO-LOC"),
          name: "Auto Ghat Location",
          type: LocationType.GHAT,
          isActive: true
        },
        select: { id: true }
      });
    }

    ghat = await this.prisma.ghat.create({
      data: {
        code: this.makeAutoCode("AUTO-GHAT"),
        name: "Auto Ghat",
        locationId: location.id,
        isActive: true
      },
      select: { id: true }
    });
    return ghat.id;
  }

  /** `lighterPortCallId` must be a `VesselCall` row for the same active lighter hull as `lighterHullId`. */
  private async assertLighterPortCallMatchesHull(lighterPortCallId: string, lighterHullId: string) {
    const call = await this.prisma.vesselCall.findFirst({
      where: {
        id: lighterPortCallId,
        vesselId: lighterHullId,
        vessel: { isLighter: true, isActive: true }
      },
      select: { id: true }
    });
    if (!call) {
      throw new BadRequestException(
        "lighterPortCallId must be a vessel call for the same active lighter hull as lighterVesselId"
      );
    }
  }

  async create(dto: CreateLighterTripDto, assignedById: string | undefined) {
    const assignmentId = dto.lighterAssignmentId?.trim();
    const vesselCallId = dto.vesselCallId?.trim();
    if (!assignmentId && !vesselCallId) {
      throw new BadRequestException(
        "Provide lighterAssignmentId or vesselCallId so the system can resolve an open allocation"
      );
    }

    let assignment = await this.prisma.lighterAssignment.findFirst({
      where: assignmentId
        ? { id: assignmentId, deletedAt: null }
        : { vesselCallId, deletedAt: null, trip: null },
      include: { trip: { select: { id: true } } },
      orderBy: assignmentId ? undefined : [{ assignedDate: "desc" }, { id: "desc" }]
    });

    if (!assignment && !assignmentId && vesselCallId) {
      if (!assignedById) {
        throw new BadRequestException("Authenticated user id is required to create an allocation");
      }

      const vesselCall = await this.prisma.vesselCall.findFirst({
          where: { id: vesselCallId },
          select: { id: true, totalDischargeMt: true }
      });

      if (!vesselCall) {
        throw new NotFoundException("Mother vessel call was not found");
      }
      const [{ carrierId, lighterId }, destinationGhatId] = await Promise.all([
        this.ensureAutoCarrierWithLighter(),
        this.ensureAutoGhat()
      ]);

      const assignmentNo = await this.allocateAssignmentNo();
      const estimatedQtyMt = vesselCall.totalDischargeMt ?? new Prisma.Decimal("1000");

      assignment = await this.prisma.lighterAssignment.create({
        data: {
          assignmentNo,
          carrierId,
          lighterId,
          vesselCallId: vesselCall.id,
          destinationGhatId,
          estimatedQtyMt,
          assignedBy: assignedById
        },
        include: { trip: { select: { id: true } } }
      });
    }

    if (!assignment) {
      throw new NotFoundException(
        assignmentId
          ? "Lighter assignment was not found"
          : "No open lighter allocation found for this mother vessel call"
      );
    }
    if (assignment.trip) {
      throw new BadRequestException("This assignment already has a lighter trip");
    }
    const lighterVessel = await this.prisma.vessel.findFirst({
      where: { id: dto.lighterVesselId, isLighter: true, isActive: true },
      select: { id: true }
    });
    if (!lighterVessel) {
      throw new BadRequestException(
        "Lighter vessel was not found or is not an active lighter hull"
      );
    }

    const releasedForReuse: LighterTripStatus[] = [
      LighterTripStatus.UNLOADED,
      LighterTripStatus.CLOSED,
      LighterTripStatus.CANCELLED
    ];
    const activeSameHull = await this.prisma.lighterTrip.findFirst({
      where: {
        lighterVesselId: dto.lighterVesselId,
        deletedAt: null,
        status: { notIn: releasedForReuse }
      },
      select: { id: true, tripNo: true, status: true }
    });
    if (activeSameHull) {
      throw new BadRequestException(
        `This lighter hull already has an unfinished trip (${activeSameHull.tripNo}, ${activeSameHull.status}). ` +
          "Finish unloading and close or cancel that trip before assigning this lighter to another mother vessel."
      );
    }

    let resolvedLighterPortCallId: string | null = null;
    const rawPort = dto.lighterPortCallId?.trim();
    if (rawPort) {
      await this.assertLighterPortCallMatchesHull(rawPort, dto.lighterVesselId);
      resolvedLighterPortCallId = rawPort;
    }

    const maxTripAttempts = 12;
    let lastTripErr: unknown;
    for (let attempt = 0; attempt < maxTripAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const tripNo = await this.allocateTripNo(tx, {
            motherVesselCallId: assignment.vesselCallId,
            lighterVesselId: dto.lighterVesselId
          });
          const trip = await tx.lighterTrip.create({
            data: {
              tripNo,
              vesselCallId: assignment.vesselCallId,
              lighterAssignmentId: assignment.id,
              lighterVesselId: dto.lighterVesselId,
              lighterPortCallId: resolvedLighterPortCallId,
              assignedById: assignedById ?? null,
              status: LighterTripStatus.PLANNED,
              remarks: dto.remarks ?? null
            }
          });
          await tx.lighterTripEvent.create({
            data: {
              tripId: trip.id,
              statusAfter: LighterTripStatus.PLANNED,
              remarks: "Trip created from carrier assignment"
            }
          });
          await tx.lighterAssignment.update({
            where: { id: assignment.id },
            data: buildLighterAssignmentSyncData({
              status: LighterTripStatus.PLANNED,
              wayToMVReadyAt: null,
              wayToMVStartedAt: null,
              wayToMVCompletedAt: null,
              alongsideDate: null,
              loadingStartedAt: null,
              loadingCompletedAt: null,
              departedMvDate: null,
              arrivedGhatDate: null,
              unloadStartedAt: null,
              unloadCompletedAt: null
            })
          });
          const out = await tx.lighterTrip.findFirst({
            where: { id: trip.id },
            include: LIGHTER_TRIP_DETAIL_INCLUDE
          });
          if (!out) {
            throw new NotFoundException("Lighter trip was not found after create");
          }
          return out;
        });
      } catch (e: unknown) {
        lastTripErr = e;
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          continue;
        }
        throw e;
      }
    }
    throw lastTripErr instanceof Error
      ? lastTripErr
      : new BadRequestException("Could not allocate a unique trip number");
  }

  private parseOptionalMtDecimal(
    raw: string | null | undefined,
    field: string
  ): Prisma.Decimal | null | undefined {
    if (raw === undefined) {
      return undefined;
    }
    if (raw === null || raw === "") {
      return null;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      throw new BadRequestException(`${field} must be a non-negative number`);
    }
    return new Prisma.Decimal(raw);
  }

  async dischargeMetricsForVesselCallIds(vesselCallIdsRaw: string | undefined) {
    const vesselCallIds = [
      ...new Set(
        (vesselCallIdsRaw ?? "")
          .split(/[,\s]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      )
    ].slice(0, MAX_DISCHARGE_METRICS_VESSEL_CALL_IDS);
    if (!vesselCallIds.length) {
      return { byVesselCallId: {} as Record<string, ReturnType<typeof aggregateBoardMetrics>> };
    }

    const [trips, assignGroups, callZones] = await Promise.all([
      this.prisma.lighterTrip.findMany({
        where: {
          deletedAt: null,
          vesselCallId: { in: vesselCallIds },
          lighterVessel: { isLighter: true }
        },
        select: {
          vesselCallId: true,
          status: true,
          assignedAt: true,
          departedMvDate: true,
          arrivedGhatDate: true,
          unloadCompletedAt: true,
          wayToGhatStartedAt: true,
          loadingCompletedAt: true,
          alongsideDate: true,
          loadingStartedAt: true,
          lighterAssignment: {
            select: {
              assignedDate: true,
              estimatedQtyMt: true,
              actualDischargedQtyMt: true
            }
          },
          cargoes: {
            select: {
              dischargedQtyTon: true,
              loadedQtyTon: true,
              estimatedQtyTon: true
            }
          }
        }
      }),
      this.prisma.lighterAssignment.groupBy({
        by: ["vesselCallId"],
        where: { deletedAt: null, vesselCallId: { in: vesselCallIds } },
        _count: { _all: true }
      }),
      this.prisma.vesselCall.findMany({
        where: { id: { in: vesselCallIds } },
        select: { id: true, laytimeTimeZone: true }
      })
    ]);

    const assignBy = new Map(assignGroups.map((g) => [g.vesselCallId, g._count._all]));
    const layTzByCall = new Map(callZones.map((c) => [c.id, c.laytimeTimeZone]));
    const boardTrips = trips as TripBoardSelect[];
    const now = new Date();
    const tripsByCall = new Map<string, TripBoardSelect[]>();
    for (const trip of boardTrips) {
      const existingTrips = tripsByCall.get(trip.vesselCallId);
      if (existingTrips) {
        existingTrips.push(trip);
      } else {
        tripsByCall.set(trip.vesselCallId, [trip]);
      }
    }

    const byVesselCallId: Record<string, ReturnType<typeof aggregateBoardMetrics>> = {};
    for (const id of vesselCallIds) {
      const slice = tripsByCall.get(id) ?? [];
      byVesselCallId[id] = aggregateBoardMetrics(
        slice,
        assignBy.get(id) ?? 0,
        now,
        layTzByCall.get(id)
      );
    }

    return { byVesselCallId };
  }
}
