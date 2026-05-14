/**
 * Laytime2000-style **chronology** rows: split each SOF segment across local calendar days
 * with fraction (to-count ÷ wall), running total used, and running on-demurrage time.
 */
import { DateTime } from "luxon";

import type { LaytimeSegment } from "./laytime-event-accumulation";

import { resolveLaytimeZone } from "./laytime-calendar-count";

function overlapMs(a0: DateTime, a1: DateTime, b0: DateTime, b1: DateTime): number {
  const s = +a0 > +b0 ? a0 : b0;
  const e = +a1 < +b1 ? a1 : b1;
  const ms = e.toMillis() - s.toMillis();
  return ms > 0 ? ms : 0;
}

export type LaytimeChronologyRow = {
  date: string;
  weekday: string;
  startLocalHm: string;
  endLocalHm: string;
  fraction: number;
  remark: string;
  toCountHours: number;
  totalUsedHours: number;
  onDemurrageHours: number;
  closingEventId: string | null;
};

function ymd(dt: DateTime): string {
  return dt.toFormat("yyyy-LL-dd");
}

/**
 * Expands finalized laytime segments into ordered day-bounded rows for port statements.
 */
export function buildLaytimeChronology(params: {
  segments: LaytimeSegment[];
  zone: string;
  allowedHours: number | null;
  remarkByClosingEventId: Map<string, string>;
}): LaytimeChronologyRow[] {
  const zone = resolveLaytimeZone(params.zone);
  const rawRows: LaytimeChronologyRow[] = [];

  for (const seg of params.segments) {
    const wall = seg.elapsedWallHours;
    const t0 = DateTime.fromJSDate(seg.periodFrom, { zone }).setZone(zone);
    const t1 = DateTime.fromJSDate(seg.periodTo, { zone }).setZone(zone);
    if (!t0.isValid || !t1.isValid || +t1 <= +t0) continue;

    const remark =
      seg.closingEventId && params.remarkByClosingEventId.has(seg.closingEventId)
        ? params.remarkByClosingEventId.get(seg.closingEventId)!
        : "—";

    let cur = t0.startOf("day");
    const lastDay = t1.minus({ milliseconds: 1 }).startOf("day");
    while (+cur <= +lastDay) {
      const dayEnd = cur.plus({ days: 1 });
      const segStart = +cur > +t0 ? cur : t0;
      const segEnd = +dayEnd < +t1 ? dayEnd : t1;
      const ohMs = overlapMs(segStart, segEnd, t0, t1);
      const wallH = ohMs / 3_600_000;
      if (wallH <= 0) {
        cur = cur.plus({ days: 1 });
        continue;
      }

      let toCountH = 0;
      if (seg.countsAsLaytime && wall > 0) {
        toCountH = seg.countingHours * (wallH / wall);
      }
      const frac = wallH > 0 ? toCountH / wallH : 0;

      rawRows.push({
        date: ymd(cur),
        weekday: cur.setLocale("en").toFormat("ccc"),
        startLocalHm: segStart.toFormat("HH:mm"),
        endLocalHm: segEnd.toFormat("HH:mm"),
        fraction: Math.round(frac * 1_000_000) / 1_000_000,
        remark,
        toCountHours: toCountH,
        totalUsedHours: 0,
        onDemurrageHours: 0,
        closingEventId: seg.closingEventId
      });
      cur = cur.plus({ days: 1 });
    }
  }

  rawRows.sort((a, b) => {
    const c = a.date.localeCompare(b.date);
    if (c !== 0) return c;
    return a.startLocalHm.localeCompare(b.startLocalHm);
  });

  let total = 0;
  let onDem = 0;
  const allowed = params.allowedHours;

  for (const r of rawRows) {
    const prevTotal = total;
    total += r.toCountHours;
    let onDemSlice = 0;
    if (allowed !== null && Number.isFinite(allowed) && allowed > 0) {
      if (total <= allowed + 1e-9) {
        onDemSlice = 0;
      } else if (prevTotal >= allowed - 1e-9) {
        onDemSlice = r.toCountHours;
      } else {
        onDemSlice = total - allowed;
      }
    }
    onDem += onDemSlice;
    r.totalUsedHours = total;
    r.onDemurrageHours = onDem;
  }

  return rawRows;
}
