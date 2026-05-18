/**
 * Mother-vessel laytime daily sheet: contact window, working from SOF segments, idle = 24 − working,
 * demurrage after free time. Discharge quantities come from `MotherVesselDailyDischarge` on the vessel call
 * (mother daily discharge operation), not from lighter SOF, draft survey, or weighbridge.
 */
import { DateTime } from "luxon";

import { parseExcludedWeekdays } from "./laytime-calendar-count";
import {
  wallHoursOverlappingHolidays,
  type LaytimeHolidayInterval
} from "./laytime-holiday-mask";
import type { LaytimeSegment } from "./laytime-event-accumulation";

const WEEK_MARKER =
  /^__LAYTIME_WEEK__\s+(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\s+(\d{2}:\d{2})\s+(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\s+(\d{2}:\d{2})$/i;

const DAY_ORDER = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
] as const;

export type WeekdayName = (typeof DAY_ORDER)[number];

const DAY_TO_JS: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

export type ContractWeekWindow = {
  startJsDow: number;
  startHm: string;
  endJsDow: number;
  endHm: string;
};

export type SofLaytimeWeekCalendarSource = {
  laytimeExcludedTimePeriod?: string | null;
  laytimeExcludedDays?: string[] | null;
};

/** Read week fields from a SOF row (works before Prisma client is regenerated). */
export function sofLaytimeWeekCalendarSource(
  row: SofLaytimeWeekCalendarSource
): SofLaytimeWeekCalendarSource {
  return {
    laytimeExcludedTimePeriod: row.laytimeExcludedTimePeriod ?? null,
    laytimeExcludedDays: row.laytimeExcludedDays ?? []
  };
}

/** SOF manual week overrides import contract when the statement has week data saved. */
export function resolveLaytimeWeekCalendar(
  statement: SofLaytimeWeekCalendarSource,
  contract: {
    excludedTimePeriod?: string | null;
    excludedDays?: string[] | null;
  } | null | undefined
): { excludedTimePeriod: string | null; excludedDays: string[] } {
  const sofPeriod = statement.laytimeExcludedTimePeriod ?? null;
  const sofDays = statement.laytimeExcludedDays ?? [];
  const hasSofOverride =
    (sofPeriod != null && sofPeriod.trim() !== "") || sofDays.length > 0;
  if (hasSofOverride) {
    return { excludedTimePeriod: sofPeriod, excludedDays: sofDays };
  }
  return {
    excludedTimePeriod: contract?.excludedTimePeriod ?? null,
    excludedDays: contract?.excludedDays ?? []
  };
}

export function parseContractWeekWindow(
  excludedTimePeriod: string | null | undefined,
  excludedDays: string[] | null | undefined
): ContractWeekWindow {
  const raw = excludedTimePeriod?.trim() ?? "";
  const first = raw.split("\n")[0]?.trim() ?? "";
  const m = first.match(WEEK_MARKER);
  if (m) {
    const sd = m[1].toUpperCase() as WeekdayName;
    const ed = m[3].toUpperCase() as WeekdayName;
    return {
      startJsDow: DAY_TO_JS[sd] ?? 0,
      startHm: m[2],
      endJsDow: DAY_TO_JS[ed] ?? 4,
      endHm: m[4]
    };
  }
  const ex = new Set((excludedDays ?? []).map((d) => d.trim().toUpperCase()));
  const work = DAY_ORDER.filter((d) => !ex.has(d));
  if (work.length === 0 || work.length === DAY_ORDER.length) {
    /** No week saved — match UI default (Sun 08:00 → Thu 17:00), not Sun–Sat (which counts Fri/Sat). */
    return { startJsDow: 0, startHm: "08:00", endJsDow: 4, endHm: "17:00" };
  }
  const start = DAY_TO_JS[work[0]] ?? 0;
  const end = DAY_TO_JS[work[work.length - 1]] ?? 4;
  return { startJsDow: start, startHm: "08:00", endJsDow: end, endHm: "17:00" };
}

function startOfWeekSunday(day: DateTime): DateTime {
  const d = day.startOf("day");
  const luxWd = d.weekday;
  const daysBack = luxWd === 7 ? 0 : luxWd;
  return d.minus({ days: daysBack });
}

function parseHm(hm: string): { hour: number; minute: number } {
  const [h, m] = hm.split(":").map((x) => parseInt(x, 10));
  return {
    hour: Number.isFinite(h) ? h : 0,
    minute: Number.isFinite(m) ? m : 0
  };
}

const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
] as const;

function formatHm24(hm: string): string {
  const { hour, minute } = parseHm(hm);
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/** Human-readable contract contact window (same logic as daily ledger contact hours). */
export function formatContractWeekWindowLabel(w: ContractWeekWindow): string {
  const sd = WEEKDAY_LONG[w.startJsDow] ?? WEEKDAY_LONG[0];
  const ed = WEEKDAY_LONG[w.endJsDow] ?? WEEKDAY_LONG[4];
  return `${sd} ${formatHm24(w.startHm)} → ${ed} ${formatHm24(w.endHm)}`;
}

const WEEKDAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
] as const;

function workSpanJsDays(w: ContractWeekWindow): Set<number> {
  const work = new Set<number>();
  let d = w.startJsDow;
  work.add(d);
  let guard = 0;
  while (d !== w.endJsDow && guard < 8) {
    d = (d + 1) % 7;
    work.add(d);
    guard++;
  }
  return work;
}

/** True when this JS weekday (Sun=0 … Sat=6) is inside the contract work span. */
export function isJsDayInWorkSpan(js: number, w: ContractWeekWindow): boolean {
  return workSpanJsDays(w).has(js);
}

/** Full calendar weekdays outside the work span (e.g. Sun–Thu → Friday, Saturday). */
export function excludedWeekdayNamesFromWeekWindow(w: ContractWeekWindow): string[] {
  const work = workSpanJsDays(w);
  const out: string[] = [];
  for (let js = 0; js < 7; js++) {
    if (!work.has(js)) out.push(WEEKDAY_NAMES[js]!);
  }
  return out;
}

/** Contact hours on one calendar day — 0 when the weekday is outside the work span. */
export function contactHoursOnCalendarDay(
  dayStart: DateTime,
  effStart: DateTime,
  effEnd: DateTime,
  zone: string,
  w: ContractWeekWindow
): number {
  if (+effEnd <= +effStart) return 0;
  if (!isJsDayInWorkSpan(jsWeekdayFromDayStart(dayStart), w)) return 0;
  return contactHoursInRange(effStart, effEnd, dayStart, zone, w);
}

/**
 * NOR tender calendar day (charter):
 * - NOR before 12:00 → contact from 13:00 to end of that day (within week window).
 * - NOR at/after 12:00 → 0 contact that day (laytime starts next day 08:00).
 * Returns null when `dayStart` is not the NOR tender local date.
 */
export function contactHoursOnNorTenderedCalendarDay(
  dayStart: DateTime,
  norTenderedAt: DateTime,
  effEnd: DateTime,
  zone: string,
  w: ContractWeekWindow
): number | null {
  const z = zone.trim() || "UTC";
  const nor = norTenderedAt.setZone(z);
  const day = dayStart.setZone(z).startOf("day");
  if (+nor.startOf("day") !== +day) return null;

  const noon = day.set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  if (+nor >= +noon) return 0;

  if (!isJsDayInWorkSpan(jsWeekdayFromDayStart(day), w)) return 0;

  const contactFrom = day.set({ hour: 13, minute: 0, second: 0, millisecond: 0 });
  const end = effEnd.setZone(z);
  if (+end <= +contactFrom) return 0;
  return contactHoursInRange(contactFrom, end, dayStart, z, w);
}

/** Wall-clock hours for one calendar day within [rangeStart, rangeEnd) (partial first/last days). */
export function durationHoursOnCalendarDay(
  dayStart: DateTime,
  dayEnd: DateTime,
  rangeStart: DateTime,
  rangeEnd: DateTime
): number {
  const s = +dayStart > +rangeStart ? dayStart : rangeStart;
  const e = +dayEnd < +rangeEnd ? dayEnd : rangeEnd;
  if (+e <= +s) return 0;
  return (+e - +s) / 3_600_000;
}

/** Merge explicit excluded days with days outside the contract week window. */
export function mergeExcludedWeekdayLists(
  week: ContractWeekWindow,
  explicit?: string[] | null
): string[] {
  const s = new Set<string>();
  for (const d of excludedWeekdayNamesFromWeekWindow(week)) {
    s.add(d);
  }
  for (const d of explicit ?? []) {
    const k = d.trim().toUpperCase();
    if (k) s.add(k);
  }
  return [...s];
}

function atSundayPlus(sun0: DateTime, jsDow: number, hm: string): DateTime {
  const { hour, minute } = parseHm(hm);
  return sun0.plus({ days: jsDow }).set({ hour, minute, second: 0, millisecond: 0 });
}

function overlapMs(a0: DateTime, a1: DateTime, b0: DateTime, b1: DateTime): number {
  const s = +a0 > +b0 ? a0 : b0;
  const e = +a1 < +b1 ? a1 : b1;
  const ms = e.toMillis() - s.toMillis();
  return ms > 0 ? ms : 0;
}

/** Contract “contact” hours for [effStart, effEnd) against the recurring weekly window containing `anchor`. */
export function contactHoursInRange(
  effStart: DateTime,
  effEnd: DateTime,
  anchor: DateTime,
  zone: string,
  w: ContractWeekWindow
): number {
  const z = zone.trim() || "UTC";
  const es = effStart.setZone(z);
  const ee = effEnd.setZone(z);
  const an = anchor.setZone(z);
  const sun = startOfWeekSunday(an);
  let win0 = atSundayPlus(sun, w.startJsDow, w.startHm);
  let win1 = atSundayPlus(sun, w.endJsDow, w.endHm);
  if (+win1 <= +win0) {
    win1 = win1.plus({ days: 7 });
  }
  return overlapMs(es, ee, win0, win1) / 3_600_000;
}

/** Contract contact interval for [effStart, effEnd) within the weekly window containing `anchor`. */
export function contactWindowInRange(
  effStart: DateTime,
  effEnd: DateTime,
  anchor: DateTime,
  zone: string,
  w: ContractWeekWindow
): { from: DateTime; to: DateTime } | null {
  const z = zone.trim() || "UTC";
  const es = effStart.setZone(z);
  const ee = effEnd.setZone(z);
  const an = anchor.setZone(z);
  const sun = startOfWeekSunday(an);
  let win0 = atSundayPlus(sun, w.startJsDow, w.startHm);
  let win1 = atSundayPlus(sun, w.endJsDow, w.endHm);
  if (+win1 <= +win0) {
    win1 = win1.plus({ days: 7 });
  }
  const s = +es > +win0 ? es : win0;
  const e = +ee < +win1 ? ee : win1;
  if (+e <= +s) return null;
  return { from: s, to: e };
}

export function contactWindowOnCalendarDay(
  dayStart: DateTime,
  effStart: DateTime,
  effEnd: DateTime,
  zone: string,
  w: ContractWeekWindow
): { from: DateTime; to: DateTime } | null {
  if (+effEnd <= +effStart) return null;
  if (!isJsDayInWorkSpan(jsWeekdayFromDayStart(dayStart), w)) return null;
  return contactWindowInRange(effStart, effEnd, dayStart, zone, w);
}

/** NOR tender day contact window; null when `dayStart` is not the NOR local date. */
export function contactWindowOnNorTenderedCalendarDay(
  dayStart: DateTime,
  norTenderedAt: DateTime,
  effEnd: DateTime,
  zone: string,
  w: ContractWeekWindow
): { from: DateTime; to: DateTime } | null {
  const z = zone.trim() || "UTC";
  const nor = norTenderedAt.setZone(z);
  const day = dayStart.setZone(z).startOf("day");
  if (+nor.startOf("day") !== +day) return null;

  const noon = day.set({ hour: 12, minute: 0, second: 0, millisecond: 0 });
  if (+nor >= +noon) return null;

  if (!isJsDayInWorkSpan(jsWeekdayFromDayStart(day), w)) return null;

  const contactFrom = day.set({ hour: 13, minute: 0, second: 0, millisecond: 0 });
  const end = effEnd.setZone(z);
  if (+end <= +contactFrom) return null;
  return contactWindowInRange(contactFrom, end, dayStart, z, w);
}

function formatContactHm(dt: DateTime, zone: string): string {
  return dt.setZone(zone.trim() || "UTC").toFormat("HH:mm");
}

function resolveContactWindowHm(params: {
  dayStart: DateTime;
  dayEnd: DateTime;
  effStart: DateTime;
  effEnd: DateTime;
  zone: string;
  week: ContractWeekWindow;
  norTendered: DateTime | null;
  commence: DateTime;
  alreadyOnDemurrage: boolean;
  excludedWeekday: boolean;
  contactHour: number;
}): { contactStartsAt: string | null; contactEndsAt: string | null } {
  const z = params.zone.trim() || "UTC";
  if (params.contactHour <= 1e-9 || params.excludedWeekday) {
    return { contactStartsAt: null, contactEndsAt: null };
  }
  if (params.alreadyOnDemurrage) {
    return {
      contactStartsAt: formatContactHm(params.effStart, z),
      contactEndsAt: formatContactHm(params.effEnd, z)
    };
  }

  const contactDayEnd = params.dayEnd;
  let win: { from: DateTime; to: DateTime } | null = null;

  if (params.norTendered?.isValid) {
    const norWin = contactWindowOnNorTenderedCalendarDay(
      params.dayStart,
      params.norTendered,
      contactDayEnd,
      z,
      params.week
    );
    if (norWin) {
      win = norWin;
    } else if (
      contactHoursOnNorTenderedCalendarDay(
        params.dayStart,
        params.norTendered,
        contactDayEnd,
        z,
        params.week
      ) !== null
    ) {
      win = null;
    } else if (
      params.commence.isValid &&
      +params.commence.setZone(z).startOf("day") === +params.dayStart
    ) {
      win = contactWindowOnCalendarDay(
        params.dayStart,
        params.commence.setZone(z),
        contactDayEnd,
        z,
        params.week
      );
    } else {
      win = contactWindowOnCalendarDay(
        params.dayStart,
        params.dayStart,
        contactDayEnd,
        z,
        params.week
      );
    }
  } else if (
    params.commence.isValid &&
    +params.commence.setZone(z).startOf("day") === +params.dayStart
  ) {
    win = contactWindowOnCalendarDay(
      params.dayStart,
      params.commence.setZone(z),
      contactDayEnd,
      z,
      params.week
    );
  } else {
    win = contactWindowOnCalendarDay(
      params.dayStart,
      params.dayStart,
      contactDayEnd,
      z,
      params.week
    );
  }

  if (!win) {
    return { contactStartsAt: null, contactEndsAt: null };
  }
  return {
    contactStartsAt: formatContactHm(win.from, z),
    contactEndsAt: formatContactHm(win.to, z)
  };
}

export type MotherLaytimeDailyLedgerRow = {
  date: string;
  weekday: string;
  /** Local HH:mm when contract contact starts this day (laytime zone). */
  contactStartsAt: string | null;
  /** Local HH:mm when contract contact ends this day (laytime zone). */
  contactEndsAt: string | null;
  /** Wall-clock hours in the laytime period this calendar day (24h mid-range; partial NOR/finish days). */
  durationHour: number;
  contactHour: number;
  /** Duration − contact. */
  freeTimeHour: number;
  /** SOF hours in contact window tagged to count (from `countsAsLaytime`). */
  toCountHour: number;
  /** SOF hours in contact window tagged not to count; with toCount sums to contact. */
  notToCountHour: number;
  /** SOF Count-tagged hours on this calendar day (wall clock, incl. outside contact). */
  sofWallToCountHour: number;
  /** SOF Not count-tagged hours on this calendar day (wall clock, incl. outside contact). */
  sofWallNotToCountHour: number;
  /** @deprecated Use `toCountHour`. Kept for API compatibility. */
  workingHour: number;
  /** @deprecated Use `notToCountHour`. Kept for API compatibility. */
  idleHour: number;
  /** Running sum of Count hours (toCountHour) against allowance. */
  cumulativeTotalUsedHour: number;
  /** max(0, allowed − cumulative total used). */
  despatchHour: number;
  /** max(0, cumulative total used − allowed). */
  demurrageHour: number;
  /** Discharge preparation hours (not shown on daily sheet; kept for API compat). */
  preparationHour: number;
  /** Same as contactHour this day (legacy). */
  creditedLaytimeHour: number;
  /** Same as cumulativeTotalUsedHour (legacy). */
  cumulativeCreditedHour: number;
  onDemurrage: boolean;
  laytimeExpiresThisDay: boolean;
  dischargeQtyMt: number | null;
  activityDetails: string;
};

export type MotherLaytimeDailyLedger = {
  rows: MotherLaytimeDailyLedgerRow[];
  totalDurationHour: number;
  totalContactHour: number;
  totalToCountHour: number;
  totalNotToCountHour: number;
  totalWorkingHour: number;
  totalPreparationHour: number;
  totalFreeTimeHour: number;
  /** Final cumulative contact hours (= total used for allowance). */
  totalCreditedLaytimeHour: number;
  totalIdleHour: number;
  totalDespatchHour: number;
  totalDemurrageHour: number;
  totalDischargeQtyMt: number;
};

function ymd(dt: DateTime): string {
  return dt.toFormat("yyyy-LL-dd");
}

/** Luxon weekday → JS (Sun=0 … Sat=6), same as laytime-calendar-count. */
function jsWeekdayFromDayStart(dayStart: DateTime): number {
  const luxWd = dayStart.weekday;
  return luxWd === 7 ? 0 : luxWd;
}

export function splitSegmentUsedHoursByCalendarDay(
  seg: LaytimeSegment,
  countingUsed: number,
  zone: string,
  out: Map<string, number>,
  week?: ContractWeekWindow
): void {
  const wall = seg.elapsedWallHours;
  if (wall <= 0 || countingUsed <= 0) return;
  const z = zone.trim() || "UTC";
  let t0 = DateTime.fromJSDate(seg.periodFrom, { zone: z });
  const t1 = DateTime.fromJSDate(seg.periodTo, { zone: z });
  if (!t0.isValid || !t1.isValid) return;
  if (+t1 <= +t0) return;
  let cur = t0.startOf("day");
  const endDay = t1.minus({ milliseconds: 1 }).startOf("day");
  while (+cur <= +endDay) {
    if (week && !isJsDayInWorkSpan(jsWeekdayFromDayStart(cur), week)) {
      cur = cur.plus({ days: 1 });
      continue;
    }
    const dayEnd = cur.plus({ days: 1 });
    const segStart = +cur > +t0 ? cur : t0;
    const segEnd = +dayEnd < +t1 ? dayEnd : t1;
    const oh = overlapMs(segStart, segEnd, t0, t1) / 3_600_000;
    if (oh > 0) {
      const k = ymd(cur);
      out.set(k, (out.get(k) ?? 0) + (oh / wall) * countingUsed);
    }
    cur = cur.plus({ days: 1 });
  }
}

const MAX_LEDGER_DAYS = 400;

/**
 * SOF segment hours on one calendar day by Count / Not count tag (wall clock, any time of day).
 * Used for alignment with the Events page totals and to explain off-contact not-count time.
 */
export function laytimeWallCountNotToCountOnCalendarDay(
  segments: LaytimeSegment[],
  dayStart: DateTime,
  dayEnd: DateTime,
  effStart: DateTime,
  effEnd: DateTime,
  zone: string
): { wallToCountHour: number; wallNotToCountHour: number } {
  const z = zone.trim() || "UTC";
  let wallToCount = 0;
  let wallNotToCount = 0;

  for (const seg of segments) {
    const wall = seg.elapsedWallHours;
    if (wall <= 0 || seg.countingHours <= 0) continue;
    const t0 = DateTime.fromJSDate(seg.periodFrom, { zone: z });
    const t1 = DateTime.fromJSDate(seg.periodTo, { zone: z });
    if (!t0.isValid || !t1.isValid || +t1 <= +t0) continue;

    const segStart = +t0 > +effStart ? t0 : effStart;
    const segEnd = +t1 < +effEnd ? t1 : effEnd;
    if (+segEnd <= +segStart) continue;

    const segOnDayH = (+segEnd - +segStart) / 3_600_000;
    if (segOnDayH <= 1e-9) continue;

    if (seg.countsAsLaytime) {
      wallToCount += segOnDayH;
    } else {
      wallNotToCount += segOnDayH;
    }
  }

  return { wallToCountHour: round2(wallToCount), wallNotToCountHour: round2(wallNotToCount) };
}

/**
 * Split SOF segment hours on one calendar day into contact-window to-count vs not-to-count.
 * Unfilled contact after segment credits defaults to Count unless the day is only tagged
 * Not count in the contact window.
 */
export function laytimeToCountNotToCountOnDay(
  segments: LaytimeSegment[],
  dayStart: DateTime,
  dayEnd: DateTime,
  effStart: DateTime,
  effEnd: DateTime,
  zone: string,
  week: ContractWeekWindow,
  contactHours: number,
  onDemurrage: boolean
): { toCountHour: number; notToCountHour: number } {
  if (contactHours <= 1e-9) {
    return { toCountHour: 0, notToCountHour: 0 };
  }
  const z = zone.trim() || "UTC";
  const wallSplit = laytimeWallCountNotToCountOnCalendarDay(
    segments,
    dayStart,
    dayEnd,
    effStart,
    effEnd,
    zone
  );
  let toCount = 0;
  let notToCount = 0;
  let anyCountCredit = false;
  let anyNotCountCredit = false;

  for (const seg of segments) {
    const wall = seg.elapsedWallHours;
    if (wall <= 0 || seg.countingHours <= 0) continue;
    const t0 = DateTime.fromJSDate(seg.periodFrom, { zone: z });
    const t1 = DateTime.fromJSDate(seg.periodTo, { zone: z });
    if (!t0.isValid || !t1.isValid || +t1 <= +t0) continue;

    const segStart = +t0 > +effStart ? t0 : effStart;
    const segEnd = +t1 < +effEnd ? t1 : effEnd;
    if (+segEnd <= +segStart) continue;

    const segOnDayH = (+segEnd - +segStart) / 3_600_000;
    if (segOnDayH <= 1e-9) continue;

    const contactOverlapH = onDemurrage
      ? segOnDayH
      : contactHoursInRange(segStart, segEnd, dayStart, z, week);
    if (contactOverlapH <= 1e-9) continue;

    const credited = (seg.countingHours * segOnDayH) / wall;
    const inContact = Math.min(credited, contactOverlapH);

    if (seg.countsAsLaytime) {
      toCount += inContact;
      if (inContact > 1e-9) anyCountCredit = true;
    } else {
      notToCount += inContact;
      if (inContact > 1e-9) anyNotCountCredit = true;
    }
  }

  const sum = toCount + notToCount;
  if (sum < contactHours - 1e-9) {
    let remainder = contactHours - sum;
    // Credit SOF not-count time on this calendar day (e.g. 00:00–02:00 before contact opens).
    const wallNotCountRoom = Math.max(0, wallSplit.wallNotToCountHour - notToCount);
    const fromWall = Math.min(remainder, wallNotCountRoom);
    notToCount += fromWall;
    remainder -= fromWall;
    if (remainder > 1e-9) {
      if (anyNotCountCredit && !anyCountCredit) {
        notToCount += remainder;
      } else {
        toCount += remainder;
      }
    }
  } else if (sum > contactHours + 1e-9 && sum > 1e-9) {
    const scale = contactHours / sum;
    toCount *= scale;
    notToCount *= scale;
  }

  return { toCountHour: round2(toCount), notToCountHour: round2(notToCount) };
}

export function buildMotherLaytimeDailyLedger(params: {
  commenceAt: Date;
  /** NOR tendered instant (UTC) — special contact on that local calendar day. */
  norTenderedAt?: Date | null;
  /** End of laytime counting (last event / SOF complete); caps duration on last day. */
  operationsEndAt?: Date | null;
  zone: string;
  week: ContractWeekWindow;
  /** Contract excluded weekdays (e.g. FRIDAY, SATURDAY) — zero contact / no pool use. */
  excludedWeekdays?: string[] | null;
  /** SOF / sidebar holidays — same as weekly off: no pool deduction before demurrage. */
  holidays?: LaytimeHolidayInterval[];
  freeTimeHours: number | null;
  /** Post-calendar segments with countingHours as used laytime for the segment */
  segments: LaytimeSegment[];
  /** @deprecated Segment categories are not used for daily to-count split; kept for callers. */
  segmentCountingUsedHours?: number[];
  segmentClosingCategories?: (string | null | undefined)[];
  dailyDischarges: Array<{ reportDate: Date; quantity24hMt: unknown; remarks: string | null }>;
  events: Array<{ eventTime: Date; remarks: string | null; eventType: string }>;
}): MotherLaytimeDailyLedger {
  const zone = resolveZone(params.zone);
  const commence = DateTime.fromJSDate(params.commenceAt, { zone }).setZone(zone);
  if (!commence.isValid) {
    return emptyLedger();
  }

  const norTendered = params.norTenderedAt
    ? DateTime.fromJSDate(params.norTenderedAt, { zone }).setZone(zone)
    : null;

  let rangeEnd = commence;
  if (params.operationsEndAt) {
    const opEnd = DateTime.fromJSDate(params.operationsEndAt, { zone }).setZone(zone);
    if (opEnd.isValid && +opEnd > +rangeEnd) rangeEnd = opEnd;
  }
  for (const s of params.segments) {
    const e = DateTime.fromJSDate(s.periodTo, { zone }).setZone(zone);
    if (e.isValid && +e > +rangeEnd) rangeEnd = e;
  }
  for (const ev of params.events) {
    const e = DateTime.fromJSDate(ev.eventTime, { zone }).setZone(zone);
    if (e.isValid && +e > +rangeEnd) rangeEnd = e;
  }
  for (const d of params.dailyDischarges) {
    const e = DateTime.fromJSDate(d.reportDate, { zone }).setZone(zone).endOf("day");
    if (e.isValid && +e > +rangeEnd) rangeEnd = e;
  }

  const rangeStart = commence;
  let endDay = rangeEnd.startOf("day");
  if (+endDay < +commence.startOf("day")) {
    endDay = commence.startOf("day");
  }
  let dayCursor = commence.startOf("day");
  const free = params.freeTimeHours;

  const preparationByDay = new Map<string, number>();
  params.segments.forEach((seg, i) => {
    const cat = params.segmentClosingCategories?.[i] ?? "NORMAL";
    if (cat === "PREPARATION") {
      const used = params.segmentCountingUsedHours?.[i] ?? seg.countingHours;
      splitSegmentUsedHoursByCalendarDay(seg, used, zone, preparationByDay, params.week);
    }
  });

  const dischargeByDay = new Map<string, number>();
  const dischargeRemarkByDay = new Map<string, string>();
  for (const d of params.dailyDischarges) {
    const dt = DateTime.fromJSDate(d.reportDate, { zone: "utc" }).setZone(zone).startOf("day");
    const k = ymd(dt);
    const q = Number(d.quantity24hMt?.toString?.() ?? d.quantity24hMt);
    if (Number.isFinite(q)) {
      dischargeByDay.set(k, (dischargeByDay.get(k) ?? 0) + q);
    }
    if (d.remarks?.trim()) {
      const prev = dischargeRemarkByDay.get(k);
      dischargeRemarkByDay.set(k, prev ? `${prev}; ${d.remarks.trim()}` : d.remarks.trim());
    }
  }

  const eventsByDay = new Map<string, string[]>();
  for (const ev of params.events) {
    const dt = DateTime.fromJSDate(ev.eventTime, { zone }).setZone(zone);
    if (!dt.isValid) continue;
    const k = ymd(dt.startOf("day"));
    const clock = dt.toFormat("HH:mm");
    const line = [clock, ev.eventType.replace(/_/g, " "), ev.remarks?.trim()].filter(Boolean).join(" · ");
    let bucket = eventsByDay.get(k);
    if (!bucket) {
      bucket = [];
      eventsByDay.set(k, bucket);
    }
    bucket.push(line);
  }

  const rows: MotherLaytimeDailyLedgerRow[] = [];
  const excludedSet = parseExcludedWeekdays(
    mergeExcludedWeekdayLists(params.week, params.excludedWeekdays)
  );
  let cumToCount = 0;
  let cumNotToCount = 0;
  let guard = 0;

  while (+dayCursor <= +endDay && guard++ < MAX_LEDGER_DAYS) {
    const dayStart = dayCursor;
    const dayEnd = dayCursor.plus({ days: 1 });
    const periodEnd = +rangeEnd < +dayEnd ? rangeEnd : dayEnd;
    const effStart = +dayStart < +rangeStart ? rangeStart : dayStart;
    const effEnd = periodEnd;
    if (+effEnd <= +effStart) {
      dayCursor = dayCursor.plus({ days: 1 });
      continue;
    }

    const duration = durationHoursOnCalendarDay(dayStart, dayEnd, rangeStart, rangeEnd);

    const k = ymd(dayStart);
    const preparation = preparationByDay.get(k) ?? 0;

    const prevCumToCount = cumToCount;

    /** OODDA: after allowance is used up, every calendar day is 24h contact (no week/holiday). */
    const alreadyOnDemurrage =
      free !== null && free > 0 && prevCumToCount >= free - 1e-9;

    const contactDayEnd = dayEnd;
    let contact = 0;
    if (alreadyOnDemurrage) {
      contact = duration;
    } else if (norTendered?.isValid) {
      const norOverride = contactHoursOnNorTenderedCalendarDay(
        dayStart,
        norTendered,
        contactDayEnd,
        zone,
        params.week
      );
      if (norOverride !== null) {
        contact = norOverride;
      } else if (
        commence.isValid &&
        +commence.setZone(zone).startOf("day") === +dayStart
      ) {
        /** Day laytime starts (e.g. NOR ≥ 12:00 → next day 08:00): contact from commence to end of day. */
        contact = contactHoursOnCalendarDay(
          dayStart,
          commence.setZone(zone),
          contactDayEnd,
          zone,
          params.week
        );
      } else {
        /** Full calendar-day contact in the contract window (not clipped to commence clock). */
        contact = contactHoursOnCalendarDay(
          dayStart,
          dayStart,
          contactDayEnd,
          zone,
          params.week
        );
      }
    } else if (commence.isValid && +commence.setZone(zone).startOf("day") === +dayStart) {
      contact = contactHoursOnCalendarDay(
        dayStart,
        commence.setZone(zone),
        contactDayEnd,
        zone,
        params.week
      );
    } else {
      contact = contactHoursOnCalendarDay(
        dayStart,
        dayStart,
        contactDayEnd,
        zone,
        params.week
      );
    }

    if (!alreadyOnDemurrage && excludedSet.has(jsWeekdayFromDayStart(dayStart))) {
      contact = 0;
    }

    if (!alreadyOnDemurrage && params.holidays?.length) {
      const holidayWall = wallHoursOverlappingHolidays(
        effStart.toJSDate(),
        effEnd.toJSDate(),
        params.holidays,
        zone
      );
      if (holidayWall >= duration - 1e-9) {
        contact = 0;
      } else if (holidayWall > 1e-9 && contact > 1e-9 && duration > 1e-9) {
        const nonHolidayWall = Math.max(0, duration - holidayWall);
        contact = (contact * nonHolidayWall) / duration;
      }
    }

    const freeTime = Math.max(0, duration - contact);

    const { wallToCountHour, wallNotToCountHour } = laytimeWallCountNotToCountOnCalendarDay(
      params.segments,
      dayStart,
      dayEnd,
      effStart,
      effEnd,
      zone
    );

    const { toCountHour, notToCountHour } = laytimeToCountNotToCountOnDay(
      params.segments,
      dayStart,
      dayEnd,
      effStart,
      effEnd,
      zone,
      params.week,
      contact,
      alreadyOnDemurrage
    );
    cumToCount += toCountHour;
    cumNotToCount += notToCountHour;

    const despatch =
      free !== null && free > 0 ? Math.max(0, free - cumToCount) : 0;
    const demurrage =
      free !== null && free > 0 ? Math.max(0, cumToCount - free) : 0;

    const dq = dischargeByDay.get(k);
    const parts: string[] = [];
    const evL = eventsByDay.get(k);
    if (evL?.length) parts.push(evL.join(" | "));
    const dr = dischargeRemarkByDay.get(k);
    if (dr) parts.push(dr);
    const activity = parts.join(" · ") || "—";

    const onDemurrage =
      free !== null && free > 0 && cumToCount >= free - 1e-9;
    const laytimeExpiresThisDay =
      free !== null &&
      free > 0 &&
      prevCumToCount < free - 1e-9 &&
      cumToCount >= free - 1e-9;

    const excludedWeekday =
      !alreadyOnDemurrage && excludedSet.has(jsWeekdayFromDayStart(dayStart));
    const { contactStartsAt, contactEndsAt } = resolveContactWindowHm({
      dayStart,
      dayEnd,
      effStart,
      effEnd,
      zone,
      week: params.week,
      norTendered: norTendered?.isValid ? norTendered : null,
      commence,
      alreadyOnDemurrage,
      excludedWeekday,
      contactHour: contact
    });

    rows.push({
      date: k,
      weekday: dayStart.setLocale("en").toFormat("cccc"),
      contactStartsAt,
      contactEndsAt,
      durationHour: round2(duration),
      contactHour: round2(contact),
      freeTimeHour: round2(freeTime),
      toCountHour,
      notToCountHour,
      sofWallToCountHour: wallToCountHour,
      sofWallNotToCountHour: wallNotToCountHour,
      workingHour: toCountHour,
      idleHour: notToCountHour,
      cumulativeTotalUsedHour: round2(cumToCount),
      despatchHour: round2(despatch),
      demurrageHour: round2(demurrage),
      preparationHour: round2(preparation),
      creditedLaytimeHour: round2(contact),
      cumulativeCreditedHour: round2(cumToCount),
      onDemurrage,
      laytimeExpiresThisDay,
      dischargeQtyMt: dq !== undefined && Number.isFinite(dq) ? round2(dq) : null,
      activityDetails: activity
    });

    dayCursor = dayCursor.plus({ days: 1 });
  }

  return summarizeLedger(rows);
}

function resolveZone(z: string): string {
  const t = z.trim() || "Asia/Dhaka";
  const p = DateTime.now().setZone(t);
  return p.isValid ? t : "Asia/Dhaka";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function emptyLedger(): MotherLaytimeDailyLedger {
  return {
    rows: [],
    totalDurationHour: 0,
    totalContactHour: 0,
    totalToCountHour: 0,
    totalNotToCountHour: 0,
    totalWorkingHour: 0,
    totalPreparationHour: 0,
    totalFreeTimeHour: 0,
    totalCreditedLaytimeHour: 0,
    totalIdleHour: 0,
    totalDespatchHour: 0,
    totalDemurrageHour: 0,
    totalDischargeQtyMt: 0
  };
}

function summarizeLedger(rows: MotherLaytimeDailyLedgerRow[]): MotherLaytimeDailyLedger {
  let tdur = 0;
  let tc = 0;
  let ttc = 0;
  let tntc = 0;
  let tp = 0;
  let tf = 0;
  let tq = 0;
  for (const r of rows) {
    tdur += r.durationHour;
    tc += r.contactHour;
    ttc += r.toCountHour;
    tntc += r.notToCountHour;
    tp += r.preparationHour;
    tf += r.freeTimeHour;
    if (r.dischargeQtyMt !== null) tq += r.dischargeQtyMt;
  }
  const last = rows[rows.length - 1];
  const finalUsed = last?.cumulativeTotalUsedHour ?? ttc;
  return {
    rows,
    totalDurationHour: round2(tdur),
    totalContactHour: round2(tc),
    totalToCountHour: round2(ttc),
    totalNotToCountHour: round2(tntc),
    totalWorkingHour: round2(ttc),
    totalPreparationHour: round2(tp),
    totalFreeTimeHour: round2(tf),
    totalCreditedLaytimeHour: round2(finalUsed),
    totalIdleHour: round2(tntc),
    totalDespatchHour: round2(last?.despatchHour ?? 0),
    totalDemurrageHour: round2(last?.demurrageHour ?? 0),
    totalDischargeQtyMt: round2(tq)
  };
}
