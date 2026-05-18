import { api, apiValidated } from "@/lib/api";
import {
  lighterSofChipPeekSchema,
  motherSofChipPeekSchema,
  type LighterSofChipPeekSchema,
  type MotherSofChipPeekSchema
} from "@/lib/api-schemas";
import type {
  LighterSofListRow,
  MotherSofListRow,
  Paginated,
  SofEventListItem,
  SofOptions
} from "@/types/vms";

export type MotherSofChipPeek = MotherSofChipPeekSchema;
export type LighterSofChipPeek = LighterSofChipPeekSchema;

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

/**
 * Validated fetcher used by the workspace header chip — guarantees we only
 * try to read `vesselCall.vessel.name` etc. when the backend really sent it.
 */
export function fetchMotherSofChipPeek(id: string) {
  return apiValidated(`${prefix}/mother-vessels/${id}`, motherSofChipPeekSchema);
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

/** Validated counterpart of `fetchMotherSofChipPeek` for the lighter scope. */
export function fetchLighterSofChipPeek(id: string) {
  return apiValidated(`${prefix}/lighter-vessels/${id}`, lighterSofChipPeekSchema);
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

/** Optional header lines for Laytime2000-style “port statement” above the chronology grid. */
export type LaytimePortStatementContext = {
  vesselName: string | null;
  voyageLine: string | null;
  portName: string | null;
  operationLabel: string;
  arrivedLine: string | null;
  norTenderedLine: string | null;
  inBerthOrWorkingLine: string | null;
};

export type MotherLaytimeContractSummary = {
  cargoQtyMt: number | null;
  /** Total vessel-call or trip cargo (MT) for partial % display */
  totalCargoQtyMt?: number | null;
  /** SOF partial cargo (MT) when set for allowance */
  partialCargoQtyMt?: number | null;
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
  /** CP explicit counting fraction (null if using hatch ratio only) */
  laytimeCountingFraction?: number | null;
  workableHatches?: number | null;
  totalHatches?: number | null;
  /** Multiplier applied after calendar (explicit or workable/total) */
  laytimeCountingFractionApplied?: number | null;
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
  contactStartsAt: string | null;
  contactEndsAt: string | null;
  durationHour: number;
  contactHour: number;
  freeTimeHour: number;
  toCountHour: number;
  notToCountHour: number;
  /** SOF Count-tagged hours this calendar day (wall clock, matches Events gaps). */
  sofWallToCountHour?: number;
  /** SOF Not count-tagged hours this calendar day (wall clock). */
  sofWallNotToCountHour?: number;
  /** @deprecated Use `toCountHour`. */
  workingHour: number;
  /** @deprecated Use `notToCountHour`. */
  idleHour: number;
  cumulativeTotalUsedHour: number;
  despatchHour: number;
  demurrageHour: number;
  preparationHour?: number;
  creditedLaytimeHour?: number;
  cumulativeCreditedHour?: number;
  onDemurrage: boolean;
  laytimeExpiresThisDay: boolean;
  dischargeQtyMt: number | null;
  activityDetails: string;
};

export type MotherLaytimeDailyLedger = {
  rows: MotherLaytimeDailyLedgerRow[];
  totalDurationHour?: number;
  totalContactHour: number;
  totalToCountHour?: number;
  totalNotToCountHour?: number;
  totalWorkingHour: number;
  totalPreparationHour?: number;
  totalFreeTimeHour: number;
  totalCreditedLaytimeHour: number;
  totalIdleHour: number;
  totalDespatchHour?: number;
  totalDemurrageHour: number;
  totalDischargeQtyMt: number;
};

/** Laytime2000-style chronology row (day-split segment slice). */
export type LaytimeChronologyRow = {
  date: string;
  weekday: string;
  startLocalHm: string;
  endLocalHm: string;
  fraction: number;
  remark: string;
  toCountHours: number;
  totalUsedHours: number;
  onDemurrageHours: number;
  closingEventId: string | null;
};

export type LaytimeRecalculateResult = {
  statement: unknown;
  breakdown: LaytimeBreakdown;
};

export type MotherLaytimeRecalculateResult = LaytimeRecalculateResult & {
  timesheet: MotherLaytimeTimesheet;
  dailyLedger: MotherLaytimeDailyLedger;
  chronology: LaytimeChronologyRow[];
};

/** Lighter SOF laytime recalculation now returns the same shape as mother (contract + daily sheet). */
export type LighterLaytimeRecalculateResult = MotherLaytimeRecalculateResult;

export type RecalculateLaytimeWeekBody = {
  laytimeExcludedTimePeriod?: string | null;
  laytimeExcludedDays?: string[];
};

export function recalculateMotherLaytime(sofId: string, week?: RecalculateLaytimeWeekBody) {
  return api<MotherLaytimeRecalculateResult>(
    `${prefix}/mother-vessels/${sofId}/laytime/recalculate`,
    {
      method: "POST",
      ...(week ? { body: JSON.stringify(week) } : {})
    }
  );
}

export function recalculateLighterLaytime(sofId: string, week?: RecalculateLaytimeWeekBody) {
  return api<LighterLaytimeRecalculateResult>(
    `${prefix}/lighter-vessels/${sofId}/laytime/recalculate`,
    {
      method: "POST",
      ...(week ? { body: JSON.stringify(week) } : {})
    }
  );
}
