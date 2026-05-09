/** Fixed locale so SSR and the browser produce identical strings (avoids hydration mismatches). */
const DT_LOCALE = "en-US";

/** Formats an ISO instant for UI and CSV: medium date + short time, always 24-hour clock. */
export function formatDt(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(DT_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false
  }).format(d);
}

export function formatNum(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}
