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

/** Resolve an event's window using ONLY its own duration (no chaining). */
export function sofEventOwnWindow(row: SofEventWindowRow): {
  fromIso: string | null;
  toIso: string;
  durationLabel: string;
} {
  const toMs = new Date(row.eventTime).getTime();
  const dm = row.durationMinutes != null && row.durationMinutes > 0 ? row.durationMinutes : null;
  if (dm !== null) {
    return {
      fromIso: new Date(toMs - dm * 60_000).toISOString(),
      toIso: row.eventTime,
      durationLabel: formatDurationFromTotalMinutes(dm)
    };
  }
  const durH = parseHours(row.durationHours);
  if (durH !== null && durH > 0) {
    const fromMs = toMs - durH * 3_600_000;
    const spanMins = Math.round((toMs - fromMs) / 60_000);
    return {
      fromIso: new Date(fromMs).toISOString(),
      toIso: row.eventTime,
      durationLabel: formatDurationFromTotalMinutes(spanMins)
    };
  }
  return { fromIso: null, toIso: row.eventTime, durationLabel: "—" };
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
  const toMs = new Date(row.eventTime).getTime();
  const dm = row.durationMinutes != null && row.durationMinutes > 0 ? row.durationMinutes : null;
  if (dm !== null) {
    const fromMs = toMs - dm * 60_000;
    return {
      fromIso: new Date(fromMs).toISOString(),
      toIso: row.eventTime,
      durationLabel: formatDurationFromTotalMinutes(dm)
    };
  }
  const durH = parseHours(row.durationHours);
  if (durH !== null && durH > 0) {
    const fromMs = toMs - durH * 3_600_000;
    const spanMins = Math.round((toMs - fromMs) / 60_000);
    return {
      fromIso: new Date(fromMs).toISOString(),
      toIso: row.eventTime,
      durationLabel: formatDurationFromTotalMinutes(spanMins)
    };
  }
  const toIso = row.eventTime;
  if (previousToIso) {
    const fromMs = new Date(previousToIso).getTime();
    const spanMins = Math.round((toMs - fromMs) / 60_000);
    return {
      fromIso: previousToIso,
      toIso,
      durationLabel: spanMins > 0 ? formatDurationFromTotalMinutes(spanMins) : "—"
    };
  }
  return { fromIso: null, toIso, durationLabel: "—" };
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
