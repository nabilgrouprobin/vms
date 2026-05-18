import type { LighterSofListRow, MotherSofListRow } from "@/types/vms";

/** SOF id for this mother vessel call only — never guess from another row in the list. */
export function resolveMotherSofIdForVesselCall(
  vesselCallId: string,
  rows: MotherSofListRow[]
): string | null {
  const match = rows.find((r) => r.vesselCall?.id === vesselCallId);
  return match?.id ?? null;
}

/** SOFs for a lighter port call (trip’s mother call or lighter port call id). */
export function filterLighterSofsForPortCall(
  lighterPortCallId: string,
  rows: LighterSofListRow[]
): LighterSofListRow[] {
  return rows.filter(
    (r) =>
      r.lighterTrip?.lighterPortCallId === lighterPortCallId ||
      r.lighterTrip?.vesselCall?.id === lighterPortCallId
  );
}

export function resolveLighterSofIdForPortCall(
  lighterPortCallId: string,
  rows: LighterSofListRow[]
): string | null {
  const matches = filterLighterSofsForPortCall(lighterPortCallId, rows);
  if (matches.length === 1) return matches[0]!.id;
  return null;
}
