import { describe, expect, it } from "vitest";

import {
  computeSofTimeSummary,
  findSofTimelineGaps,
  flatSofEventInfinitePages,
  latestSofEventMetrics,
  mergeLocalDatetimeParts,
  parseHourMinute24Input,
  resolveFreshSofGapForClick,
  sortSofEventsChronoAsc,
  sofEventWindow,
  splitLocalDatetimeInput,
  toDatetimeLocalValue
} from "./sof-event-display";

describe("sortSofEventsChronoAsc", () => {
  it("orders by eventTime ascending", () => {
    const rows = [
      { id: "b", eventTime: "2024-06-02T00:00:00.000Z" },
      { id: "a", eventTime: "2024-06-01T00:00:00.000Z" }
    ];
    const s = sortSofEventsChronoAsc(rows);
    expect(s.map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("sofEventWindow", () => {
  it("uses durationMinutes when set (exact minutes, not decimal hours)", () => {
    const r = sofEventWindow(
      {
        eventTime: "2024-01-01T12:13:00.000Z",
        durationHours: null,
        durationMinutes: 13
      },
      null
    );
    expect(r.toIso).toBe("2024-01-01T12:13:00.000Z");
    expect(r.fromIso).toBe("2024-01-01T12:00:00.000Z");
    expect(r.durationLabel).toBe("13 min");
  });

  it("uses durationHours when set (label in minutes / hours, not 0.22 h style)", () => {
    const r = sofEventWindow(
      { eventTime: "2024-01-01T12:00:00.000Z", durationHours: "2", durationMinutes: null },
      null
    );
    expect(r.toIso).toBe("2024-01-01T12:00:00.000Z");
    expect(r.fromIso).toBe("2024-01-01T10:00:00.000Z");
    expect(r.durationLabel).toBe("2 h");
  });

  it("uses gap from previous end when no duration", () => {
    const r = sofEventWindow(
      { eventTime: "2024-01-01T12:00:00.000Z", durationHours: null, durationMinutes: null },
      "2024-01-01T10:00:00.000Z"
    );
    expect(r.fromIso).toBe("2024-01-01T10:00:00.000Z");
    expect(r.durationLabel).toBe("2 h");
  });
});

describe("flatSofEventInfinitePages / latestSofEventMetrics", () => {
  it("flattens pages and picks latest by eventTime", () => {
    const rows = flatSofEventInfinitePages({
      pages: [
        {
          data: [
            {
              id: "a",
              eventTypeId: "et-a",
              eventTypeDefinition: { id: "et-a", code: "X", name: "Other", category: "NORMAL" },
              eventTime: "2024-01-01T10:00:00.000Z",
              durationHours: null,
              durationMinutes: null,
              remarks: null,
              isHold: false,
              holdReason: null,
              robQuantityMt: null,
              dischargeQuantityMt: null,
              cumulativeDischargeMt: "1",
              createdBy: "u1",
              createdByUser: { id: "u1", fullName: "U", email: "u@x" }
            }
          ]
        },
        {
          data: [
            {
              id: "b",
              eventTypeId: "et-a",
              eventTypeDefinition: { id: "et-a", code: "X", name: "Other", category: "NORMAL" },
              eventTime: "2024-01-02T10:00:00.000Z",
              durationHours: null,
              durationMinutes: null,
              remarks: null,
              isHold: false,
              holdReason: null,
              robQuantityMt: null,
              dischargeQuantityMt: null,
              cumulativeDischargeMt: "2",
              createdBy: "u1",
              createdByUser: { id: "u1", fullName: "U", email: "u@x" }
            }
          ]
        }
      ]
    });
    expect(rows).toHaveLength(2);
    const m = latestSofEventMetrics(rows);
    expect(m?.eventTime).toBe("2024-01-02T10:00:00.000Z");
    expect(m?.cumulativeDischargeMt).toBe("2");
  });
});

describe("toDatetimeLocalValue", () => {
  it("formats ISO for datetime-local input", () => {
    const v = toDatetimeLocalValue("2024-03-15T08:30:00.000Z");
    expect(v).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe("splitLocalDatetimeInput / mergeLocalDatetimeParts", () => {
  it("round-trips yyyy-mm-ddTHH:mm", () => {
    const v = "2024-06-01T14:05";
    expect(splitLocalDatetimeInput(v)).toEqual({ date: "2024-06-01", time: "14:05" });
    expect(mergeLocalDatetimeParts("2024-06-01", "14:05")).toBe("2024-06-01T14:05");
  });

  it("defaults missing time to midnight when merging", () => {
    expect(mergeLocalDatetimeParts("2024-01-02", "")).toBe("2024-01-02T00:00");
    expect(mergeLocalDatetimeParts("2024-01-02", "not-a-time")).toBe("2024-01-02T00:00");
  });

  it("returns empty date when splitting blank", () => {
    expect(splitLocalDatetimeInput("")).toEqual({ date: "", time: "" });
  });
});

describe("findSofTimelineGaps", () => {
  it("returns no gaps when events chain back-to-back", () => {
    const gaps = findSofTimelineGaps([
      { fromIso: "2026-05-01T09:00:00.000Z", toIso: "2026-05-01T10:00:00.000Z" },
      { fromIso: "2026-05-01T10:00:00.000Z", toIso: "2026-05-01T11:00:00.000Z" }
    ]);
    expect(gaps).toEqual([]);
  });

  it("flags a real gap between two events with their own duration", () => {
    const gaps = findSofTimelineGaps([
      { fromIso: "2026-05-01T09:00:00.000Z", toIso: "2026-05-01T10:00:00.000Z" },
      { fromIso: "2026-05-01T12:00:00.000Z", toIso: "2026-05-01T13:00:00.000Z" }
    ]);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatchObject({
      fromIso: "2026-05-01T10:00:00.000Z",
      toIso: "2026-05-01T12:00:00.000Z",
      spanMs: 2 * 60 * 60 * 1000
    });
  });

  it("does NOT flag a gap before a no-duration row (it implicitly chains)", () => {
    // Backend's `effectiveSofPeriodBoundsMs` chains the no-duration row from
    // 10:00 → 12:00, so a "Fill gap" button here would be rejected as overlap.
    const gaps = findSofTimelineGaps([
      { fromIso: "2026-05-01T09:00:00.000Z", toIso: "2026-05-01T10:00:00.000Z" },
      { fromIso: null, toIso: "2026-05-01T12:00:00.000Z" }
    ]);
    expect(gaps).toEqual([]);
  });

  it("flags a gap AFTER a no-duration row (its eventTime becomes the chain end)", () => {
    const gaps = findSofTimelineGaps([
      { fromIso: "2026-05-01T09:00:00.000Z", toIso: "2026-05-01T10:00:00.000Z" },
      { fromIso: null, toIso: "2026-05-01T12:00:00.000Z" },
      { fromIso: "2026-05-01T14:00:00.000Z", toIso: "2026-05-01T15:00:00.000Z" }
    ]);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatchObject({
      fromIso: "2026-05-01T12:00:00.000Z",
      toIso: "2026-05-01T14:00:00.000Z"
    });
  });

  it("does not flag a gap before the first row", () => {
    const gaps = findSofTimelineGaps([
      { fromIso: "2026-05-01T09:00:00.000Z", toIso: "2026-05-01T10:00:00.000Z" }
    ]);
    expect(gaps).toEqual([]);
  });

  it("ignores sub-minute rounding noise", () => {
    const gaps = findSofTimelineGaps([
      { fromIso: "2026-05-01T09:00:00.000Z", toIso: "2026-05-01T10:00:00.000Z" },
      { fromIso: "2026-05-01T10:00:30.000Z", toIso: "2026-05-01T11:00:00.000Z" }
    ]);
    expect(gaps).toEqual([]);
  });
});

describe("computeSofTimeSummary", () => {
  type Cat = "NORMAL" | "HOLD_DELAY";
  /**
   * Helper to build the minimum row shape `computeSofTimeSummary` needs.
   * `durationMinutes` is the explicit period preceding `eventTime`; pass
   * `null` for a no-duration marker (chained implicitly from the previous
   * event in the SOF).
   */
  function ev(eventTime: string, durationMinutes: number | null, category: Cat) {
    return {
      eventTime,
      durationHours: null,
      durationMinutes,
      isHold: category === "HOLD_DELAY",
      eventTypeDefinition: { category }
    };
  }

  it("returns the empty summary when there are no events", () => {
    const s = computeSofTimeSummary([]);
    expect(s).toEqual({
      eventCount: 0,
      firstEventIso: null,
      lastEventIso: null,
      totalSpanMs: 0,
      workingMs: 0,
      holdMs: 0,
      unclassifiedMs: 0,
      unaccountedGapMs: 0
    });
  });

  it("classifies each segment by the closing event's category (BIMCO rule)", () => {
    // Three events: A @10:00, B @12:00 NORMAL, C @13:30 HOLD.
    // Segment A→B (2h) is credited to working (B is NORMAL).
    // Segment B→C (1h30m) is credited to hold (C is HOLD).
    const s = computeSofTimeSummary([
      ev("2026-05-01T10:00:00.000Z", null, "NORMAL"),
      ev("2026-05-01T12:00:00.000Z", 120, "NORMAL"),
      ev("2026-05-01T13:30:00.000Z", 90, "HOLD_DELAY")
    ]);
    expect(s.eventCount).toBe(3);
    expect(s.firstEventIso).toBe("2026-05-01T10:00:00.000Z");
    expect(s.lastEventIso).toBe("2026-05-01T13:30:00.000Z");
    expect(s.totalSpanMs).toBe(3.5 * 3_600_000);
    expect(s.workingMs).toBe(2 * 3_600_000);
    expect(s.holdMs).toBe(1.5 * 3_600_000);
    expect(s.unclassifiedMs).toBe(0);
  });

  it("does not double-count when two events share the same eventTime", () => {
    // Two events at the same instant should add 0 to either bucket.
    const s = computeSofTimeSummary([
      ev("2026-05-01T10:00:00.000Z", null, "NORMAL"),
      ev("2026-05-01T10:00:00.000Z", null, "HOLD_DELAY"),
      ev("2026-05-01T11:00:00.000Z", 60, "NORMAL")
    ]);
    expect(s.workingMs).toBe(1 * 3_600_000); // only the 10→11 segment counts
    expect(s.holdMs).toBe(0);
  });

  it("sorts events before summarizing (unsorted input still works)", () => {
    const s = computeSofTimeSummary([
      ev("2026-05-01T13:30:00.000Z", 90, "HOLD_DELAY"),
      ev("2026-05-01T10:00:00.000Z", null, "NORMAL"),
      ev("2026-05-01T12:00:00.000Z", 120, "NORMAL")
    ]);
    expect(s.workingMs).toBe(2 * 3_600_000);
    expect(s.holdMs).toBe(1.5 * 3_600_000);
  });

  it("reports unaccounted (gap) time between two explicit-duration events that don't touch", () => {
    // A 09→10 (60min NORMAL), B 12→13 (60min NORMAL); gap 10→12 (2h).
    const s = computeSofTimeSummary([
      ev("2026-05-01T10:00:00.000Z", 60, "NORMAL"),
      ev("2026-05-01T13:00:00.000Z", 60, "NORMAL")
    ]);
    expect(s.unaccountedGapMs).toBe(2 * 3_600_000);
  });

  it("falls back to `isHold` when eventTypeDefinition.category is missing", () => {
    const s = computeSofTimeSummary([
      { eventTime: "2026-05-01T10:00:00.000Z", durationHours: null, durationMinutes: null, isHold: false },
      { eventTime: "2026-05-01T11:00:00.000Z", durationHours: null, durationMinutes: null, isHold: true },
      { eventTime: "2026-05-01T12:00:00.000Z", durationHours: null, durationMinutes: null, isHold: false }
    ]);
    expect(s.holdMs).toBe(1 * 3_600_000); // 10→11 closed by a hold
    expect(s.workingMs).toBe(1 * 3_600_000); // 11→12 closed by a normal
    expect(s.unclassifiedMs).toBe(0);
  });
});

describe("resolveFreshSofGapForClick", () => {
  /** Helper: build an event row with the minimum shape `sofEventOwnWindow` needs. */
  function ev(eventTime: string, durationMinutes: number | null) {
    return { eventTime, durationHours: null, durationMinutes };
  }

  it("returns the matching gap when the timeline still has the clicked gap intact", () => {
    // A 09→10 (60min), B 12→13 (60min); gap from 10→12.
    const result = resolveFreshSofGapForClick(
      [
        ev("2026-05-01T10:00:00.000Z", 60),
        ev("2026-05-01T13:00:00.000Z", 60)
      ],
      "2026-05-01T10:00:00.000Z",
      "2026-05-01T12:00:00.000Z"
    );
    expect(result).not.toBeNull();
    expect(result!.fromIso).toBe("2026-05-01T10:00:00.000Z");
    expect(result!.toIso).toBe("2026-05-01T12:00:00.000Z");
  });

  it("returns the shrunk gap when the timeline now has an event partially filling the clicked range", () => {
    // User clicked gap 10→14 but a 12→13 event was added since.
    // Fresh data has two gaps: 10→12 and 13→14. The largest overlap with
    // 10→14 is 10→12 (2h) — that's what we should pre-fill.
    const result = resolveFreshSofGapForClick(
      [
        ev("2026-05-01T10:00:00.000Z", 60), // A 09→10
        ev("2026-05-01T13:00:00.000Z", 60), // 12→13 ← new event
        ev("2026-05-01T15:00:00.000Z", 60) // C 14→15
      ],
      "2026-05-01T10:00:00.000Z",
      "2026-05-01T14:00:00.000Z"
    );
    expect(result).not.toBeNull();
    expect(result!.fromIso).toBe("2026-05-01T10:00:00.000Z");
    expect(result!.toIso).toBe("2026-05-01T12:00:00.000Z");
  });

  it("returns null when the clicked gap was already completely filled", () => {
    // Events now chain 09→10→11→12. No gaps exist anywhere.
    const result = resolveFreshSofGapForClick(
      [
        ev("2026-05-01T10:00:00.000Z", 60),
        ev("2026-05-01T11:00:00.000Z", 60),
        ev("2026-05-01T12:00:00.000Z", 60)
      ],
      "2026-05-01T10:00:00.000Z",
      "2026-05-01T12:00:00.000Z"
    );
    expect(result).toBeNull();
  });

  it("returns null when the clicked range does not overlap any current gap", () => {
    // Gap is 14→16 but the click was for 10→12. Different, non-overlapping
    // ranges → don't open the form with a misleading pre-fill.
    const result = resolveFreshSofGapForClick(
      [
        ev("2026-05-01T14:00:00.000Z", 60), // A 13→14
        ev("2026-05-01T17:00:00.000Z", 60) // B 16→17
      ],
      "2026-05-01T10:00:00.000Z",
      "2026-05-01T12:00:00.000Z"
    );
    expect(result).toBeNull();
  });

  it("returns null for non-finite or inverted click ranges", () => {
    expect(
      resolveFreshSofGapForClick([], "not-a-date", "2026-05-01T12:00:00.000Z")
    ).toBeNull();
    expect(
      resolveFreshSofGapForClick(
        [],
        "2026-05-01T13:00:00.000Z",
        "2026-05-01T12:00:00.000Z"
      )
    ).toBeNull();
  });
});

describe("parseHourMinute24Input", () => {
  it("normalizes colon forms", () => {
    expect(parseHourMinute24Input("9:30")).toBe("09:30");
    expect(parseHourMinute24Input("09:30")).toBe("09:30");
    expect(parseHourMinute24Input("0:0")).toBe("00:00");
    expect(parseHourMinute24Input("23:59")).toBe("23:59");
  });

  it("accepts HHMM without colon", () => {
    expect(parseHourMinute24Input("0930")).toBe("09:30");
    expect(parseHourMinute24Input("0000")).toBe("00:00");
  });

  it("returns null for empty or invalid", () => {
    expect(parseHourMinute24Input("")).toBeNull();
    expect(parseHourMinute24Input("24:00")).toBeNull();
    expect(parseHourMinute24Input("12:60")).toBeNull();
    expect(parseHourMinute24Input("99:30")).toBeNull();
  });
});
