import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BadRequestException, NotFoundException } from "@nestjs/common";
import { LighterTripStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { LighterTripsService } from "./lighter-trips.service";

function detailRow(remarks: string | null) {
  return {
    id: "t1",
    tripNo: "TN-1",
    status: LighterTripStatus.PLANNED,
    remarks,
    assignedAt: new Date(),
    laytimeCommenceAt: null,
    wayToMVReadyAt: null,
    wayToMVStartedAt: null,
    wayToMVCompletedAt: null,
    alongsideDate: null,
    loadingStartedAt: null,
    loadingCompletedAt: null,
    departedMvDate: null,
    wayToGhatStartedAt: null,
    wayToGhatCompletedAt: null,
    arrivedGhatDate: null,
    unloadStartedAt: null,
    unloadCompletedAt: null,
    lighterVessel: {
      id: "lv",
      name: "L",
      imoNo: null,
      flag: null,
      isLighter: true
    },
    vesselCall: {
      id: "vc",
      callNo: "C1",
      status: "AT_ANCHORAGE",
      totalDischargeMt: null,
      cargoNameSnapshot: null,
      vessel: { id: "mv", name: "M", imoNo: null }
    },
    statementOfFacts: null,
    lighterAssignment: null,
    events: [],
    _count: { events: 0, cargoes: 0 }
  };
}

function assignmentSyncSnapshot() {
  return {
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
  };
}

function svc(prisma: Partial<PrismaService> & Pick<PrismaService, "lighterTrip">) {
  let lastRemarks: string | null | undefined;
  const tx = {
    lighterTrip: {
      update: async (args: { data: { remarks?: string | null } }) => {
        if (args.data.remarks !== undefined) {
          lastRemarks = args.data.remarks ?? null;
        }
        return { id: "t1" };
      },
      findFirst: async (opts: { include?: unknown; select?: unknown }) => {
        if (opts.include) {
          return detailRow(lastRemarks ?? null);
        }
        if (opts.select && typeof opts.select === "object" && "wayToMVReadyAt" in opts.select) {
          return assignmentSyncSnapshot();
        }
        throw new Error("unexpected tx.lighterTrip.findFirst");
      }
    },
    lighterTripEvent: {
      create: async () => ({})
    },
    lighterAssignment: {
      update: async () => ({})
    }
  };

  const full = {
    ...prisma,
    $transaction: async <T>(fn: (arg: typeof tx) => Promise<T>) => fn(tx)
  } as unknown as PrismaService;

  return { service: new LighterTripsService(full), getLastRemarks: () => lastRemarks };
}

describe("LighterTripsService.getById", () => {
  it("throws NotFoundException when missing", async () => {
    const { service } = svc({
      lighterTrip: {
        findFirst: async () => null,
        findMany: async () => [],
        update: async () => {
          throw new Error("unexpected update");
        }
      } as unknown as PrismaService["lighterTrip"]
    });

    await assert.rejects(
      () => service.getById("missing"),
      (err: unknown) => err instanceof NotFoundException
    );
  });
});

describe("LighterTripsService.update", () => {
  it("throws NotFoundException when trip missing", async () => {
    const { service } = svc({
      lighterTrip: {
        findFirst: async () => null,
        findMany: async () => [],
        update: async () => {
          throw new Error("unexpected update");
        }
      } as unknown as PrismaService["lighterTrip"]
    });

    await assert.rejects(
      () => service.update("x", { remarks: "a" }),
      (err: unknown) => err instanceof NotFoundException
    );
  });

  it("throws BadRequestException when trip is closed", async () => {
    const { service } = svc({
      lighterTrip: {
        findFirst: async () => ({
          id: "t1",
          status: LighterTripStatus.CLOSED,
          vesselCallId: "vc",
          lighterVesselId: "lv",
          lighterAssignmentId: null
        }),
        findMany: async () => [],
        update: async () => {
          throw new Error("unexpected update");
        }
      } as unknown as PrismaService["lighterTrip"]
    });

    await assert.rejects(
      () => service.update("t1", { remarks: "a" }),
      (err: unknown) => err instanceof BadRequestException
    );
  });

  it("throws BadRequestException when no fields provided", async () => {
    const { service } = svc({
      lighterTrip: {
        findFirst: async () => ({
          id: "t1",
          status: LighterTripStatus.PLANNED,
          vesselCallId: "vc",
          lighterVesselId: "lv",
          lighterAssignmentId: null
        }),
        findMany: async () => [],
        update: async () => {
          throw new Error("unexpected update");
        }
      } as unknown as PrismaService["lighterTrip"]
    });

    await assert.rejects(
      () => service.update("t1", {}),
      (err: unknown) => err instanceof BadRequestException
    );
  });

  it("persists remarks when allowed", async () => {
    const { service, getLastRemarks } = svc({
      lighterTrip: {
        findFirst: async (opts: { select?: { vesselCallId?: boolean } }) => {
          if (opts?.select?.vesselCallId !== undefined) {
            return {
              id: "t1",
              status: LighterTripStatus.PLANNED,
              vesselCallId: "vc",
              lighterVesselId: "lv",
              lighterAssignmentId: null
            };
          }
          return null;
        },
        findMany: async () => [],
        update: async () => {
          throw new Error("unexpected update");
        }
      } as unknown as PrismaService["lighterTrip"]
    });

    await service.update("t1", { remarks: "note" });
    assert.equal(getLastRemarks(), "note");
  });
});

describe("LighterTripsService.create", () => {
  it("rejects when the lighter hull already has an unfinished trip", async () => {
    const prisma = {
      lighterAssignment: {
        findFirst: async () => ({
          id: "asg",
          vesselCallId: "vc1",
          trip: null,
          deletedAt: null
        })
      },
      vessel: {
        findFirst: async () => ({ id: "lv1" })
      },
      lighterTrip: {
        findFirst: async (args: { where?: { status?: { notIn?: LighterTripStatus[] } } }) => {
          if (args?.where?.status?.notIn) {
            return { id: "existing", tripNo: "LT-X", status: LighterTripStatus.LOADING };
          }
          return null;
        },
        findMany: async () => [],
        update: async () => {
          throw new Error("unexpected");
        }
      },
      $transaction: async () => {
        throw new Error("should not reach transaction");
      }
    } as unknown as PrismaService;

    const service = new LighterTripsService(prisma);
    await assert.rejects(
      () =>
        service.create(
          { lighterAssignmentId: "asg", lighterVesselId: "lv1", remarks: null },
          undefined
        ),
      (err: unknown) => err instanceof BadRequestException
    );
  });
});

describe("LighterTripsService.list", () => {
  it("returns nextCursor when more than limit rows exist", async () => {
    const rows = Array.from({ length: 21 }, (_, i) => ({
      id: `id-${i}`,
      tripNo: `T-${i}`,
      status: LighterTripStatus.PLANNED,
      assignedAt: new Date(),
      lighterVessel: { id: "lv", name: "L", imoNo: null },
      vesselCall: {
        id: "vc",
        callNo: "C",
        status: "AT_ANCHORAGE" as const,
        vessel: { id: "v", name: "M" }
      },
      statementOfFacts: []
    }));

    const { service } = svc({
      lighterTrip: {
        findFirst: async () => null,
        findMany: async () => rows,
        update: async () => {
          throw new Error("unexpected update");
        }
      } as unknown as PrismaService["lighterTrip"]
    });

    const page = await service.list({ limit: "20" });
    assert.equal(page.data.length, 20);
    assert.equal(page.nextCursor, "id-20");
    assert.equal(page.limit, 20);
  });
});
