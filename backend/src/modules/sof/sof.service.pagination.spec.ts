import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SOFScope } from "@prisma/client";

import { SofService } from "./sof.service";

/**
 * Regression test for the cursor-pagination off-by-one bug.
 *
 * Background: `SofService.listSofEvents` fetches `limit + 1` rows from the
 * repository so it can detect whether there is a next page. The next page is
 * then fetched with `cursor: { id: <prev nextCursor> }, skip: 1`, which means
 * Prisma skips the cursor row itself.
 *
 * Therefore `nextCursor` MUST be the id of the LAST RETURNED row
 * (`rows[limit - 1]`). The buggy version used `rows[limit]` (the probe row),
 * which silently dropped one event at every page boundary.
 *
 * This test verifies that paginating through a statement with more events than
 * a single page can hold returns every event exactly once, in the correct
 * (eventTime DESC, id DESC) order.
 */

type FakeEvent = { id: string; eventTime: Date };

function buildFakeEvents(count: number): FakeEvent[] {
  const base = new Date("2026-04-01T00:00:00Z").getTime();
  return Array.from({ length: count }, (_, idx) => ({
    id: `ev_${String(idx).padStart(4, "0")}`,
    eventTime: new Date(base + idx * 60 * 60 * 1000)
  }));
}

function sortEventsDescending(events: FakeEvent[]): FakeEvent[] {
  return [...events].sort((a, b) => {
    const t = b.eventTime.getTime() - a.eventTime.getTime();
    return t !== 0 ? t : b.id.localeCompare(a.id);
  });
}

function makeFakeRepository(events: FakeEvent[]) {
  const sorted = sortEventsDescending(events);
  return {
    listSofEvents(_statementId: string, limit: number, cursor?: string) {
      let startIdx = 0;
      if (cursor) {
        const idx = sorted.findIndex((row) => row.id === cursor);
        if (idx < 0) return Promise.resolve([] as FakeEvent[]);
        startIdx = idx + 1; // mirrors Prisma's `cursor + skip: 1` semantics
      }
      return Promise.resolve(sorted.slice(startIdx, startIdx + limit + 1));
    }
  };
}

async function collectAllEvents(service: SofService, statementId: string) {
  const seen: FakeEvent[] = [];
  let cursor: string | undefined;
  let pageCount = 0;
  const safety = 50;
  while (pageCount < safety) {
    const result = (await service.listSofEvents(
      statementId,
      { cursor, limit: 25 } as never,
      SOFScope.MOTHER_VESSEL
    )) as { data: FakeEvent[]; nextCursor: string | null };
    seen.push(...result.data);
    pageCount += 1;
    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }
  if (pageCount >= safety) throw new Error("pagination did not terminate");
  return seen;
}

function makeServiceWithRepo(events: FakeEvent[]) {
  const repo = makeFakeRepository(events);
  const service = new SofService(
    repo as never,
    {} as never,
    {} as never
  );
  // Bypass the auth/scope check; we are only exercising cursor pagination.
  (service as unknown as { requireStatementForScope: () => Promise<unknown> }).requireStatementForScope =
    async () => ({});
  return service;
}

describe("SofService.listSofEvents cursor pagination", () => {
  it("returns every event exactly once across multiple pages (57 events, limit 25)", async () => {
    const events = buildFakeEvents(57);
    const expected = sortEventsDescending(events).map((row) => row.id);

    const service = makeServiceWithRepo(events);
    const seen = await collectAllEvents(service, "stmt_1");
    const seenIds = seen.map((row) => row.id);

    assert.equal(seenIds.length, 57, "all 57 events must be returned");
    assert.deepEqual(seenIds, expected, "events must be returned in order with no gaps or duplicates");
    assert.equal(new Set(seenIds).size, 57, "events must not be duplicated");
  });

  it("does not drop the row at any page boundary (exact multiple of page size)", async () => {
    const events = buildFakeEvents(50);
    const expected = sortEventsDescending(events).map((row) => row.id);

    const service = makeServiceWithRepo(events);
    const seen = await collectAllEvents(service, "stmt_2");
    const seenIds = seen.map((row) => row.id);

    assert.equal(seenIds.length, 50);
    assert.deepEqual(seenIds, expected);
  });

  it("returns a single page (no cursor) for SOFs with fewer events than the page size", async () => {
    const events = buildFakeEvents(10);
    const expected = sortEventsDescending(events).map((row) => row.id);

    const service = makeServiceWithRepo(events);
    const seen = await collectAllEvents(service, "stmt_3");
    const seenIds = seen.map((row) => row.id);

    assert.equal(seenIds.length, 10);
    assert.deepEqual(seenIds, expected);
  });
});
