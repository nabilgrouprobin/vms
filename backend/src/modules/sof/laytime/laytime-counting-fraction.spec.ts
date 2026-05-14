import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyLaytimeCountingFractionToSegments,
  resolveLaytimeCountingFractionFromContract
} from "./laytime-counting-fraction";
import type { LaytimeSegment } from "./laytime-event-accumulation";

describe("resolveLaytimeCountingFractionFromContract", () => {
  it("prefers explicit laytimeCountingFraction", () => {
    const f = resolveLaytimeCountingFractionFromContract({
      laytimeCountingFraction: { toString: () => "0.6" },
      workableHatches: 5,
      totalHatches: 6
    });
    assert.equal(f, 0.6);
  });

  it("derives from hatches when explicit fraction absent", () => {
    const f = resolveLaytimeCountingFractionFromContract({
      laytimeCountingFraction: null,
      workableHatches: 5,
      totalHatches: 6
    });
    assert.ok(Math.abs((f ?? 0) - 5 / 6) < 1e-9);
  });

  it("returns null when nothing configured", () => {
    assert.equal(
      resolveLaytimeCountingFractionFromContract({
        laytimeCountingFraction: null,
        workableHatches: null,
        totalHatches: null
      }),
      null
    );
  });
});

describe("applyLaytimeCountingFractionToSegments", () => {
  it("scales counting hours when no explicit impact", () => {
    const seg: LaytimeSegment = {
      periodFrom: new Date("2024-01-01T00:00:00.000Z"),
      periodTo: new Date("2024-01-01T10:00:00.000Z"),
      elapsedWallHours: 10,
      countingHours: 10,
      countsAsLaytime: true,
      closingEventId: "e1",
      accumulatedUsedHours: 10
    };
    const events = new Map([["e1", { laytimeImpactHours: null }]]);
    const out = applyLaytimeCountingFractionToSegments([seg], 0.5, events);
    assert.equal(out[0].countingHours, 5);
    assert.equal(out[0].accumulatedUsedHours, 5);
  });

  it("skips scaling when laytimeImpactHours is set", () => {
    const seg: LaytimeSegment = {
      periodFrom: new Date("2024-01-01T00:00:00.000Z"),
      periodTo: new Date("2024-01-01T10:00:00.000Z"),
      elapsedWallHours: 10,
      countingHours: 2,
      countsAsLaytime: true,
      closingEventId: "e1",
      accumulatedUsedHours: 2
    };
    const events = new Map([["e1", { laytimeImpactHours: { toString: () => "2" } }]]);
    const out = applyLaytimeCountingFractionToSegments([seg], 0.5, events);
    assert.equal(out[0].countingHours, 2);
    assert.equal(out[0].accumulatedUsedHours, 2);
  });
});
