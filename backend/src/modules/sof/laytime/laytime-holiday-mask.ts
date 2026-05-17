import { DateTime } from "luxon";

import type { LaytimeSegment } from "./laytime-event-accumulation";
import { hoursBetweenNonNegative } from "./laytime-event-accumulation";
import { resolveLaytimeZone } from "./laytime-calendar-count";

export type LaytimeHolidayInterval = {
  holidayStartAt: Date;
  holidayEndAt: Date;
};

const EPS = 1e-9;

/**
 * Reduces each segment's countingHours proportionally by wall-clock overlap with
 * union of holiday intervals [start, end). Excluded / zero-count segments unchanged.
 *
 * When `allowedLaytimeHours` is set, **once on demurrage, always on demurrage**: after
 * cumulative credited laytime reaches the allowance, holiday overlap no longer reduces
 * counting hours (same charter rule as excluded weekdays).
 */
export function reduceSegmentsForHolidayWallOverlap(
  segments: LaytimeSegment[],
  holidays: LaytimeHolidayInterval[],
  zoneInput: string | null | undefined,
  allowedLaytimeHours: number | null = null
): LaytimeSegment[] {
  if (!holidays.length) return segments;
  const zone = resolveLaytimeZone(zoneInput);

  const out: LaytimeSegment[] = [];
  let accumulatedUsedHours = 0;

  for (const seg of segments) {
    if (!seg.countsAsLaytime || seg.countingHours <= 0 || seg.elapsedWallHours <= 0) {
      out.push(seg);
      continue;
    }

    if (
      allowedLaytimeHours !== null &&
      Number.isFinite(allowedLaytimeHours) &&
      allowedLaytimeHours > 0 &&
      accumulatedUsedHours >= allowedLaytimeHours - EPS
    ) {
      out.push(seg);
      accumulatedUsedHours += seg.countingHours;
      continue;
    }

    let overlapH = 0;
    for (const h of holidays) {
      overlapH += overlapHours(seg.periodFrom, seg.periodTo, h.holidayStartAt, h.holidayEndAt, zone);
    }
    overlapH = Math.min(overlapH, seg.elapsedWallHours);
    const frac = 1 - overlapH / seg.elapsedWallHours;
    const newCounting = Math.max(0, seg.countingHours * frac);
    accumulatedUsedHours += newCounting;
    out.push({
      ...seg,
      countingHours: newCounting,
      accumulatedUsedHours
    });
  }

  return out;
}

/** Wall-clock hours in [periodFrom, periodTo) that overlap any configured holiday interval. */
export function wallHoursOverlappingHolidays(
  periodFrom: Date,
  periodTo: Date,
  holidays: LaytimeHolidayInterval[],
  zoneInput: string | null | undefined
): number {
  if (!holidays.length || periodTo.getTime() <= periodFrom.getTime()) return 0;
  const zone = resolveLaytimeZone(zoneInput);
  let total = 0;
  for (const h of holidays) {
    total += overlapHours(periodFrom, periodTo, h.holidayStartAt, h.holidayEndAt, zone);
  }
  const wall = (periodTo.getTime() - periodFrom.getTime()) / 3_600_000;
  return Math.min(Math.max(0, total), wall);
}

function overlapHours(
  segFrom: Date,
  segTo: Date,
  hStart: Date,
  hEnd: Date,
  zone: string
): number {
  const a0 = DateTime.fromJSDate(segFrom, { zone: "utc" }).setZone(zone);
  const a1 = DateTime.fromJSDate(segTo, { zone: "utc" }).setZone(zone);
  const b0 = DateTime.fromJSDate(hStart, { zone: "utc" }).setZone(zone);
  const b1 = DateTime.fromJSDate(hEnd, { zone: "utc" }).setZone(zone);
  if (!a0.isValid || !a1.isValid || !b0.isValid || !b1.isValid) {
    return hoursBetweenNonNegative(
      new Date(Math.max(segFrom.getTime(), hStart.getTime())),
      new Date(Math.min(segTo.getTime(), hEnd.getTime()))
    );
  }
  const s = +a0 > +b0 ? a0 : b0;
  const e = +a1 < +b1 ? a1 : b1;
  const ms = e.toMillis() - s.toMillis();
  return ms > 0 ? ms / 3_600_000 : 0;
}
