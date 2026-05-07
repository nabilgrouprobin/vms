import { describe, expect, it } from "vitest";

import {
  flatSofEventInfinitePages,
  latestSofEventMetrics,
  sortSofEventsChronoAsc,
  sofEventWindow,
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
              eventTypeDefinition: { id: "et-a", code: "X", name: "Other" },
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
              eventTypeDefinition: { id: "et-a", code: "X", name: "Other" },
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
