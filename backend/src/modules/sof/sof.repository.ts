import { Injectable } from "@nestjs/common";
import { Prisma, SOFScope } from "@prisma/client";

import { MAX_SOF_OPTION_LIST_ROWS } from "../../lib/limits";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SofRepository {
  constructor(private readonly prisma: PrismaService) {}

  lighterTripExistsActive(id: string) {
    return this.prisma.lighterTrip.findFirst({
      where: { id, deletedAt: null },
      select: { id: true }
    });
  }

  findMotherVesselSofs(args: Prisma.StatementOfFactsFindManyArgs) {
    return this.prisma.statementOfFacts.findMany(args);
  }

  findMotherVesselSofById(id: string) {
    return this.prisma.statementOfFacts.findFirst({
      where: {
        id,
        scope: SOFScope.MOTHER_VESSEL
      },
      include: this.getMotherVesselSofInclude()
    });
  }

  findStatementById(id: string) {
    return this.prisma.statementOfFacts.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        scope: true,
        vesselCallId: true,
        lighterTripId: true
      }
    });
  }

  findLighterVesselSofById(id: string) {
    return this.prisma.statementOfFacts.findFirst({
      where: {
        id,
        scope: SOFScope.LIGHTER_VESSEL
      },
      include: this.getLighterVesselSofInclude()
    });
  }

  findLighterVesselSofByLighterTripId(lighterTripId: string) {
    return this.prisma.statementOfFacts.findFirst({
      where: {
        lighterTripId,
        scope: SOFScope.LIGHTER_VESSEL
      }
    });
  }

  findLighterTripForSof(lighterTripId: string) {
    return this.prisma.lighterTrip.findUnique({
      where: { id: lighterTripId },
      select: {
        id: true,
        tripNo: true,
        status: true,
        deletedAt: true,
        lighterVessel: {
          select: {
            id: true,
            name: true,
            isLighter: true,
            isMotherVessel: true
          }
        },
        vesselCall: {
          select: {
            id: true,
            callNo: true,
            vessel: { select: { name: true, isMotherVessel: true } }
          }
        }
      }
    });
  }

  listLighterTripOptions() {
    return this.prisma.lighterTrip.findMany({
      where: {
        deletedAt: null,
        lighterVessel: { isLighter: true }
      },
      orderBy: [{ assignedAt: "desc" }, { id: "desc" }],
      take: MAX_SOF_OPTION_LIST_ROWS,
      select: {
        id: true,
        tripNo: true,
        status: true,
        assignedAt: true,
        lighterPortCallId: true,
        lighterVessel: { select: { id: true, name: true } },
        vesselCall: {
          select: {
            id: true,
            callNo: true,
            vessel: { select: { id: true, name: true } }
          }
        },
        statementOfFacts: {
          select: { id: true, sofNo: true, status: true }
        }
      }
    });
  }

  findLighterVesselSofs(args: Prisma.StatementOfFactsFindManyArgs) {
    return this.prisma.statementOfFacts.findMany(args);
  }

  createLighterVesselSof(data: Prisma.StatementOfFactsUncheckedCreateInput) {
    return this.prisma.statementOfFacts.create({
      data,
      include: this.getLighterVesselSofInclude()
    });
  }

  updateLighterVesselSof(id: string, data: Prisma.StatementOfFactsUncheckedUpdateInput) {
    return this.prisma.statementOfFacts.update({
      where: { id },
      data,
      include: this.getLighterVesselSofInclude()
    });
  }

  deleteLighterVesselSof(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.sofEvent.deleteMany({ where: { statementId: id } });
      await tx.sofHourlyStatus.deleteMany({ where: { statementId: id } });
      return tx.statementOfFacts.delete({ where: { id } });
    });
  }

  findMotherVesselSofByVesselCallId(vesselCallId: string) {
    return this.prisma.statementOfFacts.findFirst({
      where: {
        vesselCallId,
        scope: SOFScope.MOTHER_VESSEL
      }
    });
  }

  findVesselCall(id: string) {
    return this.prisma.vesselCall.findUnique({
      where: { id },
      select: {
        id: true,
        callNo: true,
        status: true,
        vessel: {
          select: {
            id: true,
            name: true,
            isMotherVessel: true
          }
        }
      }
    });
  }

  listMotherVesselCallOptions() {
    return this.prisma.vesselCall.findMany({
      where: {
        vessel: {
          isMotherVessel: true,
          isActive: true
        }
      },
      orderBy: [{ eta: "desc" }, { id: "desc" }],
      take: MAX_SOF_OPTION_LIST_ROWS,
      select: {
        id: true,
        callNo: true,
        status: true,
        eta: true,
        currentAnchorage: true,
        vessel: {
          select: {
            id: true,
            name: true,
            imoNo: true
          }
        },
        statementOfFacts: {
          select: {
            id: true,
            sofNo: true,
            status: true
          }
        }
      }
    });
  }

  listSofUserOptions() {
    return this.prisma.user.findMany({
      where: {
        isActive: true
      },
      orderBy: [{ fullName: "asc" }, { id: "asc" }],
      take: MAX_SOF_OPTION_LIST_ROWS,
      select: {
        id: true,
        fullName: true,
        email: true,
        organization: {
          select: {
            name: true
          }
        }
      }
    });
  }

  createMotherVesselSof(data: Prisma.StatementOfFactsUncheckedCreateInput) {
    return this.prisma.statementOfFacts.create({
      data,
      include: this.getMotherVesselSofInclude()
    });
  }

  updateMotherVesselSof(id: string, data: Prisma.StatementOfFactsUncheckedUpdateInput) {
    return this.prisma.statementOfFacts.update({
      where: { id },
      data,
      include: this.getMotherVesselSofInclude()
    });
  }

  deleteMotherVesselSof(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.sofEvent.deleteMany({ where: { statementId: id } });
      await tx.sofHourlyStatus.deleteMany({ where: { statementId: id } });
      return tx.statementOfFacts.delete({ where: { id } });
    });
  }

  findActiveSofEventTypeDefinition(id: string) {
    return this.prisma.sofEventTypeDefinition.findFirst({
      where: { id, deletedAt: null, isActive: true },
      select: { id: true, scope: true, category: true }
    }) as Promise<
      | {
          id: string;
          scope: import("@prisma/client").SofEventTypeScope;
          category: "NORMAL" | "HOLD_DELAY";
        }
      | null
    >;
  }

  listSofEvents(statementId: string, limit: number, cursor?: string) {
    return this.prisma.sofEvent.findMany({
      where: { statementId },
      orderBy: [{ eventTime: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: this.getSofEventSelect()
    });
  }

  /** All events for a statement, ordered for contiguous-timeline validation. */
  listSofEventsTimelineForValidation(statementId: string) {
    return this.prisma.sofEvent.findMany({
      where: { statementId },
      orderBy: [{ eventTime: "asc" }, { id: "asc" }],
      select: { id: true, eventTime: true, durationHours: true, durationMinutes: true }
    });
  }

  findSofEvent(id: string) {
    return this.prisma.sofEvent.findUnique({
      where: { id },
      select: this.getSofEventSelect()
    });
  }

  createSofEvent(data: Prisma.SofEventUncheckedCreateInput) {
    return this.prisma.sofEvent.create({
      data,
      select: this.getSofEventSelect()
    });
  }

  /**
   * Atomic three-step split:
   *   1. Truncate the host event so it ends at the inserted event's start.
   *   2. Create the inserted event.
   *   3. If the host originally extended past the inserted event's end, clone the
   *      host into a "continuation" event covering the tail.
   * Returns the inserted event in the same shape as `createSofEvent`.
   */
  splitInsertSofEvent(args: {
    hostId: string;
    hostUpdate: Prisma.SofEventUncheckedUpdateInput;
    insert: Prisma.SofEventUncheckedCreateInput;
    continuation: Prisma.SofEventUncheckedCreateInput | null;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.sofEvent.update({
        where: { id: args.hostId },
        data: args.hostUpdate
      });
      const inserted = await tx.sofEvent.create({
        data: args.insert,
        select: this.getSofEventSelect()
      });
      if (args.continuation) {
        await tx.sofEvent.create({ data: args.continuation });
      }
      return inserted;
    });
  }

  updateSofEvent(id: string, data: Prisma.SofEventUncheckedUpdateInput) {
    return this.prisma.sofEvent.update({
      where: { id },
      data,
      select: this.getSofEventSelect()
    });
  }

  deleteSofEvent(id: string) {
    return this.prisma.sofEvent.delete({
      where: { id }
    });
  }

  listDailyDischarges(vesselCallId: string) {
    return this.prisma.motherVesselDailyDischarge.findMany({
      where: { vesselCallId },
      orderBy: [{ reportDate: "desc" }, { id: "desc" }]
    });
  }

  findDailyDischarge(id: string) {
    return this.prisma.motherVesselDailyDischarge.findUnique({
      where: { id }
    });
  }

  createDailyDischarge(data: Prisma.MotherVesselDailyDischargeUncheckedCreateInput) {
    return this.prisma.motherVesselDailyDischarge.create({ data });
  }

  updateDailyDischarge(id: string, data: Prisma.MotherVesselDailyDischargeUncheckedUpdateInput) {
    return this.prisma.motherVesselDailyDischarge.update({
      where: { id },
      data
    });
  }

  deleteDailyDischarge(id: string) {
    return this.prisma.motherVesselDailyDischarge.delete({
      where: { id }
    });
  }

  getMotherVesselSofListSelect(): Prisma.StatementOfFactsSelect {
    return {
      id: true,
      sofNo: true,
      scope: true,
      vesselCallId: true,
      startedAt: true,
      completedAt: true,
      status: true,
      laytimeAllowedHours: true,
      laytimeUsedHours: true,
      laytimeExcludedHours: true,
      laytimeBalanceHours: true,
      demurrageAmount: true,
      dispatchAmount: true,
      netAmount: true,
      remarks: true,
      createdAt: true,
      updatedAt: true,
      vesselCall: {
        select: {
          id: true,
          callNo: true,
          status: true,
          eta: true,
          ata: true,
          currentAnchorage: true,
          cargoNameSnapshot: true,
          approxTotalWeightTon: true,
          totalDischargeMt: true,
          dischargeStartedAt: true,
          dischargeCompletedAt: true,
          vessel: {
            select: {
              id: true,
              name: true,
              imoNo: true
            }
          },
          cnf: {
            select: { name: true }
          },
          arrivalLocation: {
            select: { id: true, name: true, type: true }
          },
          _count: {
            select: {
              lighterTrips: true,
              lighterAssignments: true
            }
          }
        }
      },
      _count: {
        select: {
          events: true,
          hourlyStatuses: true
        }
      }
    };
  }

  /** Full mother-vessel call shape for SOF detail (mother SOF + lighter SOF via trip). */
  private getVesselCallDetailSelect(): Prisma.VesselCallSelect {
    return {
      id: true,
      callNo: true,
      status: true,
      eta: true,
      etd: true,
      ata: true,
      atd: true,
      anchorDroppedAt: true,
      norTenderedAt: true,
      norAcceptedAt: true,
      norRejectedAt: true,
      norNumber: true,
      laytimeTimeZone: true,
      laytimeCommenceAt: true,
      readyToDischargeAt: true,
      dischargeStartedAt: true,
      dischargeCompletedAt: true,
      anchorUpAt: true,
      cargoNameSnapshot: true,
      approxTotalWeightTon: true,
      toleranceMinusPct: true,
      tolerancePlusPct: true,
      holdReason: true,
      currentAnchorage: true,
      isAnchored: true,
      isAlongside: true,
      totalStages: true,
      completedStages: true,
      lastStageCompletedAt: true,
      nextStageExpectedAt: true,
      anchorageDischargeMt: true,
      alongsideDischargeMt: true,
      totalDischargeMt: true,
      createdAt: true,
      updatedAt: true,
      arrivalLocation: {
        select: { id: true, name: true, type: true }
      },
      cnf: {
        select: { name: true }
      },
      importContract: {
        select: {
          id: true,
          contractNo: true,
          dischargeRateMtPerDay: true,
          dischargeRateUnit: true,
          currency: true,
          dischargePort: true,
          excludedDays: true,
          holidaysExcluded: true,
          excludedTimePeriod: true,
          laytimeDemurrageRatePerDay: true,
          laytimeDispatchRatePerDay: true
        }
      },
      vessel: {
        select: {
          id: true,
          name: true,
          imoNo: true,
          flag: true,
          vesselType: true,
          deadweightTon: true,
          maxDraftMeters: true,
          lengthOverallM: true,
          beamM: true,
          yearBuilt: true,
          isMotherVessel: true
        }
      },
      _count: {
        select: {
          lighterTrips: true,
          lighterAssignments: true
        }
      }
    };
  }

  private getLighterVesselRegistrySelect(): Prisma.VesselSelect {
    return {
      id: true,
      name: true,
      imoNo: true,
      flag: true,
      vesselType: true,
      deadweightTon: true,
      maxDraftMeters: true,
      lengthOverallM: true,
      beamM: true,
      yearBuilt: true,
      isLighter: true
    };
  }

  getLighterVesselSofListSelect(): Prisma.StatementOfFactsSelect {
    return {
      id: true,
      sofNo: true,
      scope: true,
      lighterTripId: true,
      startedAt: true,
      completedAt: true,
      status: true,
      laytimeAllowedHours: true,
      laytimeUsedHours: true,
      laytimeExcludedHours: true,
      laytimeBalanceHours: true,
      demurrageAmount: true,
      dispatchAmount: true,
      netAmount: true,
      remarks: true,
      createdAt: true,
      updatedAt: true,
      lighterTrip: {
        select: {
          id: true,
          tripNo: true,
          status: true,
          assignedAt: true,
          alongsideDate: true,
          loadingCompletedAt: true,
          arrivedGhatDate: true,
          lighterPortCallId: true,
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
              eta: true,
              ata: true,
              currentAnchorage: true,
              cargoNameSnapshot: true,
              approxTotalWeightTon: true,
              totalDischargeMt: true,
              dischargeStartedAt: true,
              dischargeCompletedAt: true,
              vessel: {
                select: {
                  id: true,
                  name: true,
                  imoNo: true
                }
              },
              cnf: {
                select: { name: true }
              },
              arrivalLocation: {
                select: { id: true, name: true, type: true }
              },
              _count: {
                select: {
                  lighterTrips: true,
                  lighterAssignments: true
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          events: true,
          hourlyStatuses: true
        }
      }
    } satisfies Prisma.StatementOfFactsSelect;
  }

  private getLighterVesselSofInclude(): Prisma.StatementOfFactsInclude {
    return {
      lighterTrip: {
        select: {
          id: true,
          tripNo: true,
          status: true,
          assignedAt: true,
          alongsideDate: true,
          loadingStartedAt: true,
          loadingCompletedAt: true,
          departedMvDate: true,
          arrivedGhatDate: true,
          unloadStartedAt: true,
          unloadCompletedAt: true,
          lighterVessel: {
            select: this.getLighterVesselRegistrySelect()
          },
          vesselCall: {
            select: this.getVesselCallDetailSelect()
          }
        }
      },
      events: {
        orderBy: [{ eventTime: "desc" }, { id: "desc" }],
        take: 25,
        select: this.getSofEventSelect()
      },
      hourlyStatuses: {
        orderBy: [{ hourStartAt: "desc" }, { id: "desc" }],
        take: 24
      }
    };
  }

  private getMotherVesselSofInclude(): Prisma.StatementOfFactsInclude {
    return {
      vesselCall: {
        select: this.getVesselCallDetailSelect()
      },
      events: {
        orderBy: [{ eventTime: "desc" }, { id: "desc" }],
        take: 25,
        select: this.getSofEventSelect()
      },
      hourlyStatuses: {
        orderBy: [{ hourStartAt: "desc" }, { id: "desc" }],
        take: 24
      }
    };
  }

  private getSofEventSelect(): Prisma.SofEventSelect {
    return {
      id: true,
      statementId: true,
      eventTypeId: true,
      eventTypeDefinition: {
        select: { id: true, code: true, name: true, category: true }
      },
      eventTime: true,
      durationHours: true,
      durationMinutes: true,
      countsAsLaytime: true,
      laytimeImpactHours: true,
      location: true,
      anchorageId: true,
      robQuantityMt: true,
      dischargeQuantityMt: true,
      cumulativeDischargeMt: true,
      isHold: true,
      holdReason: true,
      responsibleParty: true,
      laytimeAccount: true,
      referenceNo: true,
      remarks: true,
      supportingDocuments: true,
      createdBy: true,
      createdByUser: {
        select: { id: true, fullName: true, email: true }
      },
      verifiedBy: true,
      verifiedAt: true,
      operationBatchId: true,
      createdAt: true,
      updatedAt: true
    };
  }
}
