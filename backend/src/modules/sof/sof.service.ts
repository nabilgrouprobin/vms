import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, SofEventTypeScope, SOFScope, SOFStatus } from "@prisma/client";

import { CreateLighterVesselSofDto } from "./dto/create-lighter-vessel-sof.dto";
import { ListLighterVesselSofsQueryDto } from "./dto/list-lighter-vessel-sofs.query.dto";
import { UpdateLighterVesselSofDto } from "./dto/update-lighter-vessel-sof.dto";

import { DEFAULT_SOF_PAGE_SIZE } from "./constants/sof.constants";
import { CreateMotherVesselDailyDischargeDto } from "./dto/create-mother-vessel-daily-discharge.dto";
import { CreateMotherVesselSofDto } from "./dto/create-mother-vessel-sof.dto";
import { CreateSofEventDto } from "./dto/create-sof-event.dto";
import { ListMotherVesselSofsQueryDto } from "./dto/list-mother-vessel-sofs.query.dto";
import { UpdateMotherVesselDailyDischargeDto } from "./dto/update-mother-vessel-daily-discharge.dto";
import { UpdateMotherVesselSofDto } from "./dto/update-mother-vessel-sof.dto";
import { UpdateSofEventDto } from "./dto/update-sof-event.dto";
import { PaginatedResult } from "./types/sof.types";
import {
  findTimelineSplitHost,
  parseLimit,
  parseOptionalDate,
  parseRequiredDate,
  sofEventDurationSpanMs,
  validateSofEventTimelineNoOverlap,
  validateSofStatusTransition
} from "./validators/sof.validator";
import { PrismaService } from "../../prisma/prisma.service";
import { LaytimeCalculationService } from "./laytime/laytime-calculation.service";
import { SofRepository } from "./sof.repository";

@Injectable()
export class SofService {
  constructor(
    private readonly sofRepository: SofRepository,
    private readonly laytimeCalculation: LaytimeCalculationService,
    private readonly prisma: PrismaService
  ) {}

  async listMotherVesselSofs(
    query: ListMotherVesselSofsQueryDto
  ): Promise<PaginatedResult<unknown>> {
    const limit = parseLimit(query.limit, DEFAULT_SOF_PAGE_SIZE);
    const where: Prisma.StatementOfFactsWhereInput = {
      scope: SOFScope.MOTHER_VESSEL,
      ...(query.status ? { status: query.status } : {}),
      ...(query.vesselCallId ? { vesselCallId: query.vesselCallId } : {}),
      ...(query.search
        ? {
            OR: [
              { sofNo: { contains: query.search, mode: "insensitive" } },
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

    const rows = await this.sofRepository.findMotherVesselSofs({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: this.sofRepository.getMotherVesselSofListSelect()
    });
    const nextCursor = rows.length > limit ? rows[limit - 1].id : null;

    return {
      data: rows.slice(0, limit),
      nextCursor,
      limit
    };
  }

  async getMotherVesselSof(id: string) {
    const sof = await this.sofRepository.findMotherVesselSofById(id);

    if (!sof) {
      throw new NotFoundException("Mother vessel SOF was not found");
    }

    return sof;
  }

  async getSofOptions() {
    const [vesselCalls, lighterTrips, users] = await Promise.all([
      this.sofRepository.listMotherVesselCallOptions(),
      this.sofRepository.listLighterTripOptions(),
      this.sofRepository.listSofUserOptions()
    ]);

    return {
      vesselCalls,
      lighterTrips,
      users
    };
  }

  async createMotherVesselSof(dto: CreateMotherVesselSofDto) {
    if (!dto.vesselCallId) {
      throw new BadRequestException("vesselCallId is required");
    }

    const vesselCall = await this.sofRepository.findVesselCall(dto.vesselCallId);

    if (!vesselCall) {
      throw new NotFoundException("Vessel call was not found");
    }

    if (!vesselCall.vessel.isMotherVessel) {
      throw new BadRequestException("SOF vessel call must belong to a mother vessel");
    }

    const existingSof = await this.sofRepository.findMotherVesselSofByVesselCallId(
      dto.vesselCallId
    );

    if (existingSof) {
      throw new ConflictException("A mother vessel SOF already exists for this vessel call");
    }

    const data: Prisma.StatementOfFactsUncheckedCreateInput = {
      ...this.buildSofCreateData(dto, dto.sofNo ?? this.generateSofNo(vesselCall.callNo)),
      scope: SOFScope.MOTHER_VESSEL,
      vesselCallId: dto.vesselCallId
    };

    return this.sofRepository.createMotherVesselSof(data);
  }

  async updateMotherVesselSof(id: string, dto: UpdateMotherVesselSofDto) {
    const currentSof = await this.getMotherVesselSof(id);
    this.assertSofEditable(currentSof.status, dto.status);

    return this.sofRepository.updateMotherVesselSof(
      id,
      this.removeUndefined(this.buildSofUpdateData(dto))
    );
  }

  async deleteMotherVesselSof(id: string) {
    const currentSof = await this.getMotherVesselSof(id);
    this.assertSofDeletable(currentSof.status);
    return this.safeDeleteSof(() => this.sofRepository.deleteMotherVesselSof(id));
  }

  async listLighterVesselSofs(
    query: ListLighterVesselSofsQueryDto
  ): Promise<PaginatedResult<unknown>> {
    const limit = parseLimit(query.limit, DEFAULT_SOF_PAGE_SIZE);
    const lighterTripFilter: Prisma.LighterTripWhereInput | undefined =
      query.vesselCallId || query.lighterVesselId
        ? {
            ...(query.vesselCallId ? { vesselCallId: query.vesselCallId } : {}),
            ...(query.lighterVesselId ? { lighterVesselId: query.lighterVesselId } : {})
          }
        : undefined;

    const where: Prisma.StatementOfFactsWhereInput = {
      scope: SOFScope.LIGHTER_VESSEL,
      ...(query.status ? { status: query.status } : {}),
      ...(query.lighterTripId ? { lighterTripId: query.lighterTripId } : {}),
      ...(lighterTripFilter ? { lighterTrip: lighterTripFilter } : {}),
      ...(query.search
        ? {
            OR: [
              { sofNo: { contains: query.search, mode: "insensitive" } },
              {
                lighterTrip: {
                  tripNo: { contains: query.search, mode: "insensitive" }
                }
              },
              {
                lighterTrip: {
                  lighterVessel: {
                    name: { contains: query.search, mode: "insensitive" }
                  }
                }
              }
            ]
          }
        : {})
    };

    const rows = await this.sofRepository.findLighterVesselSofs({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: this.sofRepository.getLighterVesselSofListSelect()
    });
    const nextCursor = rows.length > limit ? rows[limit - 1].id : null;

    return {
      data: rows.slice(0, limit),
      nextCursor,
      limit
    };
  }

  async getLighterVesselSof(id: string) {
    const sof = await this.sofRepository.findLighterVesselSofById(id);

    if (!sof) {
      throw new NotFoundException("Lighter vessel SOF was not found");
    }

    return sof;
  }

  async createLighterVesselSof(dto: CreateLighterVesselSofDto) {
    if (!dto.lighterTripId) {
      throw new BadRequestException("lighterTripId is required");
    }

    const trip = await this.sofRepository.findLighterTripForSof(dto.lighterTripId);

    if (!trip || trip.deletedAt) {
      throw new NotFoundException("Lighter trip was not found");
    }

    if (!trip.lighterVessel.isLighter) {
      throw new BadRequestException("Lighter SOF requires a lighter-class vessel on the trip");
    }

    const existingSof = await this.sofRepository.findLighterVesselSofByLighterTripId(
      dto.lighterTripId
    );

    if (existingSof) {
      throw new ConflictException("A lighter vessel SOF already exists for this trip");
    }

    const data: Prisma.StatementOfFactsUncheckedCreateInput = {
      ...this.buildSofCreateData(dto, dto.sofNo ?? this.generateLighterSofNo(trip.tripNo)),
      scope: SOFScope.LIGHTER_VESSEL,
      lighterTripId: dto.lighterTripId,
      vesselCallId: null
    };

    return this.sofRepository.createLighterVesselSof(data);
  }

  async updateLighterVesselSof(id: string, dto: UpdateLighterVesselSofDto) {
    const currentSof = await this.getLighterVesselSof(id);
    this.assertSofEditable(currentSof.status, dto.status);

    return this.sofRepository.updateLighterVesselSof(
      id,
      this.removeUndefined(this.buildSofUpdateData(dto))
    );
  }

  async deleteLighterVesselSof(id: string) {
    const currentSof = await this.getLighterVesselSof(id);
    this.assertSofDeletable(currentSof.status);
    return this.safeDeleteSof(() => this.sofRepository.deleteLighterVesselSof(id));
  }

  async listSofEvents(
    statementId: string,
    query: ListMotherVesselSofsQueryDto,
    scope: SOFScope
  ): Promise<PaginatedResult<unknown>> {
    await this.requireStatementForScope(statementId, scope);

    const limit = parseLimit(query.limit, DEFAULT_SOF_PAGE_SIZE);
    const rows = await this.sofRepository.listSofEvents(statementId, limit, query.cursor);
    // Cursor pagination: the repository fetches `limit + 1` rows so we can detect
    // a next page. The `nextCursor` MUST be the id of the LAST RETURNED row
    // (rows[limit - 1]), not rows[limit]. The repository combines the cursor
    // with `skip: 1`, so the next page starts from the row AFTER the cursor.
    // Using rows[limit] would silently drop one row at every page boundary.
    const nextCursor = rows.length > limit ? rows[limit - 1].id : null;

    return {
      data: rows.slice(0, limit),
      nextCursor,
      limit
    };
  }

  async createSofEvent(statementId: string, dto: CreateSofEventDto, scope: SOFScope, actorUserId: string) {
    const sof = await this.requireStatementForScope(statementId, scope);

    if (sof.status === SOFStatus.CLOSED) {
      throw new ConflictException("Closed SOF records cannot receive new events");
    }

    let verifiedById: string | undefined = dto.verifiedBy?.trim() || undefined;
    let verifiedAt = parseOptionalDate(dto.verifiedAt, "verifiedAt");
    if (verifiedById) {
      const verifier = await this.prisma.user.findFirst({
        where: { id: verifiedById, deletedAt: null },
        select: { id: true }
      });
      if (!verifier) {
        verifiedById = undefined;
        verifiedAt = undefined;
      }
    }

    const eventTypeDef = await this.sofRepository.findActiveSofEventTypeDefinition(dto.eventTypeId);
    if (!eventTypeDef) {
      throw new BadRequestException("SOF event type was not found or is inactive");
    }
    this.assertSofEventTypeMatchesScope(eventTypeDef.scope, scope);

    const eventTime = parseRequiredDate(dto.eventTime, "eventTime");
    const { outMinutes, outHours } = this.resolveSofDurationForCreate(dto);
    const timeline = await this.sofRepository.listSofEventsTimelineForValidation(statementId);

    // Hold/Delay is now driven by the master event type's `category`.
    const derivedIsHold = eventTypeDef.category === "HOLD_DELAY";

    const baseInsert = this.removeUndefined({
      statementId,
      eventTypeId: dto.eventTypeId,
      eventTime,
      durationHours: outHours,
      durationMinutes: outMinutes,
      countsAsLaytime: dto.countsAsLaytime ?? true,
      laytimeImpactHours: this.toDecimal(dto.laytimeImpactHours),
      location: dto.location,
      anchorageId: dto.anchorageId,
      robQuantityMt: this.toDecimal(dto.robQuantityMt),
      dischargeQuantityMt: this.toDecimal(dto.dischargeQuantityMt),
      cumulativeDischargeMt: this.toDecimal(dto.cumulativeDischargeMt),
      isHold: derivedIsHold,
      holdReason: derivedIsHold ? dto.holdReason : null,
      responsibleParty: dto.responsibleParty,
      laytimeAccount: dto.laytimeAccount,
      referenceNo: dto.referenceNo,
      remarks: dto.remarks,
      supportingDocuments: dto.supportingDocuments ?? [],
      createdBy: actorUserId,
      verifiedBy: verifiedById,
      verifiedAt,
      operationBatchId: dto.operationBatchId
    }) as Prisma.SofEventUncheckedCreateInput;

    // If the inserted event has explicit start/end and falls strictly inside one
    // existing event with its own duration, automatically split the host event
    // around the insertion (truncate host + create insert + create continuation).
    const splitPlan = this.planSofEventInsertSplit({
      timeline,
      newEnd: eventTime,
      newDurationMinutes: outMinutes ?? null,
      newDurationHours: outHours ?? null
    });

    if (splitPlan) {
      const host = await this.sofRepository.findSofEvent(splitPlan.hostId);
      if (!host) {
        throw new BadRequestException(
          "Could not split the surrounding event: host event was not found. Refresh and try again."
        );
      }

      const hostStoresMinutes =
        host.durationMinutes !== null && host.durationMinutes !== undefined && host.durationMinutes > 0;
      const hostStoresHoursOnly =
        !hostStoresMinutes &&
        host.durationHours !== null &&
        Number(host.durationHours) > 0;

      const hostUpdate: Prisma.SofEventUncheckedUpdateInput = {
        eventTime: new Date(splitPlan.newStartMs),
        ...(hostStoresMinutes
          ? { durationMinutes: splitPlan.hostNewDurationMinutes, durationHours: null }
          : hostStoresHoursOnly
            ? {
                durationHours: new Prisma.Decimal(splitPlan.hostNewDurationMinutes / 60),
                durationMinutes: null
              }
            : {
                durationMinutes: splitPlan.hostNewDurationMinutes,
                durationHours: null
              })
      };

      const continuationUsesMinutes = hostStoresMinutes || !hostStoresHoursOnly;

      let continuation: Prisma.SofEventUncheckedCreateInput | null = null;
      if (splitPlan.continuationDurationMinutes > 0) {
        continuation = this.removeUndefined({
          statementId: host.statementId,
          eventTypeId: host.eventTypeId,
          eventTime: new Date(splitPlan.hostOriginalEndMs),
          ...(continuationUsesMinutes
            ? {
                durationMinutes: splitPlan.continuationDurationMinutes,
                durationHours: null
              }
            : {
                durationHours: new Prisma.Decimal(
                  splitPlan.continuationDurationMinutes / 60
                ),
                durationMinutes: null
              }),
          countsAsLaytime: host.countsAsLaytime,
          laytimeImpactHours: host.laytimeImpactHours,
          location: host.location,
          anchorageId: host.anchorageId,
          isHold: host.isHold,
          holdReason: host.holdReason,
          responsibleParty: host.responsibleParty,
          laytimeAccount: host.laytimeAccount,
          referenceNo: host.referenceNo,
          remarks: host.remarks,
          supportingDocuments: host.supportingDocuments ?? [],
          createdBy: actorUserId,
          operationBatchId: host.operationBatchId
        }) as Prisma.SofEventUncheckedCreateInput;
      }

      return this.sofRepository.splitInsertSofEvent({
        hostId: host.id,
        hostUpdate,
        insert: baseInsert,
        continuation
      });
    }

    validateSofEventTimelineNoOverlap([
      ...timeline.map((r) => ({
        id: r.id,
        eventTime: r.eventTime,
        durationHours: r.durationHours,
        durationMinutes: r.durationMinutes,
        remarks: r.remarks,
        eventTypeDefinition: r.eventTypeDefinition
      })),
      // `id: null` flags this as the prospective new row; the validator's
      // tie-breaker sorts it after existing rows that share `eventTime`.
      {
        id: null,
        eventTime,
        durationHours: outHours ?? null,
        durationMinutes: outMinutes,
        remarks: dto.remarks ?? null,
        eventTypeDefinition: { name: eventTypeDef.name }
      }
    ]);

    return this.sofRepository.createSofEvent(baseInsert);
  }

  /**
   * Detect "strict containment" on insert: the new event's [start, end) sits
   * entirely inside exactly one existing event's [start, end) and at least one
   * boundary differs. Returns the split plan, or `null` when the normal
   * non-overlap validation should run instead.
   */
  private planSofEventInsertSplit(args: {
    timeline: Array<{
      id: string;
      eventTime: Date;
      durationHours: Prisma.Decimal | null | undefined;
      durationMinutes: number | null | undefined;
    }>;
    newEnd: Date;
    newDurationMinutes: number | null | undefined;
    newDurationHours: Prisma.Decimal | null | undefined;
  }): {
    hostId: string;
    newStartMs: number;
    hostOriginalEndMs: number;
    hostNewDurationMinutes: number;
    continuationDurationMinutes: number;
  } | null {
    const span = sofEventDurationSpanMs({
      id: "new",
      eventTime: args.newEnd,
      durationHours: args.newDurationHours ?? null,
      durationMinutes: args.newDurationMinutes ?? null
    });
    if (span === null || span <= 0) return null;
    const newEndMs = args.newEnd.getTime();
    const newStartMs = newEndMs - span;

    const sortedTimeline = [...args.timeline].sort(
      (a, b) =>
        a.eventTime.getTime() - b.eventTime.getTime() || a.id.localeCompare(b.id)
    );

    const hostMatch = findTimelineSplitHost(sortedTimeline, newStartMs, newEndMs);
    if (!hostMatch) return null;

    const hostNewDurationMinutes = Math.max(
      1,
      Math.round((newStartMs - hostMatch.hostStartMs) / 60_000)
    );
    const continuationDurationMinutes = Math.max(
      0,
      Math.round((hostMatch.hostEndMs - newEndMs) / 60_000)
    );

    return {
      hostId: hostMatch.hostId,
      newStartMs,
      hostOriginalEndMs: hostMatch.hostEndMs,
      hostNewDurationMinutes,
      continuationDurationMinutes
    };
  }

  async updateSofEvent(eventId: string, dto: UpdateSofEventDto) {
    const event = await this.sofRepository.findSofEvent(eventId);

    if (!event) {
      throw new NotFoundException("SOF event was not found");
    }

    const sof = await this.requireStatementById(event.statementId);

    if (sof.status === SOFStatus.CLOSED) {
      throw new ConflictException("Closed SOF records cannot be edited");
    }

    let derivedIsHold: boolean | undefined;
    let nextEventTypeCategory: "NORMAL" | "HOLD_DELAY" | undefined;
    if (dto.eventTypeId !== undefined) {
      const eventTypeDef = await this.sofRepository.findActiveSofEventTypeDefinition(dto.eventTypeId);
      if (!eventTypeDef) {
        throw new BadRequestException("SOF event type was not found or is inactive");
      }
      this.assertSofEventTypeMatchesScope(eventTypeDef.scope, sof.scope);
      nextEventTypeCategory = eventTypeDef.category;
      derivedIsHold = eventTypeDef.category === "HOLD_DELAY";
    }

    const nextEventTime = dto.eventTime
      ? parseRequiredDate(dto.eventTime, "eventTime")
      : event.eventTime;
    const { nextMinutes, nextHours } = this.resolveSofDurationForUpdate(event, dto);

    const timeline = await this.sofRepository.listSofEventsTimelineForValidation(event.statementId);
    validateSofEventTimelineNoOverlap(
      timeline.map((r) =>
        r.id === eventId
          ? {
              // `id: null` flags this as the prospective edited row so the
              // overlap error can name *other* events as the conflict instead
              // of citing the row the user is currently editing.
              id: null,
              eventTime: nextEventTime,
              durationHours: nextHours,
              durationMinutes: nextMinutes,
              remarks: dto.remarks ?? r.remarks,
              eventTypeDefinition: r.eventTypeDefinition
            }
          : {
              id: r.id,
              eventTime: r.eventTime,
              durationHours: r.durationHours,
              durationMinutes: r.durationMinutes,
              remarks: r.remarks,
              eventTypeDefinition: r.eventTypeDefinition
            }
      )
    );

    return this.sofRepository.updateSofEvent(
      eventId,
      this.removeUndefined({
        eventTypeId: dto.eventTypeId,
        eventTime: dto.eventTime ? parseRequiredDate(dto.eventTime, "eventTime") : undefined,
        ...(dto.durationMinutes !== undefined || dto.durationHours !== undefined
          ? { durationHours: nextHours, durationMinutes: nextMinutes }
          : {}),
        countsAsLaytime: dto.countsAsLaytime,
        laytimeImpactHours: this.toNullableDecimal(dto.laytimeImpactHours),
        location: dto.location,
        anchorageId: dto.anchorageId,
        robQuantityMt: this.toNullableDecimal(dto.robQuantityMt),
        dischargeQuantityMt: this.toNullableDecimal(dto.dischargeQuantityMt),
        cumulativeDischargeMt: this.toNullableDecimal(dto.cumulativeDischargeMt),
        // When the event type changes we recompute hold from the new type's
        // category. Otherwise leave the column untouched.
        isHold: derivedIsHold,
        holdReason:
          nextEventTypeCategory === "NORMAL"
            ? null
            : nextEventTypeCategory === "HOLD_DELAY"
              ? dto.holdReason
              : dto.holdReason,
        responsibleParty: dto.responsibleParty,
        laytimeAccount: dto.laytimeAccount,
        referenceNo: dto.referenceNo,
        remarks: dto.remarks,
        supportingDocuments: dto.supportingDocuments,
        verifiedBy: dto.verifiedBy,
        verifiedAt: parseOptionalDate(dto.verifiedAt, "verifiedAt"),
        operationBatchId: dto.operationBatchId
      })
    );
  }

  async deleteSofEvent(eventId: string) {
    const event = await this.sofRepository.findSofEvent(eventId);

    if (!event) {
      throw new NotFoundException("SOF event was not found");
    }

    const sof = await this.requireStatementById(event.statementId);

    if (sof.status === SOFStatus.CLOSED) {
      throw new ConflictException("Closed SOF records cannot be edited");
    }

    return this.sofRepository.deleteSofEvent(eventId);
  }

  async listDailyDischarges(statementId: string) {
    const sof = await this.getMotherVesselSof(statementId);

    if (!sof.vesselCallId) {
      throw new BadRequestException("Mother vessel SOF is not linked to a vessel call");
    }

    return this.sofRepository.listDailyDischarges(sof.vesselCallId);
  }

  async createDailyDischarge(statementId: string, dto: CreateMotherVesselDailyDischargeDto) {
    const sof = await this.getMotherVesselSof(statementId);

    if (sof.status === SOFStatus.CLOSED) {
      throw new ConflictException("Closed SOF records cannot receive daily discharge");
    }

    if (!sof.vesselCallId) {
      throw new BadRequestException("Mother vessel SOF is not linked to a vessel call");
    }

    return this.sofRepository.createDailyDischarge({
      vesselCallId: sof.vesselCallId,
      reportDate: parseRequiredDate(dto.reportDate, "reportDate"),
      quantity24hMt: this.toRequiredDecimal(dto.quantity24hMt, "quantity24hMt"),
      cumulativeMt: this.toDecimal(dto.cumulativeMt),
      remainingMt: this.toDecimal(dto.remainingMt),
      enteredById: dto.enteredById,
      remarks: dto.remarks
    });
  }

  async updateDailyDischarge(dischargeId: string, dto: UpdateMotherVesselDailyDischargeDto) {
    const discharge = await this.sofRepository.findDailyDischarge(dischargeId);

    if (!discharge) {
      throw new NotFoundException("Daily discharge was not found");
    }

    return this.sofRepository.updateDailyDischarge(
      dischargeId,
      this.removeUndefined({
        reportDate: dto.reportDate ? parseRequiredDate(dto.reportDate, "reportDate") : undefined,
        quantity24hMt:
          dto.quantity24hMt === undefined
            ? undefined
            : this.toRequiredDecimal(dto.quantity24hMt, "quantity24hMt"),
        cumulativeMt: this.toNullableDecimal(dto.cumulativeMt),
        remainingMt: this.toNullableDecimal(dto.remainingMt),
        enteredById: dto.enteredById,
        remarks: dto.remarks
      })
    );
  }

  async deleteDailyDischarge(dischargeId: string) {
    const discharge = await this.sofRepository.findDailyDischarge(dischargeId);

    if (!discharge) {
      throw new NotFoundException("Daily discharge was not found");
    }

    return this.sofRepository.deleteDailyDischarge(dischargeId);
  }

  /**
   * SOF identifier mirrors the parent call/trip number (1:1 by schema):
   *   - Mother SOF  →  `vesselCall.callNo`   (e.g. `26-05-10-002-001`)
   *   - Lighter SOF →  `lighterTrip.tripNo`  (e.g. `26-05-10-002-001-007`)
   *
   * Both `vesselCallId` / `lighterTripId` and `sofNo` are unique on the
   * statements_of_fact table, so reusing the parent number stays unique
   * without any prefix or timestamp suffix.
   */
  private generateSofNo(callNo: string): string {
    return callNo;
  }

  private generateLighterSofNo(tripNo: string): string {
    return tripNo;
  }

  private async requireStatementForScope(statementId: string, scope: SOFScope) {
    const row = await this.sofRepository.findStatementById(statementId);

    if (!row || row.scope !== scope) {
      throw new NotFoundException("Statement of facts was not found");
    }

    return row;
  }

  private async requireStatementById(statementId: string) {
    const row = await this.sofRepository.findStatementById(statementId);

    if (!row) {
      throw new NotFoundException("Statement of facts was not found");
    }

    return row;
  }

  private assertSofEventTypeMatchesScope(defScope: SofEventTypeScope, sofScope: SOFScope) {
    const ok =
      defScope === SofEventTypeScope.BOTH ||
      (sofScope === SOFScope.MOTHER_VESSEL && defScope === SofEventTypeScope.MOTHER_VESSEL) ||
      (sofScope === SOFScope.LIGHTER_VESSEL && defScope === SofEventTypeScope.LIGHTER_VESSEL);
    if (!ok) {
      throw new BadRequestException("This event type cannot be used on this SOF");
    }
  }

  private parsePositiveIntegerMinutes(value: string | number, fieldName: string): number {
    const n =
      typeof value === "string" ? parseInt(String(value).trim(), 10) : Math.trunc(Number(value));
    if (!Number.isFinite(n) || n <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive whole number`);
    }
    if (n > 525_600) {
      throw new BadRequestException(`${fieldName} is unreasonably large`);
    }
    return n;
  }

  private resolveSofDurationForCreate(dto: CreateSofEventDto): {
    outMinutes: number | null | undefined;
    outHours: Prisma.Decimal | null | undefined;
  } {
    if (
      dto.durationMinutes !== undefined &&
      dto.durationMinutes !== null &&
      dto.durationMinutes !== ""
    ) {
      const m = this.parsePositiveIntegerMinutes(dto.durationMinutes, "durationMinutes");
      return { outMinutes: m, outHours: null };
    }
    return {
      outMinutes: undefined,
      outHours: this.toDecimal(dto.durationHours) ?? undefined
    };
  }

  private resolveSofDurationForUpdate(
    event: NonNullable<Awaited<ReturnType<SofRepository["findSofEvent"]>>>,
    dto: UpdateSofEventDto
  ): { nextMinutes: number | null; nextHours: Prisma.Decimal | null } {
    let nextMinutes: number | null = event.durationMinutes ?? null;
    let nextHours: Prisma.Decimal | null = event.durationHours ?? null;

    if (dto.durationMinutes !== undefined) {
      if (dto.durationMinutes === null || dto.durationMinutes === "") {
        nextMinutes = null;
        if (dto.durationHours !== undefined) {
          nextHours = this.toNullableDecimal(dto.durationHours) ?? null;
          if (nextHours !== null && Number(nextHours) > 0) {
            nextMinutes = null;
          }
        } else {
          nextHours = null;
        }
      } else {
        nextMinutes = this.parsePositiveIntegerMinutes(dto.durationMinutes, "durationMinutes");
        nextHours = null;
      }
    } else if (dto.durationHours !== undefined) {
      nextHours = this.toNullableDecimal(dto.durationHours) ?? null;
      if (nextHours !== null && Number(nextHours) > 0) {
        nextMinutes = null;
      }
    }

    return { nextMinutes, nextHours };
  }

  private toDecimal(value: string | number | null | undefined): Prisma.Decimal | undefined {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    return new Prisma.Decimal(value);
  }

  private toNullableDecimal(
    value: string | number | null | undefined
  ): Prisma.Decimal | null | undefined {
    if (value === null) {
      return null;
    }

    return this.toDecimal(value);
  }

  private toRequiredDecimal(value: string | number, fieldName: string): Prisma.Decimal {
    if (value === undefined || value === null || value === "") {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return new Prisma.Decimal(value);
  }

  private removeUndefined<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(
      Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
    ) as T;
  }

  recalculateMotherLaytime(statementId: string) {
    return this.laytimeCalculation.recalculateMotherStatement(statementId);
  }

  recalculateLighterLaytime(statementId: string) {
    return this.laytimeCalculation.recalculateLighterStatement(statementId);
  }

  /** Approves the lighter-vessel SOF tied to a trip (requires current status → APPROVED transition, usually VERIFIED). */
  async approveLighterVesselSofForTrip(tripId: string, approvedByUserId: string) {
    if (!approvedByUserId?.trim()) {
      throw new BadRequestException("Authenticated user is required");
    }

    const trip = await this.sofRepository.lighterTripExistsActive(tripId);
    if (!trip) {
      throw new NotFoundException("Lighter trip was not found");
    }

    const sof = await this.sofRepository.findLighterVesselSofByLighterTripId(tripId);
    if (!sof) {
      throw new NotFoundException("No lighter vessel SOF exists for this trip");
    }

    validateSofStatusTransition(sof.status, SOFStatus.APPROVED);

    return this.sofRepository.updateLighterVesselSof(sof.id, {
      status: SOFStatus.APPROVED,
      approvedBy: approvedByUserId,
      approvedAt: new Date()
    });
  }

  private throwPrismaConflict(error: unknown, message: string): void {
    const knownError = error as Prisma.PrismaClientKnownRequestError | null;
    if (knownError && (knownError.code === "P2002" || knownError.code === "P2003")) {
      throw new ConflictException(message);
    }
  }

  /**
   * Shared shape for `createMother...` / `createLighter...` SOF inserts.
   *
   * The two scopes (mother vs lighter) only differ on the foreign key
   * (`vesselCallId` vs `lighterTripId`) and the `scope` enum — the rest of the
   * laytime/demurrage/audit columns are identical. Each caller spreads this
   * result and adds the scope-specific keys on top.
   */
  private buildSofCreateData(
    dto: CreateMotherVesselSofDto | CreateLighterVesselSofDto,
    sofNo: string
  ): Omit<Prisma.StatementOfFactsUncheckedCreateInput, "scope" | "vesselCallId" | "lighterTripId"> {
    return {
      sofNo,
      startedAt: parseOptionalDate(dto.startedAt, "startedAt"),
      completedAt: parseOptionalDate(dto.completedAt, "completedAt"),
      status: dto.status ?? SOFStatus.DRAFT,
      laytimeAllowedHours: this.toDecimal(dto.laytimeAllowedHours),
      laytimeUsedHours: this.toDecimal(dto.laytimeUsedHours),
      laytimeExcludedHours: this.toDecimal(dto.laytimeExcludedHours),
      laytimeBalanceHours: this.toDecimal(dto.laytimeBalanceHours),
      demurrageAmount: this.toDecimal(dto.demurrageAmount),
      dispatchAmount: this.toDecimal(dto.dispatchAmount),
      netAmount: this.toDecimal(dto.netAmount),
      verifiedBy: dto.verifiedBy,
      verifiedAt: parseOptionalDate(dto.verifiedAt, "verifiedAt"),
      approvedBy: dto.approvedBy,
      approvedAt: parseOptionalDate(dto.approvedAt, "approvedAt"),
      remarks: dto.remarks
    };
  }

  /** Shared field map for `updateMother...` / `updateLighter...` SOF patches. */
  private buildSofUpdateData(
    dto: UpdateMotherVesselSofDto | UpdateLighterVesselSofDto
  ): Prisma.StatementOfFactsUncheckedUpdateInput {
    return {
      sofNo: dto.sofNo,
      startedAt: parseOptionalDate(dto.startedAt, "startedAt"),
      completedAt: parseOptionalDate(dto.completedAt, "completedAt"),
      status: dto.status,
      laytimeAllowedHours: this.toNullableDecimal(dto.laytimeAllowedHours),
      laytimeUsedHours: this.toNullableDecimal(dto.laytimeUsedHours),
      laytimeExcludedHours: this.toNullableDecimal(dto.laytimeExcludedHours),
      laytimeBalanceHours: this.toNullableDecimal(dto.laytimeBalanceHours),
      laytimeCommenceAt: parseOptionalDate(dto.laytimeCommenceAt, "laytimeCommenceAt"),
      demurrageAmount: this.toNullableDecimal(dto.demurrageAmount),
      dispatchAmount: this.toNullableDecimal(dto.dispatchAmount),
      netAmount: this.toNullableDecimal(dto.netAmount),
      verifiedBy: dto.verifiedBy,
      verifiedAt: parseOptionalDate(dto.verifiedAt, "verifiedAt"),
      approvedBy: dto.approvedBy,
      approvedAt: parseOptionalDate(dto.approvedAt, "approvedAt"),
      remarks: dto.remarks
    };
  }

  /** Reject mutating a CLOSED SOF (unless explicitly staying CLOSED) and validate the requested transition. */
  private assertSofEditable(currentStatus: SOFStatus, nextStatus: SOFStatus | undefined): void {
    if (currentStatus === SOFStatus.CLOSED && nextStatus !== SOFStatus.CLOSED) {
      throw new ConflictException("Closed SOF records cannot be edited");
    }
    if (nextStatus) {
      validateSofStatusTransition(currentStatus, nextStatus);
    }
  }

  /** Reject deleting an APPROVED or CLOSED SOF — those have downstream financial dependencies. */
  private assertSofDeletable(currentStatus: SOFStatus): void {
    if (currentStatus === SOFStatus.CLOSED || currentStatus === SOFStatus.APPROVED) {
      throw new ConflictException("Approved or closed SOF records cannot be deleted");
    }
  }

  /** Wrap a repository delete with the standard FK/unique-conflict translation. */
  private async safeDeleteSof<T>(deleteFn: () => Promise<T>): Promise<T> {
    try {
      return await deleteFn();
    } catch (error: unknown) {
      this.throwPrismaConflict(
        error,
        "SOF cannot be deleted while related records still reference it"
      );
      throw error;
    }
  }
}
