import type { ReadonlyURLSearchParams } from "next/navigation";

import type { VesselSofWorkspaceSection } from "@/components/sof/detail/types";

/** Dispatched from vessel SOF workspace before clearing `?id=` so sheets can close synchronously. */
export const VESSEL_SOF_CLEAR_SELECTION_EVENT = "vms:vessel-sof-clear-selection";

/**
 * Merge updates into the current query string and return `pathname?query`.
 * Pass `null`, `undefined`, or `""` for a key to remove it (e.g. clear `id`).
 * Preserves unrelated params — fixes client navigations when only `id` should change.
 */
export function applySearchParams(
  pathname: string,
  current: URLSearchParams | ReadonlyURLSearchParams,
  updates: Record<string, string | null | undefined>
): string {
  const sp = new URLSearchParams(current.toString());
  for (const [key, val] of Object.entries(updates)) {
    if (val === null || val === undefined || val === "") {
      sp.delete(key);
    } else {
      sp.set(key, val);
    }
  }
  const q = sp.toString();
  return q ? `${pathname}?${q}` : pathname;
}

/** Query keys shared across `/vessel-sof/*` workspace pages (mother/lighter picker state). */
const VESSEL_SOF_WORKSPACE_QUERY_KEYS = [
  "kind",
  "id",
  "vesselCallId",
  "lighterCallId",
  /** Legacy hull-only selection; workspace may normalize to `lighterCallId`. */
  "lighterVesselId",
  "pickSof"
] as const;

/** Build `pathname?…` carrying the current mother/lighter SOF selection for another vessel-sof route. */
export function preserveVesselSofWorkspaceQuery(
  targetPathname: string,
  current: URLSearchParams | ReadonlyURLSearchParams
): string {
  const sp = new URLSearchParams();
  for (const key of VESSEL_SOF_WORKSPACE_QUERY_KEYS) {
    const v = current.get(key);
    if (v != null && v !== "") sp.set(key, v);
  }
  const q = sp.toString();
  return q ? `${targetPathname}?${q}` : targetPathname;
}

export function isVesselSofWorkspaceNavPath(pathname: string): boolean {
  return (
    pathname === "/vessel-sof/overview" ||
    pathname === "/vessel-sof/events" ||
    pathname === "/vessel-sof/laytime" ||
    pathname === "/vessel-sof/discharge"
  );
}

export type VesselSofWorkspaceQuery = {
  id?: string | null;
  vesselCallId?: string | null;
  /** Selected lighter port visit (`VesselCall` id for a lighter hull). */
  lighterCallId?: string | null;
  /** @deprecated Prefer `lighterCallId`. */
  lighterVesselId?: string | null;
  /** When set (e.g. after “Change SOF”), skip auto-selecting the only SOF so the user can choose another. */
  pickSof?: string | null;
};

export function vesselSofWorkspacePath(
  section: VesselSofWorkspaceSection,
  kind: "mother" | "lighter",
  selection?: VesselSofWorkspaceQuery | null
) {
  const sp = new URLSearchParams();
  sp.set("kind", kind);
  const s = selection ?? {};
  const sid = s.id?.trim();
  const vc = s.vesselCallId?.trim();
  const lc = s.lighterCallId?.trim();
  const lv = s.lighterVesselId?.trim();
  const pick = s.pickSof?.trim();
  if (sid) sp.set("id", sid);
  if (vc) sp.set("vesselCallId", vc);
  if (lc) sp.set("lighterCallId", lc);
  if (lv) sp.set("lighterVesselId", lv);
  if (pick) sp.set("pickSof", pick);
  return `/vessel-sof/${section}?${sp.toString()}`;
}

/** Fleet / SOF summary vs discharge workspace (cumulative discharge, ghat aging, daily rows). */
export function reportsWorkspacePath(
  kind: "mother" | "lighter",
  options?: { discharge?: boolean }
) {
  const sp = new URLSearchParams();
  sp.set("kind", kind);
  if (options?.discharge) {
    sp.set("view", "discharge");
  }
  return `/reports?${sp.toString()}`;
}

/** Deep-link into Reports → Discharge & aging with vessel + optional SOF selection. */
export function reportsDischargePath(
  kind: "mother" | "lighter",
  params: VesselSofWorkspaceQuery = {}
) {
  const sp = new URLSearchParams();
  sp.set("kind", kind);
  sp.set("view", "discharge");
  const sid = params.id?.trim();
  const vc = params.vesselCallId?.trim();
  const lc = params.lighterCallId?.trim();
  const lv = params.lighterVesselId?.trim();
  const pick = params.pickSof?.trim();
  if (sid) sp.set("id", sid);
  if (vc) sp.set("vesselCallId", vc);
  if (lc) sp.set("lighterCallId", lc);
  if (lv) sp.set("lighterVesselId", lv);
  if (pick) sp.set("pickSof", pick);
  return `/reports?${sp.toString()}`;
}

export function tripsWorkspacePath(
  kind: "mother" | "lighter",
  selection?: { vesselCallId?: string | null; lighterCallId?: string | null; lighterVesselId?: string | null }
) {
  const sp = new URLSearchParams();
  sp.set("kind", kind);
  const vc = selection?.vesselCallId?.trim();
  const lc = selection?.lighterCallId?.trim();
  const lv = selection?.lighterVesselId?.trim();
  if (kind === "mother" && vc) sp.set("vesselCallId", vc);
  if (kind === "lighter" && lc) sp.set("lighterCallId", lc);
  if (kind === "lighter" && !lc && lv) sp.set("lighterVesselId", lv);
  return `/trips?${sp.toString()}`;
}

/** Mother/lighter selection params shared with `/trips` (excludes SOF-only `id` / `pickSof`). */
const TRIPS_WORKSPACE_SELECTION_KEYS = [
  "kind",
  "vesselCallId",
  "lighterCallId",
  "lighterVesselId"
] as const;

/** Build `/trips?…` carrying current mother/lighter call selection from vessel-sof, reports discharge, etc. */
export function preserveTripsWorkspaceQuery(
  targetPathname: string,
  current: URLSearchParams | ReadonlyURLSearchParams
): string {
  const sp = new URLSearchParams();
  for (const key of TRIPS_WORKSPACE_SELECTION_KEYS) {
    const v = current.get(key);
    if (v != null && v !== "") sp.set(key, v);
  }
  const q = sp.toString();
  return q ? `${targetPathname}?${q}` : targetPathname;
}

export function isTripsWorkspaceNavPath(pathname: string): boolean {
  return pathname === "/trips";
}

/** `/lighter-sof/new` with optional lighter port call or legacy hull id (echoed for Back + post-create redirect). */
export function lighterSofNewPath(selection?: {
  lighterCallId?: string | null;
  lighterVesselId?: string | null;
}) {
  const sp = new URLSearchParams();
  const lc = selection?.lighterCallId?.trim();
  const lv = selection?.lighterVesselId?.trim();
  if (lc) sp.set("lighterCallId", lc);
  else if (lv) sp.set("lighterVesselId", lv);
  const q = sp.toString();
  return q ? `/lighter-sof/new?${q}` : "/lighter-sof/new";
}
