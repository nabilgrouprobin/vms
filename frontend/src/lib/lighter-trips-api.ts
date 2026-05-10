import { api } from "@/lib/api";
import type {
  LighterTripBoardMetricsResponse,
  LighterTripDetail,
  LighterTripListRow,
  LighterVesselPickerRow,
  OpenLighterAssignmentRow,
  Paginated
} from "@/types/vms";

const prefix = "/lighter-trips";

/** Used by Reports (e.g. ghat-aging tables). */
export function fetchLighterTrips(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  vesselCallId?: string;
  lighterVesselId?: string;
  status?: string;
  report?: "ghat-aging";
}) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search) sp.set("search", params.search);
  if (params.vesselCallId) sp.set("vesselCallId", params.vesselCallId);
  if (params.lighterVesselId) sp.set("lighterVesselId", params.lighterVesselId);
  if (params.status) sp.set("status", params.status);
  if (params.report) sp.set("report", params.report);
  const q = sp.toString();
  return api<Paginated<LighterTripListRow>>(`${prefix}${q ? `?${q}` : ""}`);
}

export function fetchLighterTripBoardMetrics(vesselCallIds: string[]) {
  if (!vesselCallIds.length) {
    return Promise.resolve({ byVesselCallId: {} } as LighterTripBoardMetricsResponse);
  }
  const sp = new URLSearchParams();
  sp.set("vesselCallIds", [...new Set(vesselCallIds)].slice(0, 40).join(","));
  return api<LighterTripBoardMetricsResponse>(
    `${prefix}/discharge-metrics-by-calls?${sp.toString()}`
  );
}

export function fetchOpenLighterAssignments(vesselCallId: string) {
  return api<OpenLighterAssignmentRow[]>(
    `${prefix}/vessel-calls/${encodeURIComponent(vesselCallId)}/open-assignments`
  );
}

export type FetchLighterVesselsForPickerParams = {
  search?: string;
  limit?: number;
  cursor?: string;
  id?: string;
  /** When true, lists deactivated lighters from Master data as well */
  includeInactive?: boolean;
};

export function fetchLighterVesselsForPicker(
  params: FetchLighterVesselsForPickerParams = {}
): Promise<Paginated<LighterVesselPickerRow>> {
  const sp = new URLSearchParams();
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.id?.trim()) sp.set("id", params.id.trim());
  if (params.cursor?.trim()) sp.set("cursor", params.cursor.trim());
  if (params.includeInactive) sp.set("includeInactive", "true");
  sp.set("limit", String(params.limit ?? 24));
  return api<Paginated<LighterVesselPickerRow>>(
    `${prefix}/meta/lighter-vessels?${sp.toString()}`
  );
}

export function fetchLighterTripDetail(id: string) {
  return api<LighterTripDetail>(`${prefix}/${encodeURIComponent(id)}`);
}

export function createLighterTrip(body: {
  lighterAssignmentId?: string;
  vesselCallId?: string;
  lighterVesselId: string;
  lighterPortCallId?: string;
  remarks?: string | null;
}) {
  return api<LighterTripDetail>(prefix, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export type PatchLighterTripBody = {
  remarks?: string | null;
  status?: string;
  holdReason?: string | null;
  syncLighterAssignment?: boolean;
  statusChangeRemarks?: string | null;
  carrierConfirmedAt?: string | null;
};

export function patchLighterTrip(id: string, body: PatchLighterTripBody) {
  return api<LighterTripDetail>(`${prefix}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}
