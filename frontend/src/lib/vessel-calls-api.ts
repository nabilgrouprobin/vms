import { api } from "@/lib/api";
import type { Paginated, VesselCallListRow, VesselCallTripsMeta } from "@/types/vms";

export function fetchVesselCalls(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  status?: string;
  motherVesselOnly?: boolean;
  /** Mother (default), lighter port calls, or both. */
  hullKind?: "mother" | "lighter" | "all";
  /** Restrict to calls for a specific hull id. */
  vesselId?: string;
}) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.motherVesselOnly === false) sp.set("motherVesselOnly", "false");
  if (params.hullKind) sp.set("hullKind", params.hullKind);
  if (params.vesselId) sp.set("vesselId", params.vesselId);
  const q = sp.toString();
  return api<Paginated<VesselCallListRow>>(`/vessel-calls${q ? `?${q}` : ""}`);
}

export function fetchVesselCall(id: string) {
  return api<VesselCallTripsMeta>(`/vessel-calls/${encodeURIComponent(id)}`);
}

export function createVesselCall(body: {
  vesselId: string;
  /** Omit to let the server assign `YY-MM-DD-{hull}-{seq}` (Asia/Dhaka day). */
  callNo?: string;
  cargoNameSnapshot?: string | null;
  eta?: string | null;
  hullKind?: "mother" | "lighter";
}) {
  return api<VesselCallListRow>(`/vessel-calls`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function patchVesselCall(
  id: string,
  body: {
    laytimeTimeZone?: string | null;
    /** Link an import contract to this mother vessel call, or null to unlink. */
    importContractId?: string | null;
    /** Total cargo quantity (MT) for laytime / discharge planning. */
    approxTotalWeightTon?: number | null;
    status?: string;
    callNo?: string;
    cargoNameSnapshot?: string | null;
    /** ISO 8601, or null to clear ETA. */
    eta?: string | null;
  }
) {
  return api<unknown>(`/vessel-calls/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function deleteVesselCall(id: string) {
  return api<{ ok: true; id: string }>(`/vessel-calls/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
