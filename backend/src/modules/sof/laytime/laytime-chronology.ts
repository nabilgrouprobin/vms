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

const EPS = 1e-7;
const EXACT_TOL = 1e-4;

/** Laytime2000-style marker when cumulative “to count” reaches allowed time. */
const LAYTIME_EXPIRES_REMARK = "Laytime Expires…";

function withLaytimeExpiryRemark(remark: string): string {
  if (remark === "—") return LAYTIME_EXPIRES_REMARK;
  if (remark.includes("Laytime Expires")) return remark;
  return `${remark} · ${LAYTIME_EXPIRES_REMARK}`;
}

/**
 * When allowed laytime is exhausted mid-row, split the slice so the first sub-row ends
 * exactly at expiry (with remark) — matching Laytime2000 port chronologies.
 */
export function splitChronologyRowsAtLaytimeExpiry(
  sorted: LaytimeChronologyRow[],
  allowedHours: number | null,
  zone: string
): LaytimeChronologyRow[] {
  if (allowedHours === null || !Number.isFinite(allowedHours) || allowedHours <= 0) {
    return sorted.map((r) => ({ ...r }));
  }
  const allowed = allowedHours;
  const out: LaytimeChronologyRow[] = [];
  let prevTotal = 0;

  for (const r of sorted) {
    const tc = r.toCountHours;
    const nextTotal = prevTotal + tc;

    if (tc <= EPS || prevTotal >= allowed - EPS) {
      out.push({ ...r });
      prevTotal = nextTotal;
      continue;
    }

    const crosses = nextTotal > allowed + EXACT_TOL;
    const hitsEndExactly =
      !crosses && Math.abs(nextTotal - allowed) <= EXACT_TOL && prevTotal < allowed - EPS;

    if (!crosses) {
      out.push({
        ...r,
        remark: hitsEndExactly ? withLaytimeExpiryRemark(r.remark) : r.remark
      });
      prevTotal = nextTotal;
      continue;
    }

    const tStart = DateTime.fromFormat(`${r.date} ${r.startLocalHm}`, "yyyy-MM-dd HH:mm", {
      zone
    });
    let tEnd = DateTime.fromFormat(`${r.date} ${r.endLocalHm}`, "yyyy-MM-dd HH:mm", { zone });
    if (+tEnd <= +tStart) tEnd = tEnd.plus({ days: 1 });

    const wallMs = tEnd.toMillis() - tStart.toMillis();
    if (wallMs <= 0) {
      out.push({ ...r });
      prevTotal = nextTotal;
      continue;
    }

    const wallH = wallMs / 3_600_000;
    const k = tc / wallH;
    if (!(k > EPS)) {
      out.push({ ...r });
      prevTotal = nextTotal;
      continue;
    }

    const toFirst = allowed - prevTotal;
    let w1Ms = (toFirst / k) * 3_600_000;
    w1Ms = Math.min(Math.max(0, w1Ms), wallMs);
    const mid = tStart.plus({ milliseconds: w1Ms });
    const toSecond = tc - toFirst;

    if (toSecond <= EPS || wallMs - w1Ms <= 0) {
      out.push({ ...r, remark: withLaytimeExpiryRemark(r.remark) });
      prevTotal = nextTotal;
      continue;
    }
    if (toFirst <= EPS) {
      out.push({ ...r });
      prevTotal = nextTotal;
      continue;
    }

    const wall1Ms = mid.toMillis() - tStart.toMillis();
    const wall2Ms = tEnd.toMillis() - mid.toMillis();
    const wall1H = wall1Ms / 3_600_000;
    const wall2H = wall2Ms / 3_600_000;
    const frac1 = wall1H > EPS ? toFirst / wall1H : 0;
    const frac2 = wall2H > EPS ? toSecond / wall2H : 0;

    out.push({
      ...r,
      endLocalHm: mid.toFormat("HH:mm"),
      toCountHours: toFirst,
      fraction: Math.round(frac1 * 1_000_000) / 1_000_000,
      remark: withLaytimeExpiryRemark(r.remark),
      totalUsedHours: 0,
      onDemurrageHours: 0
    });
    out.push({
      ...r,
      date: ymd(mid),
      weekday: mid.setLocale("en").toFormat("ccc"),
      startLocalHm: mid.toFormat("HH:mm"),
      endLocalHm: tEnd.toFormat("HH:mm"),
      toCountHours: toSecond,
      fraction: Math.round(frac2 * 1_000_000) / 1_000_000,
      remark: r.remark,
      totalUsedHours: 0,
      onDemurrageHours: 0
    });

    prevTotal = nextTotal;
  }

  return out;
}

function assignChronologyRunningTotals(
  rows: LaytimeChronologyRow[],
  allowedHours: number | null
): void {
  let total = 0;
  let onDem = 0;
  const allowed = allowedHours;

  for (const r of rows) {
    const prevTotal = total;
    total += r.toCountHours;
    let onDemSlice = 0;
    if (allowed !== null && Number.isFinite(allowed) && allowed > 0) {
      if (total <= allowed + EPS) onDemSlice = 0;
      else if (prevTotal >= allowed - EPS) onDemSlice = r.toCountHours;
      else onDemSlice = total - allowed;
    }
    onDem += onDemSlice;
    r.totalUsedHours = total;
    r.onDemurrageHours = onDem;
  }
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

  const expanded = splitChronologyRowsAtLaytimeExpiry(rawRows, params.allowedHours, zone);
  assignChronologyRunningTotals(expanded, params.allowedHours);
  return expanded;
}
