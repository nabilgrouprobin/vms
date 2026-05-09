import {
  createMasterGhat,
  createMasterLocation,
  createMasterOrganization,
  createMasterOrganizationType,
  createMasterProduct,
  createMasterSofEventType,
  createMasterUser,
  createMasterVessel,
  fetchMasterGhats,
  fetchMasterLocations,
  fetchMasterOrganizations,
  fetchMasterOrganizationTypes,
  fetchMasterProducts,
  fetchMasterSofEventTypes,
  fetchMasterUsers,
  fetchMasterVessels,
  fetchOrganizationTypeOptions,
  patchMasterGhat,
  patchMasterLocation,
  patchMasterOrganization,
  patchMasterOrganizationType,
  patchMasterProduct,
  patchMasterSofEventType,
  patchMasterUser,
  patchMasterVessel
} from "@/lib/master-data-api";
import {
  fetchAllPages,
  parseBool,
  parseCsv,
  parseOptionalInt,
  parseOptionalNumber,
  rowsToRecords,
  stringifyCsv,
  downloadCsvFile
} from "@/lib/master-data-csv";
import { parseApiErr } from "@/lib/parse-api-error";
import {
  LOCATION_TYPES,
  PRODUCT_TYPES,
  SOF_EVENT_TYPE_SCOPES,
  type MasterGhatRow,
  type MasterLocationRow,
  type MasterOrganizationRow,
  type MasterOrganizationTypeRow,
  type MasterProductRow,
  type MasterSofEventTypeRow,
  type MasterUserRow,
  type MasterVesselKind,
  type MasterVesselRow
} from "@/types/vms";

export type CsvImportSummary = { created: number; updated: number; failed: number; errors: string[] };

export function formatCsvImportSummary(title: string, s: CsvImportSummary): string {
  const errLines = s.errors.slice(0, 15).join("\n");
  const more = s.errors.length > 15 ? `\n… and ${s.errors.length - 15} more.` : "";
  return `${title}\nCreated: ${s.created}\nUpdated: ${s.updated}\nFailed: ${s.failed}${errLines ? `\n\n${errLines}` : ""}${more}`;
}

function isoDateSlug(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function vesselUsageCalls(r: MasterVesselRow): string {
  return "motherCalls" in r._count ? String(r._count.motherCalls) : "0";
}

function vesselUsageTrips(r: MasterVesselRow): string {
  return "lighterTrips" in r._count ? String(r._count.lighterTrips) : "0";
}

export async function exportVesselsCsv(kind: MasterVesselKind, params: { search?: string; includeInactive: boolean }) {
  const data = await fetchAllPages({
    fetchPage: (cursor) =>
      fetchMasterVessels(kind, {
        limit: 100,
        cursor,
        search: params.search?.trim() || undefined,
        includeInactive: params.includeInactive
      })
  });
  const headers = [
    "id",
    "name",
    "imo_no",
    "flag",
    "vessel_type",
    "year_built",
    "deadweight_ton",
    "max_draft_m",
    "length_overall_m",
    "beam_m",
    "is_active",
    "usage_calls",
    "usage_trips"
  ];
  const rows = data.map((r) => [
    r.id,
    r.name,
    r.imoNo ?? "",
    r.flag ?? "",
    r.vesselType ?? "",
    r.yearBuilt != null ? String(r.yearBuilt) : "",
    r.deadweightTon ?? "",
    r.maxDraftMeters ?? "",
    r.lengthOverallM ?? "",
    r.beamM ?? "",
    r.isActive ? "true" : "false",
    vesselUsageCalls(r),
    vesselUsageTrips(r)
  ]);
  const csv = stringifyCsv(headers, rows);
  const slug = kind === "mother" ? "mother-vessels" : "lighter-vessels";
  downloadCsvFile(`${slug}-${isoDateSlug()}.csv`, csv);
}

export async function importVesselsCsv(
  kind: MasterVesselKind,
  csvText: string
): Promise<CsvImportSummary> {
  const { headers, rows } = parseCsv(csvText);
  if (!headers.includes("name")) {
    return { created: 0, updated: 0, failed: 1, errors: ["CSV must include a name column."] };
  }
  const records = rowsToRecords(headers, rows);
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const rec of records) {
    const name = rec.name?.trim();
    if (!name) {
      failed += 1;
      errors.push("Skipped row with empty name.");
      continue;
    }
    const id = rec.id?.trim();
    const body = {
      name,
      imoNo: rec.imo_no?.trim() || null,
      flag: rec.flag?.trim() || null,
      vesselType: rec.vessel_type?.trim() || null,
      yearBuilt: parseOptionalInt(rec.year_built) ?? null,
      deadweightTon: parseOptionalNumber(rec.deadweight_ton) ?? null,
      maxDraftMeters: parseOptionalNumber(rec.max_draft_m) ?? null,
      lengthOverallM: parseOptionalNumber(rec.length_overall_m) ?? null,
      beamM: parseOptionalNumber(rec.beam_m) ?? null
    };
    const isAct = parseBool(rec.is_active);
    try {
      if (id) {
        await patchMasterVessel(kind, id, {
          ...body,
          ...(isAct !== undefined ? { isActive: isAct } : {})
        });
        updated += 1;
      } else {
        await createMasterVessel(kind, body);
        created += 1;
      }
    } catch (e) {
      failed += 1;
      errors.push(`${name}: ${parseApiErr(e)}`);
    }
  }
  return { created, updated, failed, errors };
}

export async function exportProductsCsv(params: { search?: string; includeInactive: boolean }) {
  const data = await fetchAllPages({
    fetchPage: (cursor) =>
      fetchMasterProducts({
        limit: 100,
        cursor,
        search: params.search?.trim() || undefined,
        includeInactive: params.includeInactive
      })
  });
  const headers = ["id", "code", "name", "type", "specification", "hs_code", "default_uom", "is_active"];
  const rows = data.map((r: MasterProductRow) => [
    r.id,
    r.code,
    r.name,
    r.type,
    r.specification ?? "",
    r.hsCode ?? "",
    r.defaultUom,
    r.isActive ? "true" : "false"
  ]);
  downloadCsvFile(`products-${isoDateSlug()}.csv`, stringifyCsv(headers, rows));
}

export async function importProductsCsv(csvText: string): Promise<CsvImportSummary> {
  const { headers, rows } = parseCsv(csvText);
  if (!headers.includes("name") || !headers.includes("type")) {
    return {
      created: 0,
      updated: 0,
      failed: 1,
      errors: ["CSV must include name and type columns. Code is optional (exported for reference; new rows get an auto-generated code)."]
    };
  }
  const records = rowsToRecords(headers, rows);
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const rec of records) {
    const name = rec.name?.trim();
    const type = rec.type?.trim();
    const rowLabel = rec.code?.trim() || rec.id?.trim() || name || "(row)";
    if (!name || !type) {
      failed += 1;
      errors.push("Skipped row missing name or type.");
      continue;
    }
    if (!PRODUCT_TYPES.includes(type as (typeof PRODUCT_TYPES)[number])) {
      failed += 1;
      errors.push(`${rowLabel}: invalid product type "${type}".`);
      continue;
    }
    const id = rec.id?.trim();
    const isAct = parseBool(rec.is_active);
    try {
      if (id) {
        await patchMasterProduct(id, {
          name,
          type,
          specification: rec.specification?.trim() || null,
          hsCode: rec.hs_code?.trim() || null,
          defaultUom: rec.default_uom?.trim() || "MT",
          ...(isAct !== undefined ? { isActive: isAct } : {})
        });
        updated += 1;
      } else {
        await createMasterProduct({
          name,
          type,
          specification: rec.specification?.trim() || null,
          hsCode: rec.hs_code?.trim() || null,
          defaultUom: rec.default_uom?.trim() || "MT"
        });
        created += 1;
      }
    } catch (e) {
      failed += 1;
      errors.push(`${rowLabel}: ${parseApiErr(e)}`);
    }
  }
  return { created, updated, failed, errors };
}

export async function exportLocationsCsv(params: { search?: string; includeInactive: boolean }) {
  const data = await fetchAllPages({
    fetchPage: (cursor) =>
      fetchMasterLocations({
        limit: 100,
        cursor,
        search: params.search?.trim() || undefined,
        includeInactive: params.includeInactive
      })
  });
  const headers = [
    "id",
    "code",
    "name",
    "type",
    "address",
    "district",
    "division",
    "country",
    "postal_code",
    "is_active"
  ];
  const rows = data.map((r: MasterLocationRow) => [
    r.id,
    r.code,
    r.name,
    r.type,
    r.address ?? "",
    r.district ?? "",
    r.division ?? "",
    r.country,
    r.postalCode ?? "",
    r.isActive ? "true" : "false"
  ]);
  downloadCsvFile(`locations-${isoDateSlug()}.csv`, stringifyCsv(headers, rows));
}

export async function importLocationsCsv(csvText: string): Promise<CsvImportSummary> {
  const { headers, rows } = parseCsv(csvText);
  if (!headers.includes("name") || !headers.includes("type")) {
    return {
      created: 0,
      updated: 0,
      failed: 1,
      errors: ["CSV must include name and type columns. Code is optional (exported for reference; new rows get an auto-generated code)."]
    };
  }
  const records = rowsToRecords(headers, rows);
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const rec of records) {
    const name = rec.name?.trim();
    const type = rec.type?.trim();
    const rowLabel = rec.code?.trim() || rec.id?.trim() || name || "(row)";
    if (!name || !type) {
      failed += 1;
      errors.push("Skipped row missing name or type.");
      continue;
    }
    if (!LOCATION_TYPES.includes(type as (typeof LOCATION_TYPES)[number])) {
      failed += 1;
      errors.push(`${rowLabel}: invalid location type "${type}".`);
      continue;
    }
    const id = rec.id?.trim();
    const isAct = parseBool(rec.is_active);
    try {
      if (id) {
        await patchMasterLocation(id, {
          name,
          type,
          address: rec.address?.trim() || null,
          district: rec.district?.trim() || null,
          division: rec.division?.trim() || null,
          country: rec.country?.trim() || "Bangladesh",
          postalCode: rec.postal_code?.trim() || null,
          ...(isAct !== undefined ? { isActive: isAct } : {})
        });
        updated += 1;
      } else {
        await createMasterLocation({
          name,
          type,
          address: rec.address?.trim() || null,
          district: rec.district?.trim() || null,
          division: rec.division?.trim() || null,
          country: rec.country?.trim() || "Bangladesh",
          postalCode: rec.postal_code?.trim() || null
        });
        created += 1;
      }
    } catch (e) {
      failed += 1;
      errors.push(`${rowLabel}: ${parseApiErr(e)}`);
    }
  }
  return { created, updated, failed, errors };
}

export async function exportGhatsCsv(params: { search?: string; includeInactive: boolean }) {
  const data = await fetchAllPages({
    fetchPage: (cursor) =>
      fetchMasterGhats({
        limit: 100,
        cursor,
        search: params.search?.trim() || undefined,
        includeInactive: params.includeInactive
      })
  });
  const headers = [
    "id",
    "code",
    "name",
    "location_id",
    "location_code",
    "location_name",
    "number_of_jetties",
    "unloading_capacity_mt_per_day",
    "warehouse_capacity_mt",
    "has_warehouse_storage",
    "has_truck_scale",
    "working_start_hour",
    "working_end_hour",
    "contact_person",
    "contact_no",
    "is_active"
  ];
  const rows = data.map((r: MasterGhatRow) => [
    r.id,
    r.code,
    r.name,
    r.locationId,
    r.location.code,
    r.location.name,
    String(r.numberOfJetties),
    r.unloadingCapacityMtPerDay ?? "",
    r.warehouseCapacityMt ?? "",
    r.hasWarehouseStorage ? "true" : "false",
    r.hasTruckScale ? "true" : "false",
    r.workingStartHour ?? "",
    r.workingEndHour ?? "",
    r.contactPerson ?? "",
    r.contactNo ?? "",
    r.isActive ? "true" : "false"
  ]);
  downloadCsvFile(`ghats-${isoDateSlug()}.csv`, stringifyCsv(headers, rows));
}

export async function importGhatsCsv(csvText: string): Promise<CsvImportSummary> {
  const { headers, rows } = parseCsv(csvText);
  if (!headers.includes("name")) {
    return { created: 0, updated: 0, failed: 1, errors: ["CSV must include a name column."] };
  }
  if (!headers.includes("location_id")) {
    return {
      created: 0,
      updated: 0,
      failed: 1,
      errors: ["CSV must include location_id (export from this screen to get a template)."]
    };
  }
  const records = rowsToRecords(headers, rows);
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const rec of records) {
    const name = rec.name?.trim();
    const locationId = rec.location_id?.trim();
    const rowLabel = rec.code?.trim() || rec.id?.trim() || name || "(row)";
    if (!name || !locationId) {
      failed += 1;
      errors.push("Skipped row missing name or location_id.");
      continue;
    }
    const id = rec.id?.trim();
    const nj = parseOptionalInt(rec.number_of_jetties);
    const isAct = parseBool(rec.is_active);
    const body = {
      name,
      locationId,
      numberOfJetties: nj !== null && nj !== undefined && nj >= 1 ? nj : 1,
      hasWarehouseStorage: parseBool(rec.has_warehouse_storage) ?? false,
      hasTruckScale: parseBool(rec.has_truck_scale) ?? false,
      workingStartHour: rec.working_start_hour?.trim() || null,
      workingEndHour: rec.working_end_hour?.trim() || null,
      contactPerson: rec.contact_person?.trim() || null,
      contactNo: rec.contact_no?.trim() || null,
      unloadingCapacityMtPerDay: parseOptionalNumber(rec.unloading_capacity_mt_per_day) ?? null,
      warehouseCapacityMt: parseOptionalNumber(rec.warehouse_capacity_mt) ?? null
    };
    try {
      if (id) {
        await patchMasterGhat(id, {
          ...body,
          ...(isAct !== undefined ? { isActive: isAct } : {})
        });
        updated += 1;
      } else {
        await createMasterGhat(body);
        created += 1;
      }
    } catch (e) {
      failed += 1;
      errors.push(`${rowLabel}: ${parseApiErr(e)}`);
    }
  }
  return { created, updated, failed, errors };
}

export async function exportSofEventTypesCsv(params: {
  search?: string;
  includeInactive: boolean;
  scope: "MOTHER_VESSEL" | "LIGHTER_VESSEL" | "BOTH" | "ALL";
}) {
  const data = await fetchAllPages({
    fetchPage: (cursor) =>
      fetchMasterSofEventTypes({
        limit: 100,
        cursor,
        search: params.search?.trim() || undefined,
        includeInactive: params.includeInactive,
        scope: params.scope
      })
  });
  const headers = ["id", "code", "name", "scope", "category", "is_active"];
  const rows = data.map((r: MasterSofEventTypeRow) => [
    r.id,
    r.code,
    r.name,
    r.scope,
    r.category ?? "NORMAL",
    r.isActive ? "true" : "false"
  ]);
  downloadCsvFile(`sof-event-types-${isoDateSlug()}.csv`, stringifyCsv(headers, rows));
}

const SOF_EVENT_TYPE_CATEGORY_VALUES = ["NORMAL", "HOLD_DELAY"] as const;
type SofEventTypeCategoryCsv = (typeof SOF_EVENT_TYPE_CATEGORY_VALUES)[number];

function normalizeSofEventTypeCategory(raw: string | undefined): SofEventTypeCategoryCsv | null {
  const v = (raw ?? "").trim().toUpperCase();
  if (v === "" || v === "NORMAL") return "NORMAL";
  if (v === "HOLD_DELAY" || v === "HOLD/DELAY" || v === "HOLD" || v === "DELAY") return "HOLD_DELAY";
  return null;
}

export async function importSofEventTypesCsv(csvText: string): Promise<CsvImportSummary> {
  const { headers, rows } = parseCsv(csvText);
  if (!headers.includes("name") || !headers.includes("scope")) {
    return {
      created: 0,
      updated: 0,
      failed: 1,
      errors: ["CSV must include name and scope columns."]
    };
  }
  const records = rowsToRecords(headers, rows);
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const rec of records) {
    const name = rec.name?.trim();
    const scope = rec.scope?.trim();
    const rowLabel = rec.code?.trim() || rec.id?.trim() || name || "(row)";
    if (!name || !scope) {
      failed += 1;
      errors.push("Skipped row missing name or scope.");
      continue;
    }
    if (!SOF_EVENT_TYPE_SCOPES.includes(scope as (typeof SOF_EVENT_TYPE_SCOPES)[number])) {
      failed += 1;
      errors.push(`${rowLabel}: invalid scope "${scope}".`);
      continue;
    }
    const category = normalizeSofEventTypeCategory(rec.category);
    if (category === null) {
      failed += 1;
      errors.push(`${rowLabel}: invalid category "${rec.category}". Use NORMAL or HOLD_DELAY.`);
      continue;
    }
    const id = rec.id?.trim();
    const isAct = parseBool(rec.is_active);
    try {
      if (id) {
        await patchMasterSofEventType(id, {
          name,
          scope,
          category,
          ...(isAct !== undefined ? { isActive: isAct } : {})
        });
        updated += 1;
      } else {
        await createMasterSofEventType({ name, scope, category });
        created += 1;
      }
    } catch (e) {
      failed += 1;
      errors.push(`${rowLabel}: ${parseApiErr(e)}`);
    }
  }
  return { created, updated, failed, errors };
}

export async function exportOrganizationTypesCsv(params: {
  search?: string;
  includeInactive: boolean;
}) {
  const data = await fetchAllPages({
    fetchPage: (cursor) =>
      fetchMasterOrganizationTypes({
        limit: 100,
        cursor,
        search: params.search?.trim() || undefined,
        includeInactive: params.includeInactive
      })
  });
  const headers = ["id", "code", "name", "is_active"];
  const rows = data.map((r: MasterOrganizationTypeRow) => [
    r.id,
    r.code,
    r.name,
    r.isActive ? "true" : "false"
  ]);
  downloadCsvFile(`organization-types-${isoDateSlug()}.csv`, stringifyCsv(headers, rows));
}

export async function importOrganizationTypesCsv(csvText: string): Promise<CsvImportSummary> {
  const { headers, rows } = parseCsv(csvText);
  if (!headers.includes("name")) {
    return { created: 0, updated: 0, failed: 1, errors: ["CSV must include a name column."] };
  }
  const records = rowsToRecords(headers, rows);
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const rec of records) {
    const name = rec.name?.trim();
    const rowLabel = rec.code?.trim() || rec.id?.trim() || name || "(row)";
    if (!name) {
      failed += 1;
      errors.push("Skipped row with empty name.");
      continue;
    }
    const id = rec.id?.trim();
    const isAct = parseBool(rec.is_active);
    try {
      if (id) {
        await patchMasterOrganizationType(id, {
          name,
          ...(isAct !== undefined ? { isActive: isAct } : {})
        });
        updated += 1;
      } else {
        await createMasterOrganizationType({ name });
        created += 1;
      }
    } catch (e) {
      failed += 1;
      errors.push(`${rowLabel}: ${parseApiErr(e)}`);
    }
  }
  return { created, updated, failed, errors };
}

export async function exportOrganizationsCsv(params: { search?: string; includeInactive: boolean }) {
  const data = await fetchAllPages({
    fetchPage: (cursor) =>
      fetchMasterOrganizations({
        limit: 100,
        cursor,
        search: params.search?.trim() || undefined,
        includeInactive: params.includeInactive
      })
  });
  const headers = [
    "id",
    "code",
    "name",
    "organization_type_id",
    "organization_type_code",
    "address",
    "contact_person",
    "contact_no",
    "email",
    "is_active"
  ];
  const rows = data.map((r: MasterOrganizationRow) => [
    r.id,
    r.code,
    r.name,
    r.organizationType.id,
    r.organizationType.code,
    r.address ?? "",
    r.contactPerson ?? "",
    r.contactNo ?? "",
    r.email ?? "",
    r.isActive ? "true" : "false"
  ]);
  downloadCsvFile(`organizations-${isoDateSlug()}.csv`, stringifyCsv(headers, rows));
}

export async function importOrganizationsCsv(csvText: string): Promise<CsvImportSummary> {
  const { headers, rows } = parseCsv(csvText);
  if (!headers.includes("name")) {
    return { created: 0, updated: 0, failed: 1, errors: ["CSV must include a name column."] };
  }
  if (!headers.includes("organization_type_id") && !headers.includes("organization_type_code")) {
    return {
      created: 0,
      updated: 0,
      failed: 1,
      errors: [
        "CSV must include organization_type_id or organization_type_code (export from this screen for a template)."
      ]
    };
  }
  const typeOptions = await fetchOrganizationTypeOptions();
  const records = rowsToRecords(headers, rows);
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const rec of records) {
    const name = rec.name?.trim();
    const rowLabel = rec.code?.trim() || rec.id?.trim() || name || "(row)";
    if (!name) {
      failed += 1;
      errors.push("Skipped row with empty name.");
      continue;
    }
    const tid = rec.organization_type_id?.trim();
    const tcode = rec.organization_type_code?.trim();
    const organizationTypeId =
      tid || (tcode ? typeOptions.find((o) => o.code === tcode)?.id : undefined) || undefined;
    if (!organizationTypeId) {
      failed += 1;
      errors.push(`${rowLabel}: unknown organization type (check id or code).`);
      continue;
    }
    const id = rec.id?.trim();
    const isAct = parseBool(rec.is_active);
    try {
      if (id) {
        await patchMasterOrganization(id, {
          name,
          organizationTypeId,
          address: rec.address?.trim() || null,
          contactPerson: rec.contact_person?.trim() || null,
          contactNo: rec.contact_no?.trim() || null,
          email: rec.email?.trim() || null,
          ...(isAct !== undefined ? { isActive: isAct } : {})
        });
        updated += 1;
      } else {
        await createMasterOrganization({
          name,
          organizationTypeId,
          address: rec.address?.trim() || null,
          contactPerson: rec.contact_person?.trim() || null,
          contactNo: rec.contact_no?.trim() || null,
          email: rec.email?.trim() || null
        });
        created += 1;
      }
    } catch (e) {
      failed += 1;
      errors.push(`${rowLabel}: ${parseApiErr(e)}`);
    }
  }
  return { created, updated, failed, errors };
}

export async function exportUsersCsv(params: { search?: string; includeInactive: boolean }) {
  const data = await fetchAllPages({
    fetchPage: (cursor) =>
      fetchMasterUsers({
        limit: 100,
        cursor,
        search: params.search?.trim() || undefined,
        includeInactive: params.includeInactive
      })
  });
  const headers = [
    "id",
    "email",
    "phone",
    "full_name",
    "organization_id",
    "is_active",
    "roles_count"
  ];
  const rows = data.map((r: MasterUserRow) => [
    r.id,
    r.email ?? "",
    r.phone,
    r.fullName,
    r.organizationId ?? "",
    r.isActive ? "true" : "false",
    String(r._count.roles)
  ]);
  downloadCsvFile(`users-${isoDateSlug()}.csv`, stringifyCsv(headers, rows));
}

export async function importUsersCsv(csvText: string): Promise<CsvImportSummary> {
  const { headers, rows } = parseCsv(csvText);
  if (!headers.includes("phone") || !headers.includes("full_name")) {
    return {
      created: 0,
      updated: 0,
      failed: 1,
      errors: [
        "CSV must include phone and full_name columns. For new users (no id), password is required (min 8 characters)."
      ]
    };
  }
  const records = rowsToRecords(headers, rows);
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const rec of records) {
    const phone = rec.phone?.trim();
    const fullName = rec.full_name?.trim();
    const rowLabel = rec.id?.trim() || phone || fullName || "(row)";
    if (!phone || !fullName) {
      failed += 1;
      errors.push("Skipped row missing phone or full_name.");
      continue;
    }
    const id = rec.id?.trim();
    const password = rec.password?.trim() ?? "";
    const emailRaw = rec.email?.trim();
    const email = emailRaw ? emailRaw : null;
    const orgRaw = rec.organization_id?.trim();
    const organizationId = orgRaw ? orgRaw : null;
    const isAct = parseBool(rec.is_active);

    if (!id && password.length < 8) {
      failed += 1;
      errors.push(`${rowLabel}: new users require password (min 8 characters).`);
      continue;
    }
    if (id && password.length > 0 && password.length < 8) {
      failed += 1;
      errors.push(`${rowLabel}: password must be at least 8 characters when set.`);
      continue;
    }

    try {
      if (id) {
        const body: Parameters<typeof patchMasterUser>[1] = {
          phone,
          fullName,
          email,
          organizationId,
          ...(isAct !== undefined ? { isActive: isAct } : {})
        };
        if (password.length >= 8) body.password = password;
        await patchMasterUser(id, body);
        updated += 1;
      } else {
        await createMasterUser({
          phone,
          fullName,
          password,
          email,
          organizationId
        });
        created += 1;
      }
    } catch (e) {
      failed += 1;
      errors.push(`${rowLabel}: ${parseApiErr(e)}`);
    }
  }
  return { created, updated, failed, errors };
}
