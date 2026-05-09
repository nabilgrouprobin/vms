import { describe, expect, it } from "vitest";

import {
  flatSofEventInfinitePages,
  latestSofEventMetrics,
  mergeLocalDatetimeParts,
  parseHourMinute24Input,
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
