import { api } from "@/lib/api";
import type { Paginated, VesselCallListRow, VesselCallTripsMeta } from "@/types/vms";

export function fetchVesselCalls(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  status?: string;
  motherVesselOnly?: boolean;
}) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.motherVesselOnly === false) sp.set("motherVesselOnly", "false");
  const q = sp.toString();
  return api<Paginated<VesselCallListRow>>(`/vessel-calls${q ? `?${q}` : ""}`);
}

export function fetchVesselCall(id: string) {
  return api<VesselCallTripsMeta>(`/vessel-calls/${encodeURIComponent(id)}`);
}

export function patchVesselCall(
  id: string,
  body: {
    laytimeTimeZone?: string | null;
    /** Link an import contract to this mother vessel call, or null to unlink. */
    importContractId?: string | null;
    /** Total cargo quantity (MT) for laytime / discharge planning. */
    approxTotalWeightTon?: number | null;
  }
) {
  return api<unknown>(`/vessel-calls/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}
