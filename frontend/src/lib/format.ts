/** Fixed locale so SSR and the browser produce identical strings (avoids hydration mismatches). */
const DT_LOCALE = "en-US";

const DT_24H: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23"
};

/** Formats an ISO instant for UI and CSV: medium date + time, always 24-hour clock (no AM/PM). */
export function formatDt(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(DT_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...DT_24H
  }).format(d);
}

/** Time-of-day only from an ISO instant, 24-hour `HH:mm` style (locale-formatted, no AM/PM). */
export function formatTime24(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(DT_LOCALE, DT_24H).format(d);
}

export { formatLaytimeHoursAndMinutes as formatHoursDuration } from "@/lib/laytime-hours-format";

export function formatNum(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}
