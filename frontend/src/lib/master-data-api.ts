import { api } from "@/lib/api";
import type {
  MasterGhatRow,
  MasterLocationOption,
  MasterLocationRow,
  MasterOrganizationOption,
  MasterOrganizationRow,
  MasterOrganizationTypeRow,
  MasterProductRow,
  MasterSofEventTypeRow,
  MasterUserRow,
  MasterVesselKind,
  MasterVesselRow,
  Paginated,
  SofEventTypeOption,
  UserRoleAssignmentRow
} from "@/types/vms";

// ---------------------------------------------------------------------------
// masterCrud factory
// ---------------------------------------------------------------------------

type ListParams = {
  limit?: number;
  cursor?: string;
  search?: string;
  includeInactive?: boolean;
};

function refParams(params: ListParams): string {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.includeInactive) sp.set("includeInactive", "true");
  return sp.toString();
}

/**
 * Build a typed CRUD client around a `/master-data/...` resource path.
 *
 * Each master-data endpoint exposes the same six operations (list, fetchOne,
 * create, patch, softDelete, purge) — the factory captures the shape once and
 * each per-resource named export below collapses to a one-liner.
 */
function masterCrud<Row, CreateBody, PatchBody>(basePath: string) {
  const idPath = (id: string) => `${basePath}/${encodeURIComponent(id)}`;
  return {
    list: (params: ListParams) => {
      const q = refParams(params);
      return api<Paginated<Row>>(`${basePath}${q ? `?${q}` : ""}`);
    },
    fetchOne: (id: string) => api<Row>(idPath(id)),
    create: (body: CreateBody) =>
      api<Row>(basePath, { method: "POST", body: JSON.stringify(body) }),
    patch: (id: string, body: PatchBody) =>
      api<Row>(idPath(id), { method: "PATCH", body: JSON.stringify(body) }),
    softDelete: (id: string) =>
      api<{ id: string; isActive: boolean }>(idPath(id), { method: "DELETE" }),
    purge: (id: string) =>
      api<{ ok: true }>(`${idPath(id)}/purge`, { method: "POST" })
  };
}

// ---------------------------------------------------------------------------
// Per-resource clients (typed wrappers around the shared factory)
// ---------------------------------------------------------------------------

function vesselsBasePath(kind: MasterVesselKind): string {
  return kind === "mother" ? "/master-data/mother-vessels" : "/master-data/lighter-vessels";
}

export type MasterVesselWriteBody = {
  name: string;
  imoNo?: string | null;
  flag?: string | null;
  vesselType?: string | null;
  yearBuilt?: number | null;
  deadweightTon?: number | null;
  maxDraftMeters?: number | null;
  lengthOverallM?: number | null;
  beamM?: number | null;
};

const vesselsApi = (kind: MasterVesselKind) =>
  masterCrud<
    MasterVesselRow,
    MasterVesselWriteBody,
    Partial<MasterVesselWriteBody> & { isActive?: boolean }
  >(vesselsBasePath(kind));

export const fetchMasterVessels = (kind: MasterVesselKind, params: ListParams) =>
  vesselsApi(kind).list(params);
export const fetchMasterVessel = (kind: MasterVesselKind, id: string) =>
  vesselsApi(kind).fetchOne(id);
export const createMasterVessel = (kind: MasterVesselKind, body: MasterVesselWriteBody) =>
  vesselsApi(kind).create(body);
export const patchMasterVessel = (
  kind: MasterVesselKind,
  id: string,
  body: Partial<MasterVesselWriteBody> & { isActive?: boolean }
) => vesselsApi(kind).patch(id, body);
export const softDeleteMasterVessel = (kind: MasterVesselKind, id: string) =>
  vesselsApi(kind).softDelete(id);
export const purgeMasterVessel = (kind: MasterVesselKind, id: string) =>
  vesselsApi(kind).purge(id);

// ---- Products -------------------------------------------------------------

export type MasterProductCreateBody = {
  name: string;
  type: string;
  specification?: string | null;
  hsCode?: string | null;
  defaultUom?: string;
};
export type MasterProductPatchBody = {
  name?: string;
  type?: string;
  specification?: string | null;
  hsCode?: string | null;
  defaultUom?: string | null;
  isActive?: boolean;
};

const productsApi = masterCrud<MasterProductRow, MasterProductCreateBody, MasterProductPatchBody>(
  "/master-data/products"
);
export const fetchMasterProducts = productsApi.list;
export const fetchMasterProduct = productsApi.fetchOne;
export const createMasterProduct = productsApi.create;
export const patchMasterProduct = productsApi.patch;
export const softDeleteMasterProduct = productsApi.softDelete;
export const purgeMasterProduct = productsApi.purge;

// ---- Locations ------------------------------------------------------------

export type MasterLocationCreateBody = {
  name: string;
  type: string;
  address?: string | null;
  district?: string | null;
  division?: string | null;
  country?: string;
  postalCode?: string | null;
};
export type MasterLocationPatchBody = {
  name?: string;
  type?: string;
  address?: string | null;
  district?: string | null;
  division?: string | null;
  country?: string | null;
  postalCode?: string | null;
  isActive?: boolean;
};

const locationsApi = masterCrud<
  MasterLocationRow,
  MasterLocationCreateBody,
  MasterLocationPatchBody
>("/master-data/locations");
export const fetchMasterLocations = locationsApi.list;
export const fetchMasterLocation = locationsApi.fetchOne;
export const createMasterLocation = locationsApi.create;
export const patchMasterLocation = locationsApi.patch;
export const softDeleteMasterLocation = locationsApi.softDelete;
export const purgeMasterLocation = locationsApi.purge;

export function fetchLocationOptions() {
  return api<MasterLocationOption[]>("/master-data/locations/options");
}

// ---- Organizations --------------------------------------------------------

export type MasterOrganizationCreateBody = {
  name: string;
  organizationTypeId: string;
  address?: string | null;
  contactPerson?: string | null;
  contactNo?: string | null;
  email?: string | null;
};
export type MasterOrganizationPatchBody = {
  name?: string;
  organizationTypeId?: string;
  address?: string | null;
  contactPerson?: string | null;
  contactNo?: string | null;
  email?: string | null;
  isActive?: boolean;
};

const organizationsApi = masterCrud<
  MasterOrganizationRow,
  MasterOrganizationCreateBody,
  MasterOrganizationPatchBody
>("/master-data/organizations");
export const fetchMasterOrganizations = organizationsApi.list;
export const fetchMasterOrganization = organizationsApi.fetchOne;
export const createMasterOrganization = organizationsApi.create;
export const patchMasterOrganization = organizationsApi.patch;
// softDelete returns the row (not isActive only) for organizations — preserve legacy shape.
export function softDeleteMasterOrganization(id: string) {
  return api<MasterOrganizationRow>(
    `/master-data/organizations/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
export const purgeMasterOrganization = organizationsApi.purge;

export function fetchOrganizationOptions() {
  return api<MasterOrganizationOption[]>("/master-data/organizations/options");
}

// ---- Organization types ---------------------------------------------------

const organizationTypesApi = masterCrud<
  MasterOrganizationTypeRow,
  { name: string },
  { name?: string; isActive?: boolean }
>("/master-data/organization-types");
export const fetchMasterOrganizationTypes = organizationTypesApi.list;
export const createMasterOrganizationType = organizationTypesApi.create;
export const patchMasterOrganizationType = organizationTypesApi.patch;
export function softDeleteMasterOrganizationType(id: string) {
  return api<MasterOrganizationTypeRow>(
    `/master-data/organization-types/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
export const purgeMasterOrganizationType = organizationTypesApi.purge;

export function fetchOrganizationTypeOptions() {
  return api<{ id: string; code: string; name: string }[]>(
    "/master-data/organization-types/options"
  );
}

// ---- Ghats ----------------------------------------------------------------

export type MasterGhatCreateBody = {
  name: string;
  locationId: string;
  numberOfJetties?: number;
  hasWarehouseStorage?: boolean;
  hasTruckScale?: boolean;
  workingStartHour?: string | null;
  workingEndHour?: string | null;
  contactPerson?: string | null;
  contactNo?: string | null;
  unloadingCapacityMtPerDay?: number | null;
  warehouseCapacityMt?: number | null;
};
export type MasterGhatPatchBody = {
  name?: string;
  locationId?: string;
  numberOfJetties?: number;
  hasWarehouseStorage?: boolean;
  hasTruckScale?: boolean;
  workingStartHour?: string | null;
  workingEndHour?: string | null;
  contactPerson?: string | null;
  contactNo?: string | null;
  isActive?: boolean;
  unloadingCapacityMtPerDay?: number | null;
  warehouseCapacityMt?: number | null;
};

const ghatsApi = masterCrud<MasterGhatRow, MasterGhatCreateBody, MasterGhatPatchBody>(
  "/master-data/ghats"
);
export const fetchMasterGhats = ghatsApi.list;
export const fetchMasterGhat = ghatsApi.fetchOne;
export const createMasterGhat = ghatsApi.create;
export const patchMasterGhat = ghatsApi.patch;
export const softDeleteMasterGhat = ghatsApi.softDelete;
export const purgeMasterGhat = ghatsApi.purge;

// ---- SOF event types ------------------------------------------------------

const sofEventTypesApi = masterCrud<
  MasterSofEventTypeRow,
  { name: string; scope: string; category?: "NORMAL" | "HOLD_DELAY" },
  { name?: string; scope?: string; category?: "NORMAL" | "HOLD_DELAY"; isActive?: boolean }
>("/master-data/sof-event-types");

export const createMasterSofEventType = sofEventTypesApi.create;
export const patchMasterSofEventType = sofEventTypesApi.patch;
export function softDeleteMasterSofEventType(id: string) {
  return api<MasterSofEventTypeRow>(
    `/master-data/sof-event-types/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}
export const purgeMasterSofEventType = sofEventTypesApi.purge;

export function fetchSofEventTypeOptions(scope: "MOTHER_VESSEL" | "LIGHTER_VESSEL") {
  const sp = new URLSearchParams({ forSofScope: scope });
  return api<SofEventTypeOption[]>(`/master-data/sof-event-types/options?${sp}`);
}

export function fetchMasterSofEventTypes(params: ListParams & {
  scope?: "MOTHER_VESSEL" | "LIGHTER_VESSEL" | "BOTH" | "ALL";
}) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.includeInactive) sp.set("includeInactive", "true");
  if (params.scope && params.scope !== "ALL") sp.set("scope", params.scope);
  const q = sp.toString();
  return api<Paginated<MasterSofEventTypeRow>>(
    `/master-data/sof-event-types${q ? `?${q}` : ""}`
  );
}

// ---- Users ----------------------------------------------------------------

export type MasterUserCreateBody = {
  email?: string | null;
  password: string;
  phone: string;
  fullName: string;
  organizationId?: string | null;
};
export type MasterUserPatchBody = {
  email?: string | null;
  phone?: string;
  fullName?: string;
  isActive?: boolean;
  password?: string;
  organizationId?: string | null;
};

const usersApi = masterCrud<MasterUserRow, MasterUserCreateBody, MasterUserPatchBody>(
  "/master-data/users"
);
export const fetchMasterUsers = usersApi.list;
export const fetchMasterUser = usersApi.fetchOne;
export const createMasterUser = usersApi.create;
export const patchMasterUser = usersApi.patch;
export function softDeleteMasterUser(id: string) {
  return api<MasterUserRow>(`/master-data/users/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
export const purgeMasterUser = usersApi.purge;

// ---- App roles + per-user role assignments --------------------------------

export function fetchAppRoles() {
  return api<string[]>("/master-data/app-roles");
}

export function fetchUserRoleAssignments(userId: string) {
  return api<UserRoleAssignmentRow[]>(
    `/master-data/users/${encodeURIComponent(userId)}/roles`
  );
}

export function addUserRoleAssignment(
  userId: string,
  body: { role: string; locationId?: string | null }
) {
  return api<UserRoleAssignmentRow>(
    `/master-data/users/${encodeURIComponent(userId)}/roles`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export function addUserRoleAssignmentsBatch(
  userId: string,
  body: { roles: string[]; locationId?: string | null }
) {
  const payload: { roles: string[]; locationId?: string } = { roles: body.roles };
  const loc = body.locationId?.trim();
  if (loc) payload.locationId = loc;
  return api<UserRoleAssignmentRow[]>(
    `/master-data/users/${encodeURIComponent(userId)}/roles/batch`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function removeUserRoleAssignment(userId: string, assignmentId: string) {
  return api<{ ok: true }>(
    `/master-data/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(
      assignmentId
    )}`,
    { method: "DELETE" }
  );
}
