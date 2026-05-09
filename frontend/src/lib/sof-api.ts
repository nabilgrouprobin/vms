import { api } from "@/lib/api";
import type {
  LighterSofListRow,
  MotherSofListRow,
  Paginated,
  SofEventListItem,
  SofOptions
} from "@/types/vms";

const prefix = "/sof";

export function fetchSofOptions() {
  return api<SofOptions>(`${prefix}/options`);
}

export function fetchMotherSofs(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  status?: string;
  vesselCallId?: string;
}) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.vesselCallId) sp.set("vesselCallId", params.vesselCallId);
  const q = sp.toString();
  return api<Paginated<MotherSofListRow>>(`${prefix}/mother-vessels${q ? `?${q}` : ""}`);
}

export function fetchMotherSof(id: string) {
  return api<unknown>(`${prefix}/mother-vessels/${id}`);
}

export function createMotherSof(body: Record<string, unknown>) {
  return api<unknown>(`${prefix}/mother-vessels`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function updateMotherSof(id: string, body: Record<string, unknown>) {
  return api<unknown>(`${prefix}/mother-vessels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function deleteMotherSof(id: string) {
  return api<unknown>(`${prefix}/mother-vessels/${id}`, { method: "DELETE" });
}

export function fetchMotherSofEvents(sofId: string, params: { limit?: number; cursor?: string }) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  return api<Paginated<SofEventListItem>>(
    `${prefix}/mother-vessels/${sofId}/events?${sp.toString()}`
  );
}

export function createMotherSofEvent(sofId: string, body: Record<string, unknown>) {
  return api<unknown>(`${prefix}/mother-vessels/${sofId}/events`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function fetchDailyDischarges(sofId: string) {
  return api<unknown[]>(`${prefix}/mother-vessels/${sofId}/daily-discharges`);
}

export function createDailyDischarge(sofId: string, body: Record<string, unknown>) {
  return api<unknown>(`${prefix}/mother-vessels/${sofId}/daily-discharges`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function updateDailyDischarge(dischargeId: string, body: Record<string, unknown>) {
  return api<unknown>(`${prefix}/daily-discharges/${dischargeId}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function deleteDailyDischarge(dischargeId: string) {
  return api<unknown>(`${prefix}/daily-discharges/${dischargeId}`, {
    method: "DELETE"
  });
}

export function fetchLighterSofs(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  status?: string;
  lighterTripId?: string;
  vesselCallId?: string;
  lighterVesselId?: string;
}) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search) sp.set("search", params.search);
  if (params.status) sp.set("status", params.status);
  if (params.lighterTripId) sp.set("lighterTripId", params.lighterTripId);
  if (params.vesselCallId) sp.set("vesselCallId", params.vesselCallId);
  if (params.lighterVesselId) sp.set("lighterVesselId", params.lighterVesselId);
  const q = sp.toString();
  return api<Paginated<LighterSofListRow>>(`${prefix}/lighter-vessels${q ? `?${q}` : ""}`);
}

export function fetchLighterSof(id: string) {
  return api<unknown>(`${prefix}/lighter-vessels/${id}`);
}

export function createLighterSof(body: Record<string, unknown>) {
  return api<unknown>(`${prefix}/lighter-vessels`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function updateLighterSof(id: string, body: Record<string, unknown>) {
  return api<unknown>(`${prefix}/lighter-vessels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function deleteLighterSof(id: string) {
  return api<unknown>(`${prefix}/lighter-vessels/${id}`, { method: "DELETE" });
}

export function fetchLighterSofEvents(sofId: string, params: { limit?: number; cursor?: string }) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  return api<Paginated<SofEventListItem>>(
    `${prefix}/lighter-vessels/${sofId}/events?${sp.toString()}`
  );
}

export function createLighterSofEvent(sofId: string, body: Record<string, unknown>) {
  return api<unknown>(`${prefix}/lighter-vessels/${sofId}/events`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function updateSofEvent(eventId: string, body: Record<string, unknown>) {
  return api<unknown>(`${prefix}/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function deleteSofEvent(eventId: string) {
  return api<unknown>(`${prefix}/events/${eventId}`, { method: "DELETE" });
}

export type LaytimeBreakdown = {
  commenceAt: string;
  allowedHours: number | null;
  allowedSource: string;
  usedHours: number;
  excludedHours: number;
  balanceHours: number;
  demurrageHours: number;
  dispatchHours: number;
  demurrageAmount: number | null;
  dispatchAmount: number | null;
  netAmount: number | null;
  currency: string | null;
};

export type MotherLaytimeContractSummary = {
  cargoQtyMt: number | null;
  dischargeRateMtPerDay: number | null;
  dischargeRateUnit: string | null;
  allowedHours: number | null;
  allowedSource: string;
  laytimeDemurrageRatePerDay: number | null;
  laytimeDispatchRatePerDay: number | null;
  currency: string | null;
  excludedDays: string[];
  holidaysExcluded: boolean | null;
  laytimeTimeZoneRaw: string | null;
  laytimeResolvedTimeZone: string;
  /** Contract contact window used for daily “Contract hrs” column */
  contractWeekLabel?: string;
};

export type MotherLaytimeTimesheetRow = {
  closingEventId: string | null;
  eventType: string;
  periodFrom: string;
  periodTo: string;
  remark: string;
  elapsedWallHours: number;
  countingUsedHours: number;
  countingExcludedHours: number;
  accumulatedUsedHours: number;
};

export type MotherLaytimeTimesheet = {
  contractSummary: MotherLaytimeContractSummary;
  rows: MotherLaytimeTimesheetRow[];
};

export type MotherLaytimeDailyLedgerRow = {
  date: string;
  weekday: string;
  contactHour: number;
  workingHour: number;
  idleHour: number;
  demurrageHour: number;
  dischargeQtyMt: number | null;
  activityDetails: string;
};

export type MotherLaytimeDailyLedger = {
  rows: MotherLaytimeDailyLedgerRow[];
  totalContactHour: number;
  totalWorkingHour: number;
  totalIdleHour: number;
  totalDemurrageHour: number;
  totalDischargeQtyMt: number;
};

export type LaytimeRecalculateResult = {
  statement: unknown;
  breakdown: LaytimeBreakdown;
};

export type MotherLaytimeRecalculateResult = LaytimeRecalculateResult & {
  timesheet: MotherLaytimeTimesheet;
  dailyLedger: MotherLaytimeDailyLedger;
};

/** Lighter SOF laytime recalculation now returns the same shape as mother (contract + daily sheet). */
export type LighterLaytimeRecalculateResult = MotherLaytimeRecalculateResult;

export function recalculateMotherLaytime(sofId: string) {
  return api<MotherLaytimeRecalculateResult>(
    `${prefix}/mother-vessels/${sofId}/laytime/recalculate`,
    { method: "POST" }
  );
}

export function recalculateLighterLaytime(sofId: string) {
  return api<LighterLaytimeRecalculateResult>(
    `${prefix}/lighter-vessels/${sofId}/laytime/recalculate`,
    { method: "POST" }
  );
}
