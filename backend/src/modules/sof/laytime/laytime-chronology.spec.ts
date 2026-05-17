import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { splitChronologyRowsAtLaytimeExpiry, type LaytimeChronologyRow } from "./laytime-chronology";

function row(p: Partial<LaytimeChronologyRow> & Pick<LaytimeChronologyRow, "date" | "startLocalHm" | "endLocalHm" | "toCountHours">): LaytimeChronologyRow {
  return {
    weekday: "Mon",
    fraction: 1,
    remark: "—",
    closingEventId: null,
    totalUsedHours: 0,
    onDemurrageHours: 0,
    ...p
  };
}

describe("splitChronologyRowsAtLaytimeExpiry", () => {
  it("splits when allowed laytime is crossed inside a chronology slice", () => {
    const leading = row({
      date: "2025-12-31",
      startLocalHm: "00:00",
      endLocalHm: "05:00",
      toCountHours: 5,
      remark: "A"
    });
    const long = row({
      date: "2026-01-01",
      startLocalHm: "00:00",
      endLocalHm: "10:00",
      toCountHours: 10,
      remark: "TIME COUNT"
    });
    const expanded = splitChronologyRowsAtLaytimeExpiry([leading, long], 10, "UTC");
    assert.equal(expanded.length, 3);
    assert.equal(expanded[1].toCountHours, 5);
    assert.ok(expanded[1].remark.includes("Laytime Expires"));
    assert.equal(expanded[1].endLocalHm, "05:00");
    assert.equal(expanded[2].startLocalHm, "05:00");
    assert.equal(expanded[2].toCountHours, 5);
    assert.equal(expanded[2].remark, "TIME COUNT");
  });

  it("appends expiry remark when cumulative ends exactly at allowed", () => {
    const rows = [
      row({
        date: "2026-01-01",
        startLocalHm: "08:00",
        endLocalHm: "13:00",
        toCountHours: 5,
        remark: "X"
      })
    ];
    const out = splitChronologyRowsAtLaytimeExpiry(rows, 5, "UTC");
    assert.equal(out.length, 1);
    assert.ok(out[0].remark.includes("Laytime Expires"));
  });

  it("returns a shallow copy unchanged when allowed is null", () => {
    const rows = [row({ date: "2026-01-01", startLocalHm: "00:00", endLocalHm: "01:00", toCountHours: 1 })];
    const out = splitChronologyRowsAtLaytimeExpiry(rows, null, "UTC");
    assert.equal(out.length, 1);
    assert.equal(out[0].remark, "—");
  });
});
