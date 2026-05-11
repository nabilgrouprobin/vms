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
  // A = [14:30, 15:30], B = [15:00, 16:00] — overlap 15:00..15:30 (30 min).
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

test("validateSofEventTimelineNoOverlap surfaces the new range, conflicts, and remarks", () => {
  // Existing 09:00 → 12:00, prospective new 10:00 → 11:00 sits strictly inside.
  // The validator runs after `planSofEventInsertSplit` rejects this case, so
  // we expect a detailed BadRequest the user can act on.
  const existingEnd = new Date("2026-05-01T12:00:00.000Z");
  const newEnd = new Date("2026-05-01T11:00:00.000Z");
  let captured: unknown;
  try {
    validateSofEventTimelineNoOverlap([
      {
        id: "existing",
        eventTime: existingEnd,
        durationHours: null,
        durationMinutes: 180,
        remarks: "BAD WEATHER ISSUE",
        eventTypeDefinition: { name: "Weather Hold" }
      },
      { id: null, eventTime: newEnd, durationHours: null, durationMinutes: 60 }
    ]);
    assert.fail("expected validateSofEventTimelineNoOverlap to throw");
  } catch (e) {
    captured = e;
  }
  assert.ok(captured instanceof BadRequestException);
  const body = (captured as BadRequestException).getResponse() as { message?: string };
  const msg = typeof body === "string" ? body : (body.message ?? "");
  assert.match(msg, /SOF events cannot overlap/i);
  // Both ranges in the message are formatted as `YYYY-MM-DD HH:mm → YYYY-MM-DD HH:mm`.
  assert.match(msg, /\d{4}-\d{2}-\d{2} \d{2}:\d{2} → \d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  assert.match(msg, /1 existing event\(s\)/);
  assert.match(msg, /60 min overlap/);
  assert.match(msg, /Weather Hold/);
  assert.match(msg, /BAD WEATHER ISSUE/);
});

test("validateSofEventTimelineNoOverlap lists ALL conflicting existing events", () => {
  // Two existing back-to-back events (09:00→10:00 and 10:00→11:00). The new
  // event spans the entire range, so it should collide with BOTH and the
  // error should enumerate each one.
  const a = new Date("2026-05-01T10:00:00.000Z");
  const b = new Date("2026-05-01T11:00:00.000Z");
  const newEnd = new Date("2026-05-01T11:00:00.000Z");
  let captured: unknown;
  try {
    validateSofEventTimelineNoOverlap([
      {
        id: "a",
        eventTime: a,
        durationHours: null,
        durationMinutes: 60,
        remarks: "FIRST",
        eventTypeDefinition: { name: "TypeA" }
      },
      {
        id: "b",
        eventTime: b,
        durationHours: null,
        durationMinutes: 60,
        remarks: "SECOND",
        eventTypeDefinition: { name: "TypeB" }
      },
      // 09:00 → 11:00 prospective new event spans both existing events.
      { id: null, eventTime: newEnd, durationHours: null, durationMinutes: 120 }
    ]);
    assert.fail("expected validateSofEventTimelineNoOverlap to throw");
  } catch (e) {
    captured = e;
  }
  assert.ok(captured instanceof BadRequestException);
  const body = (captured as BadRequestException).getResponse() as { message?: string };
  const msg = typeof body === "string" ? body : (body.message ?? "");
  assert.match(msg, /2 existing event\(s\)/);
  assert.match(msg, /TypeA/);
  assert.match(msg, /TypeB/);
  assert.match(msg, /FIRST/);
  assert.match(msg, /SECOND/);
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
