import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DateTime } from "luxon";

import {
  contactHoursInRange,
  formatContractWeekWindowLabel,
  parseContractWeekWindow,
  type ContractWeekWindow
} from "./laytime-mother-daily-ledger";

describe("parseContractWeekWindow", () => {
  it("parses __LAYTIME_WEEK__ line", () => {
    const w = parseContractWeekWindow("__LAYTIME_WEEK__ SUNDAY 08:00 THURSDAY 17:00\nnotes", [
      "FRIDAY",
      "SATURDAY"
    ]);
    assert.equal(w.startJsDow, 0);
    assert.equal(w.startHm, "08:00");
    assert.equal(w.endJsDow, 4);
    assert.equal(w.endHm, "17:00");
  });

  it("infers from excluded days when no marker", () => {
    const w = parseContractWeekWindow(null, ["FRIDAY", "SATURDAY"]);
    assert.equal(w.startJsDow, 0);
    assert.equal(w.endJsDow, 4);
  });
});

describe("formatContractWeekWindowLabel", () => {
  it("formats 24h labels for a Sun–Thu window", () => {
    const w: ContractWeekWindow = { startJsDow: 0, startHm: "08:00", endJsDow: 4, endHm: "17:00" };
    assert.equal(formatContractWeekWindowLabel(w), "Sunday 08:00 → Thursday 17:00");
  });
});

describe("contactHoursInRange (Sun 08:00 – Thu 17:00, Asia/Dhaka)", () => {
  const zone = "Asia/Dhaka";
  const w: ContractWeekWindow = { startJsDow: 0, startHm: "08:00", endJsDow: 4, endHm: "17:00" };

  it("Sunday is 16h contact (08:00–24:00)", () => {
    const day = DateTime.fromObject({ year: 2026, month: 4, day: 5, hour: 12 }, { zone });
    const dayStart = day.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const h = contactHoursInRange(dayStart, dayEnd, dayStart, zone, w);
    assert.ok(Math.abs(h - 16) < 0.02);
  });

  it("Thursday is 17h contact (00:00–17:00)", () => {
    const day = DateTime.fromObject({ year: 2026, month: 4, day: 9, hour: 12 }, { zone });
    const dayStart = day.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const h = contactHoursInRange(dayStart, dayEnd, dayStart, zone, w);
    assert.ok(Math.abs(h - 17) < 0.02);
  });

  it("Wednesday is 24h contact", () => {
    const day = DateTime.fromObject({ year: 2026, month: 4, day: 8, hour: 12 }, { zone });
    const dayStart = day.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const h = contactHoursInRange(dayStart, dayEnd, dayStart, zone, w);
    assert.ok(Math.abs(h - 24) < 0.02);
  });

  it("Friday is 0h contact", () => {
    const day = DateTime.fromObject({ year: 2026, month: 4, day: 10, hour: 12 }, { zone });
    const dayStart = day.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const h = contactHoursInRange(dayStart, dayEnd, dayStart, zone, w);
    assert.ok(Math.abs(h - 0) < 0.02);
  });
});
