import assert from "node:assert/strict";
import { test } from "node:test";
import { Prisma } from "@prisma/client";

import { BadRequestException } from "@nestjs/common";

import { validateSofEventTimelineNoOverlap, findTimelineSplitHost } from "./sof.validator";

test("validateSofEventTimelineNoOverlap allows back-to-back windows that touch at the boundary", () => {
  const t0 = new Date("2026-05-01T15:00:00.000Z");
  const t1 = new Date("2026-05-01T16:00:00.000Z");
  validateSofEventTimelineNoOverlap([
    { id: "a", eventTime: t0, durationHours: new Prisma.Decimal(1), durationMinutes: null },
    { id: "b", eventTime: t1, durationHours: new Prisma.Decimal(1), durationMinutes: null }
  ]);
});

test("validateSofEventTimelineNoOverlap allows a gap between two events with duration", () => {
  const t0 = new Date("2026-05-01T15:00:00.000Z");
  const t1 = new Date("2026-05-01T16:00:00.000Z");
  validateSofEventTimelineNoOverlap([
    { id: "a", eventTime: t0, durationHours: new Prisma.Decimal(1), durationMinutes: null },
    { id: "b", eventTime: t1, durationHours: new Prisma.Decimal(0.25), durationMinutes: null }
  ]);
});

test("validateSofEventTimelineNoOverlap allows out-of-order events without duration", () => {
  const earlier = new Date("2026-05-01T15:00:00.000Z");
  const later = new Date("2026-05-01T16:30:00.000Z");
  validateSofEventTimelineNoOverlap([
    { id: "a", eventTime: later, durationHours: new Prisma.Decimal(1), durationMinutes: null },
    { id: "b", eventTime: earlier, durationHours: null, durationMinutes: null }
  ]);
});

test("validateSofEventTimelineNoOverlap rejects two windows that intersect", () => {
  // A = [14:30, 15:30], B = [15:00, 16:00] — overlap 14:30..16:00 by 30 min.
  const aEnd = new Date("2026-05-01T15:30:00.000Z");
  const bEnd = new Date("2026-05-01T16:00:00.000Z");
  assert.throws(
    () =>
      validateSofEventTimelineNoOverlap([
        { id: "a", eventTime: aEnd, durationHours: null, durationMinutes: 60 },
        { id: "b", eventTime: bEnd, durationHours: null, durationMinutes: 60 }
      ]),
    BadRequestException
  );
});

test("validateSofEventTimelineNoOverlap allows a no-duration row inside another's window", () => {
  const windowEnd = new Date("2026-05-01T16:00:00.000Z");
  const insideMarker = new Date("2026-05-01T15:30:00.000Z");
  validateSofEventTimelineNoOverlap([
    { id: "a", eventTime: windowEnd, durationHours: null, durationMinutes: 60 },
    { id: "b", eventTime: insideMarker, durationHours: null, durationMinutes: null }
  ]);
});

test("findTimelineSplitHost finds a host when duration is only implied by chaining", () => {
  const completedEnd = new Date("2026-05-10T16:00:00.000Z");
  const anchorUpEnd = new Date("2026-05-10T17:00:00.000Z");
  const m = findTimelineSplitHost(
    [
      { id: "c", eventTime: completedEnd, durationHours: new Prisma.Decimal(1), durationMinutes: null },
      { id: "a", eventTime: anchorUpEnd, durationHours: null, durationMinutes: null }
    ],
    new Date("2026-05-10T16:15:00.000Z").getTime(),
    new Date("2026-05-10T16:30:00.000Z").getTime()
  );
  assert.equal(m?.hostId, "a");
});

test("findTimelineSplitHost returns null when the slice is not contained in any single period", () => {
  const completedEnd = new Date("2026-05-10T16:00:00.000Z");
  const anchorUpEnd = new Date("2026-05-10T17:00:00.000Z");
  const m = findTimelineSplitHost(
    [
      { id: "c", eventTime: completedEnd, durationHours: new Prisma.Decimal(1), durationMinutes: null },
      { id: "a", eventTime: anchorUpEnd, durationHours: null, durationMinutes: null }
    ],
    new Date("2026-05-10T15:45:00.000Z").getTime(),
    new Date("2026-05-10T16:15:00.000Z").getTime()
  );
  assert.equal(m, null);
});
