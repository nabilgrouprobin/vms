import type { StoredUserProfile } from "@/lib/auth-storage";

/** Mirrors backend `LIGHTER_TRIP_EDITOR_ROLES` (SOF editors + lighter assignment officer). */
const LIGHTER_TRIP_EDITOR_ROLES = new Set<string>([
  "SUPER_ADMIN",
  "SYSTEM_ADMIN",
  "OPERATIONS_MANAGER",
  "MOTHER_VESSEL_ADMIN",
  "LIGHTER_ASSIGNMENT_OFFICER"
]);

export function canEditLighterTrips(profile: StoredUserProfile | null): boolean {
  if (!profile?.roles?.length) return false;
  return profile.roles.some((r) => LIGHTER_TRIP_EDITOR_ROLES.has(r));
}
