import type { SofEventListItem, SofEventTypeCategoryUi } from "@/types/vms";

export function sortSofEventsChronoAsc<T extends { eventTime: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime()
  );
}

function parseHours(v: string | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/** Human-readable length (whole minutes), e.g. `13 min`, `2 h`, `1 h 44 min`. */
function formatDurationFromTotalMinutes(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes));
  if (mins === 0) return "0 h 0 min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

type SofEventWindowRow = Pick<SofEventListItem, "eventTime" | "durationHours" | "durationMinutes">;

type ResolvedDuration =
  | { kind: "minutes"; minutes: number }
  | { kind: "hours"; hours: number }
  | null;

/**
 * Pull the event's explicit duration (minutes wins over hours). Returns
 * `null` when neither field is a positive finite number.
 */
function resolveDuration(row: SofEventWindowRow): ResolvedDuration {
  if (row.durationMinutes != null && row.durationMinutes > 0) {
    return { kind: "minutes", minutes: row.durationMinutes };
  }
  const durH = parseHours(row.durationHours);
  if (durH !== null && durH > 0) {
    return { kind: "hours", hours: durH };
  }
  return null;
}

function durationToWindow(
  duration: ResolvedDuration,
  toIso: string
): { fromIso: string | null; toIso: string; durationLabel: string } | null {
  if (!duration) return null;
  const toMs = new Date(toIso).getTime();
  if (duration.kind === "minutes") {
    return {
      fromIso: new Date(toMs - duration.minutes * 60_000).toISOString(),
      toIso,
      durationLabel: formatDurationFromTotalMinutes(duration.minutes)
    };
  }
  const fromMs = toMs - duration.hours * 3_600_000;
  const spanMins = Math.round((toMs - fromMs) / 60_000);
  return {
    fromIso: new Date(fromMs).toISOString(),
    toIso,
    durationLabel: formatDurationFromTotalMinutes(spanMins)
  };
}

/** Resolve an event's window using ONLY its own duration (no chaining). */
export function sofEventOwnWindow(row: SofEventWindowRow): {
  fromIso: string | null;
  toIso: string;
  durationLabel: string;
} {
  return (
    durationToWindow(resolveDuration(row), row.eventTime) ?? {
      fromIso: null,
      toIso: row.eventTime,
      durationLabel: "—"
    }
  );
}

/** Format a millisecond span as "h h m min". Exposed for gap rows. */
export function formatDurationSpanMs(ms: number): string {
  return formatDurationFromTotalMinutes(Math.max(0, Math.round(ms / 60_000)));
}

/** Ignore sub-minute differences when scanning for gaps. */
export const SOF_GAP_MIN_MS = 60_000;

export type SofTimelineGapRow = {
  /** Event end (ISO). For no-duration events this is the only known instant. */
  toIso: string;
  /** Event start (ISO) when the event has its own duration; otherwise `null`. */
  fromIso: string | null;
};

export type SofTimelineGap = {
  fromIso: string;
  toIso: string;
  /** Length of the gap in ms (always > `SOF_GAP_MIN_MS`). */
  spanMs: number;
};

/**
 * Inspect a timeline (ascending by event end) and return any *real* gaps the
 * frontend should expose with a "Fill gap" affordance.
 *
 * Mirrors the backend's chaining behavior in `effectiveSofPeriodBoundsMs`:
 * a row WITHOUT its own duration implicitly fills the period from the previous
 * row's end to its `eventTime`, so we must NOT treat the run-up to such a row
 * as a gap — otherwise the user would click "Fill gap" and the backend would
 * reject the resulting insert as "events cannot overlap".
 */
export function findSofTimelineGaps(rowsAsc: SofTimelineGapRow[]): SofTimelineGap[] {
  const gaps: SofTimelineGap[] = [];
  let prevEndMs: number | null = null;
  for (const row of rowsAsc) {
    const hasOwnDuration = row.fromIso !== null;
    const currStartMs = hasOwnDuration
      ? new Date(row.fromIso!).getTime()
      : new Date(row.toIso).getTime();
    if (
      hasOwnDuration &&
      prevEndMs !== null &&
      currStartMs - prevEndMs > SOF_GAP_MIN_MS
    ) {
      gaps.push({
        fromIso: new Date(prevEndMs).toISOString(),
        toIso: new Date(currStartMs).toISOString(),
        spanMs: currStartMs - prevEndMs
      });
    }
    const currEndMs = new Date(row.toIso).getTime();
    prevEndMs = prevEndMs === null ? currEndMs : Math.max(prevEndMs, currEndMs);
  }
  return gaps;
}

/**
 * Resolve the "Fill gap" pre-fill against the freshest event list.
 *
 * Why this exists: the gap row displayed in the events table is derived from
 * the React-Query cache at render time. When the user clicks "Fill gap" we
 * refetch the events list and call this with the FRESH rows so the saved
 * event matches reality, not the cached snapshot. If a concurrent change
 * filled (or partially filled) the same gap, the previously-displayed range
 * would overlap a real event and the backend would (correctly) reject the
 * save — picking the freshly-computed matching gap fixes that.
 *
 * Returns the largest fresh gap that overlaps the click's [start, end] range,
 * or `null` when no gap intersects it any more.
 */
export function resolveFreshSofGapForClick(
  freshEventsAsc: SofEventWindowRow[],
  clickedFromIso: string,
  clickedToIso: string
): SofTimelineGap | null {
  const clickedFromMs = new Date(clickedFromIso).getTime();
  const clickedToMs = new Date(clickedToIso).getTime();
  if (!Number.isFinite(clickedFromMs) || !Number.isFinite(clickedToMs)) return null;
  if (clickedToMs <= clickedFromMs) return null;
  const windows: SofTimelineGapRow[] = freshEventsAsc.map((ev) => {
    const w = sofEventOwnWindow(ev);
    return { fromIso: w.fromIso, toIso: w.toIso };
  });
  const gaps = findSofTimelineGaps(windows);
  let best: SofTimelineGap | null = null;
  let bestOverlap = 0;
  for (const g of gaps) {
    const gStart = new Date(g.fromIso).getTime();
    const gEnd = new Date(g.toIso).getTime();
    const overlapStart = Math.max(gStart, clickedFromMs);
    const overlapEnd = Math.min(gEnd, clickedToMs);
    const overlap = overlapEnd - overlapStart;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = g;
    }
  }
  return best;
}

/** ISO instant at event end; `durationMinutes` preferred; else `durationHours`; else gap from previous row end. */
export function sofEventWindow(
  row: SofEventWindowRow,
  previousToIso: string | null
): { fromIso: string | null; toIso: string; durationLabel: string } {
  const ownWindow = durationToWindow(resolveDuration(row), row.eventTime);
  if (ownWindow) return ownWindow;

  if (previousToIso) {
    const toMs = new Date(row.eventTime).getTime();
    const fromMs = new Date(previousToIso).getTime();
    const spanMins = Math.round((toMs - fromMs) / 60_000);
    return {
      fromIso: previousToIso,
      toIso: row.eventTime,
      durationLabel: spanMins > 0 ? formatDurationFromTotalMinutes(spanMins) : "—"
    };
  }
  return { fromIso: null, toIso: row.eventTime, durationLabel: "—" };
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Split `yyyy-mm-ddTHH:mm` or a parseable ISO/local string into date + time for paired inputs. */
export function splitLocalDatetimeInput(v: string): { date: string; time: string } {
  const s = v?.trim() ?? "";
  if (!s) return { date: "", time: "" };
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (m) return { date: m[1]!, time: m[2]! };
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
  };
}

/** Combine calendar date and `HH:mm` into the same shape as `toDatetimeLocalValue` (local, no zone suffix). */
export function mergeLocalDatetimeParts(date: string, time: string): string {
  const d = date.trim();
  if (!d) return "";
  const tRaw = time.trim();
  const t = /^\d{2}:\d{2}$/.test(tRaw) ? tRaw : "00:00";
  return `${d}T${t}`;
}

/**
 * Parse manual 24-hour clock entry (no AM/PM). Accepts `H`, `HH`, `H:M`, `HH:MM`, or four digits
 * `HHMM`. Returns normalized `HH:mm` or null if empty/invalid.
 */
export function parseHourMinute24Input(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, "");
  if (!s) return null;
  const hhmm = s.match(/^(\d{2})(\d{2})$/);
  if (hhmm) {
    const h = parseInt(hhmm[1], 10);
    const min = parseInt(hhmm[2], 10);
    if (!Number.isFinite(h) || h < 0 || h > 23 || !Number.isFinite(min) || min < 0 || min > 59) {
      return null;
    }
    return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }
  const m = s.match(/^(\d{1,2})(?::(\d{1,2})?)?$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const minPart = m[2];
  const min = minPart === undefined || minPart === "" ? 0 : parseInt(minPart, 10);
  if (!Number.isFinite(h) || h < 0 || h > 23) return null;
  if (!Number.isFinite(min) || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Shape of `useInfiniteQuery` data for SOF event lists. */
export type SofEventInfinitePages = {
  pages: Array<{ data: SofEventListItem[] }>;
};

export function flatSofEventInfinitePages(
  data: SofEventInfinitePages | undefined
): SofEventListItem[] {
  return data?.pages.flatMap((p) => p.data) ?? [];
}

/* ------------------------------------------------------------------ *
 *  Standard SOF (Statement of Facts) time calculation
 *
 *  Maritime SOFs record events as chronological time-stamps. The period
 *  between two consecutive events is one accounting segment, and that
 *  segment is classified by the *closing* event's category:
 *
 *    - NORMAL       → working time (counts as laytime used).
 *    - HOLD_DELAY   → idle / hold time (excluded from laytime used).
 *
 *  Equations (per SOF, evaluated against events sorted by eventTime asc):
 *
 *      first  = events[0].eventTime
 *      last   = events[N-1].eventTime
 *      total  = last - first
 *
 *      For each consecutive pair (i, i+1):
 *          Δt(i, i+1) = events[i+1].eventTime - events[i].eventTime
 *          if events[i+1].category == HOLD_DELAY:
 *              hold     += Δt(i, i+1)
 *          else:
 *              working  += Δt(i, i+1)
 *
 *      unaccounted = Σ gap durations (between two events with explicit
 *                    `durationMinutes` whose periods don't touch)
 *
 *  Downstream laytime money (computed server-side in
 *  `LaytimeCalculationService`):
 *
 *      allowed  = (cargoQtyMt / dischargeRateMtPerDay) * 24
 *                 OR manual override from the charter party
 *      used     = Σ working segments after contract-calendar exclusions
 *      excluded = Σ hold segments + calendar exclusions
 *      balance  = allowed - used
 *      demurrage_hours = max(0, used - allowed)
 *      dispatch_hours  = max(0, allowed - used)
 *      demurrage_amount = (demurrage_hours / 24) * demurrage_rate_per_day
 *      dispatch_amount  = (dispatch_hours / 24) * dispatch_rate_per_day
 *      net_amount       = demurrage_amount - dispatch_amount
 *
 *  This frontend helper produces the *event-level* breakdown only — the
 *  paying numbers (allowed / demurrage / dispatch / money) live on the
 *  Laytime tab driven by the server's `recalculate*` endpoints.
 * ------------------------------------------------------------------ */

export type SofTimeSummary = {
  /** Number of events considered (after dropping invalid eventTimes). */
  eventCount: number;
  /** Earliest event ISO, or null when no events. */
  firstEventIso: string | null;
  /** Latest event ISO, or null when no events. */
  lastEventIso: string | null;
  /** `last - first` in milliseconds (0 when 0/1 events). */
  totalSpanMs: number;
  /** Σ Δt for segments whose closing event is NORMAL (counts as laytime). */
  workingMs: number;
  /** Σ Δt for segments whose closing event is HOLD_DELAY (excluded). */
  holdMs: number;
  /** Σ Δt for segments whose closing event category is unknown (legacy). */
  unclassifiedMs: number;
  /** Σ unaccounted span between two events that have explicit durations. */
  unaccountedGapMs: number;
};

const EMPTY_SOF_TIME_SUMMARY: SofTimeSummary = {
  eventCount: 0,
  firstEventIso: null,
  lastEventIso: null,
  totalSpanMs: 0,
  workingMs: 0,
  holdMs: 0,
  unclassifiedMs: 0,
  unaccountedGapMs: 0
};

type SofTimeSummaryRow = Pick<
  SofEventListItem,
  "eventTime" | "durationHours" | "durationMinutes" | "isHold"
> & {
  eventTypeDefinition?: { category?: SofEventTypeCategoryUi | null } | null;
};

function classifySofEventCategory(row: SofTimeSummaryRow): "working" | "hold" | "unclassified" {
  const cat = row.eventTypeDefinition?.category;
  if (cat === "HOLD_DELAY") return "hold";
  if (cat === "NORMAL") return "working";
  if (row.isHold === true) return "hold";
  if (row.isHold === false) return "working";
  return "unclassified";
}

/**
 * Standard event-level breakdown for a SOF. See the block comment above
 * `SofTimeSummary` for the equations.
 *
 * Implementation note: the period preceding each event is classified by
 * THAT event's category — the closing-event rule used by every BIMCO-style
 * laytime sheet. Sub-minute differences are ignored (matches gap detection).
 */
export function computeSofTimeSummary(events: SofTimeSummaryRow[]): SofTimeSummary {
  if (!events.length) return { ...EMPTY_SOF_TIME_SUMMARY };

  const sortable = events
    .map((ev) => {
      const t = new Date(ev.eventTime).getTime();
      return Number.isFinite(t) ? { ev, t } : null;
    })
    .filter((r): r is { ev: SofTimeSummaryRow; t: number } => r !== null)
    .sort((a, b) => a.t - b.t);

  if (sortable.length === 0) return { ...EMPTY_SOF_TIME_SUMMARY };

  const first = sortable[0]!;
  const last = sortable[sortable.length - 1]!;

  let workingMs = 0;
  let holdMs = 0;
  let unclassifiedMs = 0;

  for (let i = 1; i < sortable.length; i++) {
    const prev = sortable[i - 1]!;
    const curr = sortable[i]!;
    const dt = Math.max(0, curr.t - prev.t);
    if (dt === 0) continue;
    const cls = classifySofEventCategory(curr.ev);
    if (cls === "working") workingMs += dt;
    else if (cls === "hold") holdMs += dt;
    else unclassifiedMs += dt;
  }

  // Unaccounted (gap) time: the same red-row "Incomplete (gap)" rule used in
  // the events table. Tracked separately so the user can see whether their
  // explicit durations cover the entire SOF window or not.
  const windowsForGaps: SofTimelineGapRow[] = sortable.map(({ ev }) => {
    const w = sofEventOwnWindow(ev);
    return { fromIso: w.fromIso, toIso: w.toIso };
  });
  const unaccountedGapMs = findSofTimelineGaps(windowsForGaps).reduce(
    (acc, g) => acc + g.spanMs,
    0
  );

  return {
    eventCount: sortable.length,
    firstEventIso: new Date(first.t).toISOString(),
    lastEventIso: new Date(last.t).toISOString(),
    totalSpanMs: Math.max(0, last.t - first.t),
    workingMs,
    holdMs,
    unclassifiedMs,
    unaccountedGapMs
  };
}

export type SofEventLatestMetrics = Pick<
  SofEventListItem,
  "eventTime" | "cumulativeDischargeMt" | "robQuantityMt" | "dischargeQuantityMt"
>;

/** Most recent event by `eventTime` (for discharge / context summaries). */
export function latestSofEventMetrics(rows: SofEventListItem[]): SofEventLatestMetrics | null {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort(
    (a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()
  );
  const ev = sorted[0]!;
  return {
    eventTime: ev.eventTime,
    cumulativeDischargeMt: ev.cumulativeDischargeMt,
    robQuantityMt: ev.robQuantityMt,
    dischargeQuantityMt: ev.dischargeQuantityMt
  };
}
