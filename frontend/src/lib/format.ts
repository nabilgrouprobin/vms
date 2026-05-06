/** Fixed locale so SSR and the browser produce identical strings (avoids hydration mismatches). */
const DT_LOCALE = "en-US";

export function formatDt(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(DT_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(d);
}

export function formatNum(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}
