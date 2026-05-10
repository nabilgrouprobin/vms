import type { SofEventListItem } from "@/types/vms";

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
