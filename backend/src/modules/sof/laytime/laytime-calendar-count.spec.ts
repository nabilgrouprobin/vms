import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyImportContractCalendarToMotherSegments,
  countableHoursOutsideExcludedWeekdays,
  parseExcludedWeekdays
} from "./laytime-calendar-count";
import type { LaytimeSegment } from "./laytime-event-accumulation";

describe("parseExcludedWeekdays", () => {
  it("parses known day names case-insensitively", () => {
    const s = parseExcludedWeekdays(["Sunday", "FRIDAY"]);
    assert.ok(s.has(0));
    assert.ok(s.has(5));
    assert.equal(s.size, 2);
  });
});

describe("countableHoursOutsideExcludedWeekdays", () => {
  it("returns full span when no excluded days", () => {
    const from = new Date("2024-06-03T00:00:00.000Z");
    const to = new Date("2024-06-03T06:00:00.000Z");
    const h = countableHoursOutsideExcludedWeekdays(from, to, new Set(), "UTC");
    assert.equal(h, 6);
  });

  it("excludes Sunday hours in UTC", () => {
    const from = new Date("2024-06-02T12:00:00.000Z");
    const to = new Date("2024-06-03T12:00:00.000Z");
    const excluded = parseExcludedWeekdays(["SUNDAY"]);
    const h = countableHoursOutsideExcludedWeekdays(from, to, excluded, "UTC");
    assert.equal(h, 12);
  });
});

describe("applyImportContractCalendarToMotherSegments", () => {
  it("does not change segments when explicit laytime impact is set", () => {
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
    const { segments, used, excluded } = applyImportContractCalendarToMotherSegments(
      [seg],
      events,
      ["SUNDAY", "SATURDAY"],
      "UTC",
      null
    );
    assert.equal(used, 2);
    assert.equal(excluded, 0);
    assert.equal(segments[0].countingHours, 2);
  });

  it("OODDA: after allowed laytime is used, excluded weekdays count in full", () => {
    const fri: LaytimeSegment = {
      periodFrom: new Date("2024-06-07T00:00:00.000Z"),
      periodTo: new Date("2024-06-07T10:00:00.000Z"),
      elapsedWallHours: 10,
      countingHours: 10,
      countsAsLaytime: true,
      closingEventId: "e1",
      accumulatedUsedHours: 10
    };
    const sat: LaytimeSegment = {
      periodFrom: new Date("2024-06-07T10:00:00.000Z"),
      periodTo: new Date("2024-06-08T10:00:00.000Z"),
      elapsedWallHours: 24,
      countingHours: 24,
      countsAsLaytime: true,
      closingEventId: "e2",
      accumulatedUsedHours: 34
    };
    const events = new Map([
      ["e1", { laytimeImpactHours: null }],
      ["e2", { laytimeImpactHours: null }]
    ]);
    const { segments, used } = applyImportContractCalendarToMotherSegments(
      [fri, sat],
      events,
      ["SATURDAY", "SUNDAY"],
      "UTC",
      10
    );
    assert.equal(segments[0].countingHours, 10);
    assert.equal(segments[1].countingHours, 24);
    assert.equal(used, 34);
  });

  it("without allowed hours passed, weekend strip applies (no OODDA)", () => {
    const fri: LaytimeSegment = {
      periodFrom: new Date("2024-06-07T00:00:00.000Z"),
      periodTo: new Date("2024-06-07T10:00:00.000Z"),
      elapsedWallHours: 10,
      countingHours: 10,
      countsAsLaytime: true,
      closingEventId: "e1",
      accumulatedUsedHours: 10
    };
    const sat: LaytimeSegment = {
      periodFrom: new Date("2024-06-07T10:00:00.000Z"),
      periodTo: new Date("2024-06-08T10:00:00.000Z"),
      elapsedWallHours: 24,
      countingHours: 24,
      countsAsLaytime: true,
      closingEventId: "e2",
      accumulatedUsedHours: 34
    };
    const events = new Map([
      ["e1", { laytimeImpactHours: null }],
      ["e2", { laytimeImpactHours: null }]
    ]);
    const { segments, used } = applyImportContractCalendarToMotherSegments(
      [fri, sat],
      events,
      ["SATURDAY", "SUNDAY"],
      "UTC",
      null
    );
    assert.equal(segments[0].countingHours, 10);
    assert.equal(segments[1].countingHours, 14);
    assert.equal(used, 24);
  });
});
