/** Shared formatters for mother / lighter SOF panels. */

export function approxOutstandingMt(
  approxTotalWeightTon: string | null | undefined,
  totalDischargeMt: string | null | undefined
): string {
  const a =
    approxTotalWeightTon != null && approxTotalWeightTon !== ""
      ? parseFloat(approxTotalWeightTon)
      : NaN;
  const d =
    totalDischargeMt != null && totalDischargeMt !== "" ? parseFloat(totalDischargeMt) : NaN;
  if (!Number.isFinite(a) || !Number.isFinite(d)) return "—";
  const r = a - d;
  return `${r.toFixed(3)} MT`;
}

export function hoursRelativeToNow(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const h = (t - Date.now()) / 3_600_000;
  if (h >= 0) return `${h.toFixed(1)} h until`;
  return `${Math.abs(h).toFixed(1)} h ago`;
}
