export const LAYTIME_WEEKDAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
] as const;

export type LaytimeWeekday = (typeof LAYTIME_WEEKDAYS)[number];

const LAYTIME_WEEK_MARKER =
  /^__LAYTIME_WEEK__\s+(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\s+(\d{2}:\d{2})\s+(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\s+(\d{2}:\d{2})$/i;

export function parseLaytimeWeekMarker(raw: string | null | undefined): {
  startDay: LaytimeWeekday;
  startTime: string;
  endDay: LaytimeWeekday;
  endTime: string;
  notes: string;
} | null {
  if (!raw?.trim()) return null;
  const first = raw.split("\n")[0]?.trim() ?? "";
  const m = first.match(LAYTIME_WEEK_MARKER);
  if (!m) return null;
  return {
    startDay: m[1].toUpperCase() as LaytimeWeekday,
    startTime: m[2],
    endDay: m[3].toUpperCase() as LaytimeWeekday,
    endTime: m[4],
    notes: raw.split("\n").slice(1).join("\n").trim()
  };
}

export function stripLaytimeWeekFirstLine(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const first = raw.split("\n")[0]?.trim() ?? "";
  if (LAYTIME_WEEK_MARKER.test(first)) {
    return raw.split("\n").slice(1).join("\n").trim();
  }
  return raw.trim();
}

export function buildLaytimeExcludedTimePeriod(
  startDay: LaytimeWeekday,
  startTime: string,
  endDay: LaytimeWeekday,
  endTime: string,
  notes: string
): string | null {
  const line = `__LAYTIME_WEEK__ ${startDay} ${startTime} ${endDay} ${endTime}`;
  const n = notes.trim();
  if (!n) return line;
  return `${line}\n${n}`;
}

export type LaytimeWeekFieldDraft = {
  weekStartDay: LaytimeWeekday;
  weekStartTime: string;
  weekEndDay: LaytimeWeekday;
  weekEndTime: string;
  calendarNotes: string;
};

/** Payload for PATCH laytime week fields (statement or contract). */
export function laytimeWeekPatchFromDraft(draft: LaytimeWeekFieldDraft): {
  laytimeExcludedTimePeriod: string;
  laytimeExcludedDays: LaytimeWeekday[];
} {
  return {
    laytimeExcludedTimePeriod: buildLaytimeExcludedTimePeriod(
      draft.weekStartDay,
      draft.weekStartTime,
      draft.weekEndDay,
      draft.weekEndTime,
      draft.calendarNotes
    )!,
    laytimeExcludedDays: excludedDaysFromWorkSpan(draft.weekStartDay, draft.weekEndDay)
  };
}

function dayIndex(d: LaytimeWeekday): number {
  return LAYTIME_WEEKDAYS.indexOf(d);
}

/** Workdays from start through end inclusive (forward on the week circle). */
export function excludedDaysFromWorkSpan(startDay: LaytimeWeekday, endDay: LaytimeWeekday): LaytimeWeekday[] {
  const si = dayIndex(startDay);
  const ei = dayIndex(endDay);
  if (si < 0 || ei < 0) return [...LAYTIME_WEEKDAYS];
  const work = new Set<number>();
  let d = si;
  work.add(d);
  let guard = 0;
  while (d !== ei && guard < 8) {
    d = (d + 1) % 7;
    work.add(d);
    guard++;
  }
  return LAYTIME_WEEKDAYS.filter((_, i) => !work.has(i)) as LaytimeWeekday[];
}

export function workSpanFromExcludedDaysList(days: string[]): { start: LaytimeWeekday; end: LaytimeWeekday } {
  const ex = new Set(days.map((x) => x.trim().toUpperCase()));
  const work = LAYTIME_WEEKDAYS.filter((d) => !ex.has(d));
  if (work.length === 0) return { start: "MONDAY", end: "FRIDAY" };
  return { start: work[0], end: work[work.length - 1] };
}

export function humanizeLaytimeWeekday(d: LaytimeWeekday): string {
  return d.charAt(0) + d.slice(1).toLowerCase();
}
