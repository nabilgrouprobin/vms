import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  accumulateLaytimeFromEvents,
  accumulateLaytimeSegmentsFromEvents,
  hoursBetweenNonNegative
} from "./laytime-event-accumulation";

describe("hoursBetweenNonNegative", () => {
  it("returns non-negative hours between instants", () => {
    const a = new Date("2024-01-01T00:00:00.000Z");
    const b = new Date("2024-01-01T06:00:00.000Z");
    assert.equal(hoursBetweenNonNegative(a, b), 6);
  });

  it("returns 0 when end is before start", () => {
    const a = new Date("2024-01-01T06:00:00.000Z");
    const b = new Date("2024-01-01T00:00:00.000Z");
    assert.equal(hoursBetweenNonNegative(a, b), 0);
  });
});

describe("accumulateLaytimeFromEvents", () => {
  it("credits elapsed time to used when countsAsLaytime", () => {
    const commence = new Date("2024-01-01T00:00:00.000Z");
    const e1 = new Date("2024-01-01T04:00:00.000Z");
    const r = accumulateLaytimeFromEvents(
      [{ eventTime: e1, countsAsLaytime: true, laytimeImpactHours: null }],
      commence
    );
    assert.equal(r.used, 4);
    assert.equal(r.excluded, 0);
  });

  it("uses explicit laytimeImpactHours when set", () => {
    const commence = new Date("2024-01-01T00:00:00.000Z");
    const e1 = new Date("2024-01-01T10:00:00.000Z");
    const r = accumulateLaytimeFromEvents(
      [{ eventTime: e1, countsAsLaytime: true, laytimeImpactHours: 1.5 }],
      commence
    );
    assert.equal(r.used, 1.5);
    assert.equal(r.excluded, 0);
  });

  it("credits to excluded when not countsAsLaytime", () => {
    const commence = new Date("2024-01-01T00:00:00.000Z");
    const e1 = new Date("2024-01-01T02:00:00.000Z");
    const r = accumulateLaytimeFromEvents(
      [{ eventTime: e1, countsAsLaytime: false, laytimeImpactHours: null }],
      commence
    );
    assert.equal(r.used, 0);
    assert.equal(r.excluded, 2);
  });

  it("chains multiple events from previous anchor", () => {
    const commence = new Date("2024-01-01T00:00:00.000Z");
    const e1 = new Date("2024-01-01T02:00:00.000Z");
    const e2 = new Date("2024-01-01T05:00:00.000Z");
    const r = accumulateLaytimeFromEvents(
      [
        { eventTime: e1, countsAsLaytime: true, laytimeImpactHours: null },
        { eventTime: e2, countsAsLaytime: true, laytimeImpactHours: null }
      ],
      commence
    );
    assert.equal(r.used, 5);
    assert.equal(r.excluded, 0);
  });
});

describe("accumulateLaytimeSegmentsFromEvents", () => {
  it("matches aggregate used/excluded from accumulateLaytimeFromEvents", () => {
    const commence = new Date("2024-01-01T00:00:00.000Z");
    const e1 = new Date("2024-01-01T02:00:00.000Z");
    const e2 = new Date("2024-01-01T05:00:00.000Z");
    const events = [
      { eventTime: e1, countsAsLaytime: true, laytimeImpactHours: null as number | null },
      { eventTime: e2, countsAsLaytime: false, laytimeImpactHours: null as number | null }
    ];
    const agg = accumulateLaytimeFromEvents(events, commence);
    const { segments, used, excluded } = accumulateLaytimeSegmentsFromEvents(events, commence);
    assert.equal(used, agg.used);
    assert.equal(excluded, agg.excluded);
    assert.equal(segments.length, 2);
    const sumUsedSeg = segments
      .filter((s) => s.countsAsLaytime)
      .reduce((a, s) => a + s.countingHours, 0);
    const sumExSeg = segments
      .filter((s) => !s.countsAsLaytime)
      .reduce((a, s) => a + s.countingHours, 0);
    assert.equal(sumUsedSeg, agg.used);
    assert.equal(sumExSeg, agg.excluded);
  });

  it("carries accumulatedUsedHours only across counting segments", () => {
    const commence = new Date("2024-01-01T00:00:00.000Z");
    const e1 = new Date("2024-01-01T01:00:00.000Z");
    const e2 = new Date("2024-01-01T02:00:00.000Z");
    const e3 = new Date("2024-01-01T04:00:00.000Z");
    const { segments } = accumulateLaytimeSegmentsFromEvents(
      [
        { eventTime: e1, countsAsLaytime: true, laytimeImpactHours: null },
        { eventTime: e2, countsAsLaytime: false, laytimeImpactHours: null },
        { eventTime: e3, countsAsLaytime: true, laytimeImpactHours: null }
      ],
      commence
    );
    assert.equal(segments[0].accumulatedUsedHours, 1);
    assert.equal(segments[1].accumulatedUsedHours, 1);
    assert.equal(segments[2].accumulatedUsedHours, 3);
  });

  it("preserves closingEventId on segments", () => {
    const commence = new Date("2024-01-01T00:00:00.000Z");
    const e1 = new Date("2024-01-01T04:00:00.000Z");
    const { segments } = accumulateLaytimeSegmentsFromEvents(
      [{ eventTime: e1, countsAsLaytime: true, laytimeImpactHours: null, closingEventId: "ev-1" }],
      commence
    );
    assert.equal(segments[0].closingEventId, "ev-1");
  });
});
