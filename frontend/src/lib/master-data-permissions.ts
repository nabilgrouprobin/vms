import type { StoredUserProfile } from "@/lib/auth-storage";

/** Mirrors backend `MASTER_DATA_EDITOR_ROLES` (`SOF_EDITOR_ROLES` + port/commercial/lighter roles). */
const MASTER_DATA_EDITOR_ROLES = new Set<string>([
  "SUPER_ADMIN",
  "SYSTEM_ADMIN",
  "OPERATIONS_MANAGER",
  "MOTHER_VESSEL_ADMIN",
  "LIGHTER_ASSIGNMENT_OFFICER",
  "CARRIER_COORDINATOR",
  "COMMERCIAL_ADMIN",
  "PORT_ADMIN",
  "HEAD_OFFICE_LC"
]);

export function canEditMasterData(profile: StoredUserProfile | null): boolean {
  if (!profile?.roles?.length) return false;
  return profile.roles.some((r) => MASTER_DATA_EDITOR_ROLES.has(r));
}
