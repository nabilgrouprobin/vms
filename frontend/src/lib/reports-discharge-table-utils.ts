import type { VesselCallBoardMetrics } from "@/types/vms";

export function parseMt(v: string | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function fmtMt(n: number | null, digits = 3): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

export function fmtInt(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return String(n);
}

export function metricsFor(
  byId: Record<string, VesselCallBoardMetrics>,
  vesselCallId: string | undefined
): VesselCallBoardMetrics | undefined {
  if (!vesselCallId) return undefined;
  return byId[vesselCallId];
}
