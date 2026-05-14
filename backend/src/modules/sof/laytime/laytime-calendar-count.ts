import { DateTime } from "luxon";

import type { LaytimeSegment } from "./laytime-event-accumulation";

/** Default port / operations timezone when vessel call has none set */
export const DEFAULT_LAYTIME_ZONE = "Asia/Dhaka";

/** Maps contract strings (e.g. SUNDAY) to JS weekday (Sun=0 … Sat=6) */
const DAY_NAMES: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

export function parseExcludedWeekdays(days: string[] | null | undefined): Set<number> {
  const s = new Set<number>();
  if (!days?.length) return s;
  for (const d of days) {
    const k = d.trim().toUpperCase();
    if (k in DAY_NAMES) {
      s.add(DAY_NAMES[k]);
    }
  }
  return s;
}

export function resolveLaytimeZone(zone: string | null | undefined): string {
  const z = (zone ?? "").trim() || DEFAULT_LAYTIME_ZONE;
  const probe = DateTime.now().setZone(z);
  return probe.isValid ? z : DEFAULT_LAYTIME_ZONE;
}

/**
 * Hours in [from, to] that fall on weekdays not listed in `excluded` (local `zone`).
 * Uses one-hour slices so DST boundaries are handled consistently.
 */
export function countableHoursOutsideExcludedWeekdays(
  from: Date,
  to: Date,
  excluded: Set<number>,
  zone: string
): number {
  if (to.getTime() <= from.getTime()) return 0;
  if (excluded.size === 0) {
    return Math.max(0, (to.getTime() - from.getTime()) / 3_600_000);
  }

  const z = resolveLaytimeZone(zone);
  let t = DateTime.fromJSDate(from, { zone: z });
  const end = DateTime.fromJSDate(to, { zone: z });
  if (!t.isValid || !end.isValid) {
    t = DateTime.fromJSDate(from, { zone: "utc" });
    const endUtc = DateTime.fromJSDate(to, { zone: "utc" });
    return sliceCountable(t, endUtc, excluded);
  }
  return sliceCountable(t, end, excluded);
}

function sliceCountable(t: DateTime, end: DateTime, excluded: Set<number>): number {
  let ms = 0;
  let cur = t;
  while (cur < end) {
    const nextHour = cur.plus({ hours: 1 });
    const sliceEnd = nextHour > end ? end : nextHour;
    const luxWd = cur.weekday;
    const jsDay = luxWd === 7 ? 0 : luxWd;
    if (!excluded.has(jsDay)) {
      ms += sliceEnd.diff(cur, "milliseconds").milliseconds;
    }
    cur = nextHour;
  }
  return ms / 3_600_000;
}

/**
 * Weekday-excluded hours with **once on demurrage, always on demurrage** (OODDA).
 *
 * After cumulative credited laytime reaches `allowedLaytimeHours`, hours on excluded weekdays
 * still count toward laytime used (and demurrage), matching Laytime2000-style chronologies.
 *
 * When `allowedLaytimeHours` is null, behaves like {@link countableHoursOutsideExcludedWeekdays}.
 */
export function countableHoursWithWeekdayExclusionsAndLaytimeExpiry(
  from: Date,
  to: Date,
  excluded: Set<number>,
  zone: string,
  allowedLaytimeHours: number | null,
  accumulatedUsedLaytimeHoursBeforeRange: number
): { countableHours: number; excludedWallHours: number } {
  const wallMs = Math.max(0, to.getTime() - from.getTime());
  const wallHours = wallMs / 3_600_000;
  if (wallHours <= 0) {
    return { countableHours: 0, excludedWallHours: 0 };
  }

  if (excluded.size === 0) {
    return { countableHours: wallHours, excludedWallHours: 0 };
  }

  if (allowedLaytimeHours === null) {
    const countable = countableHoursOutsideExcludedWeekdays(from, to, excluded, zone);
    return { countableHours: countable, excludedWallHours: Math.max(0, wallHours - countable) };
  }

  const z = resolveLaytimeZone(zone);
  let t = DateTime.fromJSDate(from, { zone: z });
  const end = DateTime.fromJSDate(to, { zone: z });
  if (!t.isValid || !end.isValid) {
    t = DateTime.fromJSDate(from, { zone: "utc" });
    const endUtc = DateTime.fromJSDate(to, { zone: "utc" });
    return sliceCountableWithOODDA(t, endUtc, excluded, allowedLaytimeHours, accumulatedUsedLaytimeHoursBeforeRange);
  }
  return sliceCountableWithOODDA(t, end, excluded, allowedLaytimeHours, accumulatedUsedLaytimeHoursBeforeRange);
}

function sliceCountableWithOODDA(
  t: DateTime,
  end: DateTime,
  excluded: Set<number>,
  allowedLaytimeHours: number,
  accumulatedUsedLaytimeHoursBeforeRange: number
): { countableHours: number; excludedWallHours: number } {
  let countableMs = 0;
  let cur = t;
  let acc = accumulatedUsedLaytimeHoursBeforeRange;
  while (cur < end) {
    const nextHour = cur.plus({ hours: 1 });
    const sliceEnd = nextHour > end ? end : nextHour;
    const sliceMs = sliceEnd.diff(cur, "milliseconds").milliseconds;
    const sliceH = sliceMs / 3_600_000;
    const luxWd = cur.weekday;
    const jsDay = luxWd === 7 ? 0 : luxWd;
    const isExcluded = excluded.has(jsDay);
    const countsThisSlice =
      !isExcluded || acc >= allowedLaytimeHours - 1e-9;
    if (countsThisSlice) {
      countableMs += sliceMs;
      acc += sliceH;
    }
    cur = nextHour;
  }
  const wallMs = end.diff(t, "milliseconds").milliseconds;
  const wallHours = wallMs / 3_600_000;
  const countableHours = countableMs / 3_600_000;
  return {
    countableHours,
    excludedWallHours: Math.max(0, wallHours - countableHours)
  };
}

type LaytimeImpactCarrier = {
  laytimeImpactHours: { toString(): string } | null;
};

function impactHoursNum(v: LaytimeImpactCarrier["laytimeImpactHours"]): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

/**
 * After raw event segments, apply import contract excluded weekdays to elapsed-based
 * counting segments. Explicit `laytimeImpactHours` on the closing event skips calendar
 * adjustment for that segment.
 */
export function applyImportContractCalendarToMotherSegments(
  rawSegments: LaytimeSegment[],
  eventsById: Map<string, LaytimeImpactCarrier>,
  contractExcludedDays: string[] | null | undefined,
  vesselLaytimeTimeZone: string | null | undefined,
  /** When set with excluded weekdays, applies OODDA after this many credited hours. */
  allowedLaytimeHours: number | null
): { segments: LaytimeSegment[]; used: number; excluded: number } {
  const excludedSet = parseExcludedWeekdays(contractExcludedDays ?? []);
  const zone = resolveLaytimeZone(vesselLaytimeTimeZone);

  let used = 0;
  let excluded = 0;
  let accumulatedUsedHours = 0;
  const out: LaytimeSegment[] = [];

  for (const seg of rawSegments) {
    const ev = seg.closingEventId ? eventsById.get(seg.closingEventId) : undefined;
    const impact = ev ? impactHoursNum(ev.laytimeImpactHours) : null;
    const explicitImpact = impact !== null && impact >= 0;

    if (!seg.countsAsLaytime) {
      excluded += seg.countingHours;
      out.push({
        ...seg,
        accumulatedUsedHours
      });
      continue;
    }

    if (explicitImpact || excludedSet.size === 0) {
      used += seg.countingHours;
      accumulatedUsedHours += seg.countingHours;
      out.push({
        ...seg,
        countingHours: seg.countingHours,
        accumulatedUsedHours
      });
      continue;
    }

    const { countableHours: countable, excludedWallHours: calendarStrip } =
      countableHoursWithWeekdayExclusionsAndLaytimeExpiry(
        seg.periodFrom,
        seg.periodTo,
        excludedSet,
        zone,
        allowedLaytimeHours,
        accumulatedUsedHours
      );
    used += countable;
    excluded += calendarStrip;
    accumulatedUsedHours += countable;
    out.push({
      ...seg,
      countingHours: countable,
      accumulatedUsedHours
    });
  }

  return { segments: out, used, excluded };
}
