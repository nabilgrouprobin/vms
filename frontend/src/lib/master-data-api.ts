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

function listPath(kind: MasterVesselKind): string {
  return kind === "mother" ? "/master-data/mother-vessels" : "/master-data/lighter-vessels";
}

export function fetchMasterVessels(
  kind: MasterVesselKind,
  params: {
    limit?: number;
    cursor?: string;
    search?: string;
    includeInactive?: boolean;
  }
) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.includeInactive) sp.set("includeInactive", "true");
  const q = sp.toString();
  return api<Paginated<MasterVesselRow>>(`${listPath(kind)}${q ? `?${q}` : ""}`);
}

export function fetchMasterVessel(kind: MasterVesselKind, id: string) {
  return api<MasterVesselRow>(`${listPath(kind)}/${encodeURIComponent(id)}`);
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

export function createMasterVessel(kind: MasterVesselKind, body: MasterVesselWriteBody) {
  return api<MasterVesselRow>(listPath(kind), {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function patchMasterVessel(
  kind: MasterVesselKind,
  id: string,
  body: Partial<MasterVesselWriteBody> & { isActive?: boolean }
) {
  return api<MasterVesselRow>(`${listPath(kind)}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function softDeleteMasterVessel(kind: MasterVesselKind, id: string) {
  return api<{ id: string; isActive: boolean }>(
    `${listPath(kind)}/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

const refParams = (params: {
  limit?: number;
  cursor?: string;
  search?: string;
  includeInactive?: boolean;
}) => {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.includeInactive) sp.set("includeInactive", "true");
  return sp.toString();
};

export function fetchMasterProducts(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  includeInactive?: boolean;
}) {
  const q = refParams(params);
  return api<Paginated<MasterProductRow>>(`/master-data/products${q ? `?${q}` : ""}`);
}

export function fetchMasterProduct(id: string) {
  return api<MasterProductRow>(`/master-data/products/${encodeURIComponent(id)}`);
}

export function createMasterProduct(body: {
  name: string;
  type: string;
  specification?: string | null;
  hsCode?: string | null;
  defaultUom?: string;
}) {
  return api<MasterProductRow>("/master-data/products", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function patchMasterProduct(
  id: string,
  body: {
    name?: string;
    type?: string;
    specification?: string | null;
    hsCode?: string | null;
    defaultUom?: string | null;
    isActive?: boolean;
  }
) {
  return api<MasterProductRow>(`/master-data/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function softDeleteMasterProduct(id: string) {
  return api<{ id: string; isActive: boolean }>(`/master-data/products/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function fetchMasterLocations(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  includeInactive?: boolean;
}) {
  const q = refParams(params);
  return api<Paginated<MasterLocationRow>>(`/master-data/locations${q ? `?${q}` : ""}`);
}

export function fetchLocationOptions() {
  return api<MasterLocationOption[]>("/master-data/locations/options");
}

export function fetchMasterLocation(id: string) {
  return api<MasterLocationRow>(`/master-data/locations/${encodeURIComponent(id)}`);
}

export function createMasterLocation(body: {
  name: string;
  type: string;
  address?: string | null;
  district?: string | null;
  division?: string | null;
  country?: string;
  postalCode?: string | null;
}) {
  return api<MasterLocationRow>("/master-data/locations", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function patchMasterLocation(
  id: string,
  body: {
    name?: string;
    type?: string;
    address?: string | null;
    district?: string | null;
    division?: string | null;
    country?: string | null;
    postalCode?: string | null;
    isActive?: boolean;
  }
) {
  return api<MasterLocationRow>(`/master-data/locations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function softDeleteMasterLocation(id: string) {
  return api<{ id: string; isActive: boolean }>(
    `/master-data/locations/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}

export function fetchOrganizationOptions() {
  return api<MasterOrganizationOption[]>("/master-data/organizations/options");
}

export function fetchMasterOrganizations(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  includeInactive?: boolean;
}) {
  const q = refParams(params);
  return api<Paginated<MasterOrganizationRow>>(`/master-data/organizations${q ? `?${q}` : ""}`);
}

export function fetchMasterOrganization(id: string) {
  return api<MasterOrganizationRow>(`/master-data/organizations/${encodeURIComponent(id)}`);
}

export function createMasterOrganization(body: {
  name: string;
  organizationTypeId: string;
  address?: string | null;
  contactPerson?: string | null;
  contactNo?: string | null;
  email?: string | null;
}) {
  return api<MasterOrganizationRow>("/master-data/organizations", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function patchMasterOrganization(
  id: string,
  body: {
    name?: string;
    organizationTypeId?: string;
    address?: string | null;
    contactPerson?: string | null;
    contactNo?: string | null;
    email?: string | null;
    isActive?: boolean;
  }
) {
  return api<MasterOrganizationRow>(`/master-data/organizations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function softDeleteMasterOrganization(id: string) {
  return api<MasterOrganizationRow>(`/master-data/organizations/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function fetchOrganizationTypeOptions() {
  return api<{ id: string; code: string; name: string }[]>("/master-data/organization-types/options");
}

export function fetchMasterOrganizationTypes(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  includeInactive?: boolean;
}) {
  const q = refParams(params);
  return api<Paginated<MasterOrganizationTypeRow>>(
    `/master-data/organization-types${q ? `?${q}` : ""}`
  );
}

export function createMasterOrganizationType(body: { name: string }) {
  return api<MasterOrganizationTypeRow>("/master-data/organization-types", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function patchMasterOrganizationType(
  id: string,
  body: { name?: string; isActive?: boolean }
) {
  return api<MasterOrganizationTypeRow>(`/master-data/organization-types/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function softDeleteMasterOrganizationType(id: string) {
  return api<MasterOrganizationTypeRow>(`/master-data/organization-types/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function fetchMasterGhats(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  includeInactive?: boolean;
}) {
  const q = refParams(params);
  return api<Paginated<MasterGhatRow>>(`/master-data/ghats${q ? `?${q}` : ""}`);
}

export function fetchMasterGhat(id: string) {
  return api<MasterGhatRow>(`/master-data/ghats/${encodeURIComponent(id)}`);
}

export function createMasterGhat(body: {
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
}) {
  return api<MasterGhatRow>("/master-data/ghats", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function patchMasterGhat(
  id: string,
  body: {
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
  }
) {
  return api<MasterGhatRow>(`/master-data/ghats/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function softDeleteMasterGhat(id: string) {
  return api<{ id: string; isActive: boolean }>(`/master-data/ghats/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function fetchSofEventTypeOptions(scope: "MOTHER_VESSEL" | "LIGHTER_VESSEL") {
  const sp = new URLSearchParams({ forSofScope: scope });
  return api<SofEventTypeOption[]>(`/master-data/sof-event-types/options?${sp}`);
}

export function fetchMasterSofEventTypes(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  includeInactive?: boolean;
  scope?: "MOTHER_VESSEL" | "LIGHTER_VESSEL" | "BOTH" | "ALL";
}) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search?.trim()) sp.set("search", params.search.trim());
  if (params.includeInactive) sp.set("includeInactive", "true");
  if (params.scope && params.scope !== "ALL") sp.set("scope", params.scope);
  const q = sp.toString();
  return api<Paginated<MasterSofEventTypeRow>>(`/master-data/sof-event-types${q ? `?${q}` : ""}`);
}

export function createMasterSofEventType(body: { name: string; scope: string }) {
  return api<MasterSofEventTypeRow>("/master-data/sof-event-types", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function patchMasterSofEventType(
  id: string,
  body: { name?: string; scope?: string; isActive?: boolean }
) {
  return api<MasterSofEventTypeRow>(`/master-data/sof-event-types/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function softDeleteMasterSofEventType(id: string) {
  return api<MasterSofEventTypeRow>(`/master-data/sof-event-types/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

export function fetchMasterUsers(params: {
  limit?: number;
  cursor?: string;
  search?: string;
  includeInactive?: boolean;
}) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.search) sp.set("search", params.search);
  if (params.includeInactive) sp.set("includeInactive", "true");
  const q = sp.toString();
  return api<Paginated<MasterUserRow>>(`/master-data/users${q ? `?${q}` : ""}`);
}

export function fetchMasterUser(id: string) {
  return api<MasterUserRow>(`/master-data/users/${encodeURIComponent(id)}`);
}

export function createMasterUser(body: {
  email?: string | null;
  password: string;
  phone: string;
  fullName: string;
  organizationId?: string | null;
}) {
  return api<MasterUserRow>("/master-data/users", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function patchMasterUser(
  id: string,
  body: {
    email?: string | null;
    phone?: string;
    fullName?: string;
    isActive?: boolean;
    password?: string;
    organizationId?: string | null;
  }
) {
  return api<MasterUserRow>(`/master-data/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}

export function softDeleteMasterUser(id: string) {
  return api<MasterUserRow>(`/master-data/users/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

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
  return api<UserRoleAssignmentRow>(`/master-data/users/${encodeURIComponent(userId)}/roles`, {
    method: "POST",
    body: JSON.stringify(body)
  });
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
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export function removeUserRoleAssignment(userId: string, assignmentId: string) {
  return api<{ ok: true }>(
    `/master-data/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(assignmentId)}`,
    { method: "DELETE" }
  );
}
