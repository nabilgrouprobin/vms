import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DateTime } from "luxon";

import {
  buildMotherLaytimeDailyLedger,
  contactHoursInRange,
  contactWindowInRange,
  contactHoursOnCalendarDay,
  contactHoursOnNorTenderedCalendarDay,
  contactWindowOnNorTenderedCalendarDay,
  durationHoursOnCalendarDay,
  excludedWeekdayNamesFromWeekWindow,
  isJsDayInWorkSpan,
  formatContractWeekWindowLabel,
  laytimeToCountNotToCountOnDay,
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

  it("defaults to Sun 08:00 – Thu 17:00 when no marker and no excluded days", () => {
    const w = parseContractWeekWindow(null, []);
    assert.equal(w.startJsDow, 0);
    assert.equal(w.endJsDow, 4);
    assert.deepEqual(excludedWeekdayNamesFromWeekWindow(w).sort(), ["FRIDAY", "SATURDAY"]);
  });
});

describe("excludedWeekdayNamesFromWeekWindow", () => {
  it("Sun 08:00 – Thu 17:00 excludes Friday and Saturday", () => {
    const w: ContractWeekWindow = { startJsDow: 0, startHm: "08:00", endJsDow: 4, endHm: "17:00" };
    const ex = excludedWeekdayNamesFromWeekWindow(w);
    assert.deepEqual(ex.sort(), ["FRIDAY", "SATURDAY"]);
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
    const win = contactWindowInRange(dayStart, dayEnd, dayStart, zone, w);
    assert.ok(win);
    assert.equal(win.from.toFormat("HH:mm"), "08:00");
    assert.equal(win.to.toFormat("HH:mm"), "00:00");
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

  it("Saturday is 0h via contactHoursOnCalendarDay (not Thu 17h bleed)", () => {
    const day = DateTime.fromObject({ year: 2026, month: 4, day: 25, hour: 12 }, { zone });
    const dayStart = day.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const h = contactHoursOnCalendarDay(dayStart, dayStart, dayEnd, zone, w);
    assert.ok(Math.abs(h - 0) < 0.02, `Sat contact ${h}`);
  });

  it("Friday is 0h via contactHoursOnCalendarDay", () => {
    const day = DateTime.fromObject({ year: 2026, month: 4, day: 24, hour: 12 }, { zone });
    const dayStart = day.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const h = contactHoursOnCalendarDay(dayStart, dayStart, dayEnd, zone, w);
    assert.ok(Math.abs(h - 0) < 0.02, `Fri contact ${h}`);
  });
});

describe("NOR tender contact", () => {
  const zone = "Asia/Dhaka";
  const w: ContractWeekWindow = { startJsDow: 0, startHm: "08:00", endJsDow: 4, endHm: "17:00" };

  it("NOR before noon → contact from 13:00 on tender day (Sunday)", () => {
    const nor = DateTime.fromObject({ year: 2026, month: 4, day: 5, hour: 10 }, { zone });
    const dayStart = nor.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const h = contactHoursOnNorTenderedCalendarDay(dayStart, nor, dayEnd, zone, w);
    assert.equal(h, 11);
    const win = contactWindowOnNorTenderedCalendarDay(dayStart, nor, dayEnd, zone, w);
    assert.ok(win);
    assert.equal(win.from.toFormat("HH:mm"), "13:00");
  });

  it("NOR at/after noon → 0 contact on tender day", () => {
    const nor = DateTime.fromObject({ year: 2026, month: 4, day: 5, hour: 14 }, { zone });
    const dayStart = nor.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const h = contactHoursOnNorTenderedCalendarDay(dayStart, nor, dayEnd, zone, w);
    assert.equal(h, 0);
  });
});

describe("durationHoursOnCalendarDay", () => {
  const zone = "Asia/Dhaka";

  it("partial first day from commence", () => {
    const commence = DateTime.fromObject({ year: 2026, month: 4, day: 5, hour: 13 }, { zone });
    const end = DateTime.fromObject({ year: 2026, month: 4, day: 10, hour: 18 }, { zone });
    const dayStart = commence.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const h = durationHoursOnCalendarDay(dayStart, dayEnd, commence, end);
    assert.ok(Math.abs(h - 11) < 0.02);
  });
});

describe("isJsDayInWorkSpan", () => {
  const w: ContractWeekWindow = { startJsDow: 0, startHm: "08:00", endJsDow: 4, endHm: "17:00" };

  it("includes Sun–Thu only", () => {
    assert.equal(isJsDayInWorkSpan(0, w), true);
    assert.equal(isJsDayInWorkSpan(4, w), true);
    assert.equal(isJsDayInWorkSpan(5, w), false);
    assert.equal(isJsDayInWorkSpan(6, w), false);
  });
});

describe("buildMotherLaytimeDailyLedger OODDA contact hours", () => {
  const zone = "Asia/Dhaka";
  const week: ContractWeekWindow = { startJsDow: 0, startHm: "08:00", endJsDow: 4, endHm: "17:00" };
  const commence = DateTime.fromObject({ year: 2026, month: 5, day: 3, hour: 8 }, { zone }).toJSDate();

  it("uses full 24h contact on weekend days after allowed laytime is exhausted", () => {
    const ledger = buildMotherLaytimeDailyLedger({
      commenceAt: commence,
      zone,
      week,
      excludedWeekdays: ["FRIDAY", "SATURDAY"],
      freeTimeHours: 8,
      segments: [
        {
          periodFrom: commence,
          periodTo: DateTime.fromObject({ year: 2026, month: 5, day: 11, hour: 12 }, { zone }).toJSDate(),
          elapsedWallHours: 200,
          countingHours: 200,
          countsAsLaytime: true,
          closingEventId: "e1",
          accumulatedUsedHours: 200
        }
      ],
      segmentCountingUsedHours: [200],
      dailyDischarges: [],
      events: []
    });

    const sat = ledger.rows.find((r) => r.date === "2026-05-09");
    const sun = ledger.rows.find((r) => r.date === "2026-05-10");
    assert.ok(sat, "expected Saturday row");
    assert.ok(sun, "expected Sunday row");
    assert.equal(sat.onDemurrage, true);
    assert.equal(sun.onDemurrage, true);
    assert.ok(Math.abs(sat.contactHour - 24) < 0.02, `Sat contact ${sat.contactHour}`);
    assert.ok(Math.abs(sun.contactHour - 24) < 0.02, `Sun contact ${sun.contactHour}`);
    const thuBefore = ledger.rows.find((r) => r.date === "2026-05-07");
    assert.ok(thuBefore, "Thursday before demurrage weekend");
    assert.ok(
      (sat.cumulativeTotalUsedHour ?? 0) >= (thuBefore.cumulativeTotalUsedHour ?? 0) + 24 - 0.1,
      "total used grows by 24h contact on demurrage Saturday"
    );
    assert.ok(Math.abs(sat.freeTimeHour) < 0.02);
    assert.ok(Math.abs(sun.freeTimeHour) < 0.02);
  });

  it("does not credit allowance on zero-contact excluded weekdays", () => {
    const ledger = buildMotherLaytimeDailyLedger({
      commenceAt: commence,
      zone,
      week,
      excludedWeekdays: ["FRIDAY", "SATURDAY"],
      freeTimeHours: 288,
      segments: [
        {
          periodFrom: DateTime.fromObject({ year: 2026, month: 5, day: 9, hour: 8 }, { zone }).toJSDate(),
          periodTo: DateTime.fromObject({ year: 2026, month: 5, day: 9, hour: 20 }, { zone }).toJSDate(),
          elapsedWallHours: 12,
          countingHours: 12,
          countsAsLaytime: true,
          closingEventId: "e1",
          accumulatedUsedHours: 12
        }
      ],
      segmentCountingUsedHours: [12],
      dailyDischarges: [],
      events: []
    });
    const thu = ledger.rows.find((r) => r.date === "2026-05-07");
    const fri = ledger.rows.find((r) => r.date === "2026-05-08");
    assert.ok(fri, "Friday row");
    assert.ok(thu, "Thursday row");
    assert.ok(fri.contactHour < 0.02);
    assert.ok(fri.creditedLaytimeHour < 0.02);
    assert.equal(fri.cumulativeTotalUsedHour, thu!.cumulativeTotalUsedHour);
  });

  it("does not deduct allowance on a full sidebar holiday day", () => {
    const holidayStart = DateTime.fromObject(
      { year: 2026, month: 5, day: 6, hour: 0 },
      { zone }
    ).toJSDate();
    const holidayEnd = DateTime.fromObject(
      { year: 2026, month: 5, day: 7, hour: 0 },
      { zone }
    ).toJSDate();
    const ledger = buildMotherLaytimeDailyLedger({
      commenceAt: commence,
      zone,
      week,
      excludedWeekdays: ["FRIDAY", "SATURDAY"],
      holidays: [{ holidayStartAt: holidayStart, holidayEndAt: holidayEnd }],
      freeTimeHours: 288,
      segments: [
        {
          periodFrom: DateTime.fromObject({ year: 2026, month: 5, day: 6, hour: 9 }, { zone }).toJSDate(),
          periodTo: DateTime.fromObject({ year: 2026, month: 5, day: 6, hour: 18 }, { zone }).toJSDate(),
          elapsedWallHours: 9,
          countingHours: 9,
          countsAsLaytime: true,
          closingEventId: "e1",
          accumulatedUsedHours: 9
        }
      ],
      segmentCountingUsedHours: [9],
      dailyDischarges: [],
      events: []
    });
    const wed = ledger.rows.find((r) => r.date === "2026-05-06");
    const tue = ledger.rows.find((r) => r.date === "2026-05-05");
    assert.ok(wed, "Wednesday holiday row");
    assert.ok(tue, "Tuesday row");
    assert.ok(wed.creditedLaytimeHour < 0.02);
    assert.equal(wed.cumulativeTotalUsedHour, tue!.cumulativeTotalUsedHour);
  });

  it("Fri–Sun off-window: total used flat when only week marker (no explicit excluded days)", () => {
    const ledger = buildMotherLaytimeDailyLedger({
      commenceAt: DateTime.fromObject({ year: 2026, month: 4, day: 20, hour: 8 }, { zone }).toJSDate(),
      zone,
      week,
      excludedWeekdays: [],
      freeTimeHours: 288,
      segments: [
        {
          periodFrom: DateTime.fromObject({ year: 2026, month: 4, day: 23, hour: 8 }, { zone }).toJSDate(),
          periodTo: DateTime.fromObject({ year: 2026, month: 4, day: 27, hour: 8 }, { zone }).toJSDate(),
          elapsedWallHours: 96,
          countingHours: 96,
          countsAsLaytime: true,
          closingEventId: "e1",
          accumulatedUsedHours: 96
        }
      ],
      segmentCountingUsedHours: [96],
      dailyDischarges: [],
      events: []
    });
    const thu = ledger.rows.find((r) => r.date === "2026-04-23");
    const fri = ledger.rows.find((r) => r.date === "2026-04-24");
    const sat = ledger.rows.find((r) => r.date === "2026-04-25");
    const sun = ledger.rows.find((r) => r.date === "2026-04-26");
    assert.ok(thu && fri && sat && sun);
    assert.ok(thu.creditedLaytimeHour > 0.5);
    assert.ok(fri.creditedLaytimeHour < 0.02, `Fri credited ${fri.creditedLaytimeHour}`);
    assert.ok(sat.creditedLaytimeHour < 0.02, `Sat credited ${sat.creditedLaytimeHour}`);
    assert.equal(fri.cumulativeTotalUsedHour, thu.cumulativeTotalUsedHour);
    assert.equal(sat.cumulativeTotalUsedHour, thu.cumulativeTotalUsedHour);
    assert.ok(
      (sun.cumulativeTotalUsedHour ?? 0) <= (thu.cumulativeTotalUsedHour ?? 0) + 17,
      "Sun only adds contact from 08:00"
    );
  });
});

describe("to count / not to count from SOF", () => {
  const zone = "Asia/Dhaka";
  const week: ContractWeekWindow = { startJsDow: 0, startHm: "08:00", endJsDow: 4, endHm: "17:00" };
  const commence = DateTime.fromObject({ year: 2026, month: 5, day: 4, hour: 8 }, { zone }).toJSDate();

  it("splits SOF segments in contact and despatch adds back not-to-count", () => {
    const day = DateTime.fromObject({ year: 2026, month: 5, day: 4, hour: 12 }, { zone });
    const dayStart = day.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const segTo = DateTime.fromObject({ year: 2026, month: 5, day: 4, hour: 17 }, { zone }).toJSDate();
    const segFrom = DateTime.fromObject({ year: 2026, month: 5, day: 4, hour: 8 }, { zone }).toJSDate();

    const segments = [
      {
        periodFrom: segFrom,
        periodTo: DateTime.fromObject({ year: 2026, month: 5, day: 4, hour: 13 }, { zone }).toJSDate(),
        elapsedWallHours: 5,
        countingHours: 5,
        countsAsLaytime: true,
        closingEventId: "e1",
        accumulatedUsedHours: 5
      },
      {
        periodFrom: DateTime.fromObject({ year: 2026, month: 5, day: 4, hour: 13 }, { zone }).toJSDate(),
        periodTo: segTo,
        elapsedWallHours: 4,
        countingHours: 4,
        countsAsLaytime: false,
        closingEventId: "e2",
        accumulatedUsedHours: 9
      }
    ];

    const contact = contactHoursOnCalendarDay(dayStart, dayStart, dayEnd, zone, week);
    const split = laytimeToCountNotToCountOnDay(
      segments,
      dayStart,
      dayEnd,
      dayStart,
      dayEnd,
      zone,
      week,
      contact,
      false
    );
    assert.ok(Math.abs(split.toCountHour + split.notToCountHour - contact) < 0.05);

    const ledger = buildMotherLaytimeDailyLedger({
      commenceAt: commence,
      zone,
      week,
      excludedWeekdays: ["FRIDAY", "SATURDAY"],
      freeTimeHours: 100,
      segments,
      dailyDischarges: [],
      events: []
    });
    const row = ledger.rows.find((r) => r.date === "2026-05-04");
    assert.ok(row);
    if (row.contactHour > 0.05) {
      assert.ok(row.contactStartsAt);
      assert.ok(row.contactEndsAt);
    }
    assert.ok(Math.abs(row.toCountHour + row.notToCountHour - row.contactHour) < 0.05);
    assert.ok(row.despatchHour >= 0);
    assert.ok(
      Math.abs(row.despatchHour - (100 - (row.cumulativeTotalUsedHour ?? 0))) < 0.1,
      `despatch ${row.despatchHour}`
    );
  });

  it("fills unfilled contact as to-count when only count-tagged segments overlap", () => {
    const day = DateTime.fromObject({ year: 2026, month: 4, day: 22, hour: 12 }, { zone });
    const dayStart = day.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const segFrom = DateTime.fromObject({ year: 2026, month: 4, day: 22, hour: 6, minute: 30 }, { zone }).toJSDate();
    const segTo = DateTime.fromObject({ year: 2026, month: 4, day: 26, hour: 11, minute: 40 }, { zone }).toJSDate();
    const wall = 101.17;
    const countingHours = wall * 0.5;

    const segments = [
      {
        periodFrom: segFrom,
        periodTo: segTo,
        elapsedWallHours: wall,
        countingHours,
        countsAsLaytime: true,
        closingEventId: "e1",
        accumulatedUsedHours: countingHours
      }
    ];

    const contact = contactHoursOnCalendarDay(dayStart, dayStart, dayEnd, zone, week);
    const split = laytimeToCountNotToCountOnDay(
      segments,
      dayStart,
      dayEnd,
      dayStart,
      dayEnd,
      zone,
      week,
      contact,
      false
    );
    assert.ok(split.toCountHour > contact * 0.9, `expected mostly count, got ${split.toCountHour}`);
    assert.ok(split.notToCountHour < 0.05, `expected no not-count padding, got ${split.notToCountHour}`);
    assert.ok(Math.abs(split.toCountHour + split.notToCountHour - contact) < 0.05);
  });

  it("credits SOF not-count wall time on calendar day into contact not-count (May 17 style)", () => {
    const day = DateTime.fromObject({ year: 2026, month: 5, day: 17, hour: 12 }, { zone });
    const dayStart = day.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const contact = contactHoursOnCalendarDay(dayStart, dayStart, dayEnd, zone, week);
    assert.ok(Math.abs(contact - 16) < 0.05);

    const segments = [
      {
        periodFrom: DateTime.fromObject(
          { year: 2026, month: 5, day: 17, hour: 0 },
          { zone }
        ).toJSDate(),
        periodTo: DateTime.fromObject({ year: 2026, month: 5, day: 17, hour: 2 }, { zone }).toJSDate(),
        elapsedWallHours: 2,
        countingHours: 2,
        countsAsLaytime: false,
        closingEventId: "e-nc",
        accumulatedUsedHours: 0
      }
    ];

    const split = laytimeToCountNotToCountOnDay(
      segments,
      dayStart,
      dayEnd,
      dayStart,
      dayEnd,
      zone,
      week,
      contact,
      false
    );
    assert.ok(
      Math.abs(split.notToCountHour - 2) < 0.05,
      `expected 2h not count, got ${split.notToCountHour}`
    );
    assert.ok(
      Math.abs(split.toCountHour - (contact - 2)) < 0.1,
      `expected ${contact - 2}h count, got ${split.toCountHour}`
    );
  });

  it("unfilled contact on a day with no overlapping SOF defaults to count not not-count", () => {
    const day = DateTime.fromObject({ year: 2026, month: 5, day: 17, hour: 12 }, { zone });
    const dayStart = day.startOf("day");
    const dayEnd = dayStart.plus({ days: 1 });
    const contact = contactHoursOnCalendarDay(dayStart, dayStart, dayEnd, zone, week);
    assert.ok(Math.abs(contact - 16) < 0.05, `Sun contact ${contact}`);

    const segments = [
      {
        periodFrom: DateTime.fromObject(
          { year: 2026, month: 5, day: 15, hour: 6, minute: 40 },
          { zone }
        ).toJSDate(),
        periodTo: DateTime.fromObject({ year: 2026, month: 5, day: 16, hour: 0 }, { zone }).toJSDate(),
        elapsedWallHours: 17.33,
        countingHours: 17.33,
        countsAsLaytime: true,
        closingEventId: "e1",
        accumulatedUsedHours: 17.33
      }
    ];

    const split = laytimeToCountNotToCountOnDay(
      segments,
      dayStart,
      dayEnd,
      dayStart,
      dayEnd,
      zone,
      week,
      contact,
      false
    );
    assert.ok(
      split.notToCountHour < 0.05,
      `expected no false not-count on idle Sunday, got ${split.notToCountHour}`
    );
    assert.ok(Math.abs(split.toCountHour - contact) < 0.05);
  });

  it("zero to-count and not-to-count on free-time-only days", () => {
    const ledger = buildMotherLaytimeDailyLedger({
      commenceAt: commence,
      zone,
      week,
      excludedWeekdays: ["FRIDAY", "SATURDAY"],
      freeTimeHours: 288,
      segments: [
        {
          periodFrom: DateTime.fromObject({ year: 2026, month: 5, day: 4, hour: 20 }, { zone }).toJSDate(),
          periodTo: DateTime.fromObject({ year: 2026, month: 5, day: 4, hour: 23 }, { zone }).toJSDate(),
          elapsedWallHours: 3,
          countingHours: 3,
          countsAsLaytime: true,
          closingEventId: "e1",
          accumulatedUsedHours: 3
        }
      ],
      dailyDischarges: [],
      events: []
    });
    const row = ledger.rows.find((r) => r.date === "2026-05-04");
    assert.ok(row);
    if (row.freeTimeHour > 0.5 && row.contactHour < 0.05) {
      assert.ok(row.toCountHour < 0.02);
      assert.ok(row.notToCountHour < 0.02);
    }
  });
});
