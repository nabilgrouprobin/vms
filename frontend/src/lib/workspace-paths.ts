import type { VesselSofWorkspaceSection } from "@/components/sof/detail/types";

export function vesselSofWorkspacePath(
  section: VesselSofWorkspaceSection,
  kind: "mother" | "lighter",
  id: string | null
) {
  const sp = new URLSearchParams();
  sp.set("kind", kind);
  if (id) sp.set("id", id);
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

/** Deep-link into Reports → Discharge & aging with optional SOF selected. */
export function reportsDischargePath(kind: "mother" | "lighter", sofId: string | null) {
  const sp = new URLSearchParams();
  sp.set("kind", kind);
  sp.set("view", "discharge");
  if (sofId) {
    sp.set("id", sofId);
  }
  return `/reports?${sp.toString()}`;
}

export function tripsWorkspacePath(
  kind: "mother" | "lighter",
  selection?: { vesselCallId?: string | null; lighterVesselId?: string | null }
) {
  const sp = new URLSearchParams();
  sp.set("kind", kind);
  const vc = selection?.vesselCallId?.trim();
  const lv = selection?.lighterVesselId?.trim();
  if (kind === "mother" && vc) sp.set("vesselCallId", vc);
  if (kind === "lighter" && lv) sp.set("lighterVesselId", lv);
  return `/trips?${sp.toString()}`;
}
