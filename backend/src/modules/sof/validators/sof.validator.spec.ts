import assert from "node:assert/strict";
import { test } from "node:test";
import { Prisma } from "@prisma/client";

import { BadRequestException } from "@nestjs/common";

import { validateSofEventTimelineNoGaps } from "./sof.validator";

test("validateSofEventTimelineNoGaps allows chain when duration start matches previous end", () => {
  const t0 = new Date("2026-05-01T15:00:00.000Z");
  const t1 = new Date("2026-05-01T16:00:00.000Z");
  validateSofEventTimelineNoGaps([
    { id: "a", eventTime: t0, durationHours: new Prisma.Decimal(1), durationMinutes: null },
    { id: "b", eventTime: t1, durationHours: new Prisma.Decimal(1), durationMinutes: null }
  ]);
});

test("validateSofEventTimelineNoGaps rejects gap when duration implies late start", () => {
  const t0 = new Date("2026-05-01T15:00:00.000Z");
  const t1 = new Date("2026-05-01T16:00:00.000Z");
  assert.throws(
    () =>
      validateSofEventTimelineNoGaps([
        { id: "a", eventTime: t0, durationHours: new Prisma.Decimal(1), durationMinutes: null },
        { id: "b", eventTime: t1, durationHours: new Prisma.Decimal(0.25), durationMinutes: null }
      ]),
    BadRequestException
  );
});

test("validateSofEventTimelineNoGaps allows implicit chain without duration", () => {
  const t0 = new Date("2026-05-01T15:00:00.000Z");
  const t1 = new Date("2026-05-01T16:30:00.000Z");
  validateSofEventTimelineNoGaps([
    { id: "a", eventTime: t0, durationHours: new Prisma.Decimal(1), durationMinutes: null },
    { id: "b", eventTime: t1, durationHours: null, durationMinutes: null }
  ]);
});

test("validateSofEventTimelineNoGaps allows chain when durationMinutes matches previous end", () => {
  const t0 = new Date("2026-05-01T15:00:00.000Z");
  const t1 = new Date("2026-05-01T16:00:00.000Z");
  validateSofEventTimelineNoGaps([
    { id: "a", eventTime: t0, durationHours: null, durationMinutes: 60 },
    { id: "b", eventTime: t1, durationHours: null, durationMinutes: 60 }
  ]);
});

test("validateSofEventTimelineNoGaps rejects gap when durationMinutes implies late start", () => {
  const t0 = new Date("2026-05-01T15:00:00.000Z");
  const t1 = new Date("2026-05-01T16:00:00.000Z");
  assert.throws(
    () =>
      validateSofEventTimelineNoGaps([
        { id: "a", eventTime: t0, durationHours: null, durationMinutes: 60 },
        { id: "b", eventTime: t1, durationHours: null, durationMinutes: 15 }
      ]),
    BadRequestException
  );
});
