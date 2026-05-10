/**
 * Centralised React Query key factories.
 *
 * Each `queryKey: [...]` array used by `useQuery` / `useMutation` /
 * `qc.invalidateQueries` should come from here so renaming a key needs
 * touching exactly one file.
 *
 * Convention: every factory returns a `readonly` tuple so React Query's
 * structural matching ("invalidate everything starting with [...]") keeps
 * working — `qc.invalidateQueries({ queryKey: masterDataKeys.products() })`
 * also invalidates `masterDataKeys.products(search, includeInactive)`.
 */

export const masterDataKeys = {
  products: (...rest: ReadonlyArray<unknown>) => ["master-products", ...rest] as const,
  locations: (...rest: ReadonlyArray<unknown>) => ["master-locations", ...rest] as const,
  ghats: (...rest: ReadonlyArray<unknown>) => ["master-ghats", ...rest] as const,
  organizations: (...rest: ReadonlyArray<unknown>) =>
    ["master-organizations", ...rest] as const,
  organizationTypes: (...rest: ReadonlyArray<unknown>) =>
    ["master-organization-types", ...rest] as const,
  sofEventTypes: (...rest: ReadonlyArray<unknown>) =>
    ["master-sof-event-types", ...rest] as const,
  users: (...rest: ReadonlyArray<unknown>) => ["master-users", ...rest] as const,
  vessels: (kind: "mother" | "lighter", ...rest: ReadonlyArray<unknown>) =>
    ["master-vessels", kind, ...rest] as const,
  appRoles: () => ["master-app-roles"] as const,
  userRoles: (userId: string | undefined) => ["master-user-roles", userId ?? null] as const
} as const;
