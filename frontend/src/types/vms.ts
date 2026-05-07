/** Mirrors backend enums for UI selects (keep aligned with Prisma). */

export const SOF_STATUS = [
  "DRAFT",
  "PENDING_VERIFICATION",
  "VERIFIED",
  "APPROVED",
  "DISPUTED",
  "CLOSED"
] as const;
export type SofStatus = (typeof SOF_STATUS)[number];

/** Scopes for configurable SOF event types (master data). */
export const SOF_EVENT_TYPE_SCOPES = ["MOTHER_VESSEL", "LIGHTER_VESSEL", "BOTH"] as const;
export type SofEventTypeScopeUi = (typeof SOF_EVENT_TYPE_SCOPES)[number];

export type SofEventTypeOption = {
  id: string;
  code: string;
  name: string;
  scope: string;
};

export type MasterSofEventTypeRow = {
  id: string;
  code: string;
  name: string;
  scope: string;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { sofEvents: number };
};

export type LighterTripListRow = {
  id: string;
  tripNo: string;
  status: string;
  assignedAt: string;
  lighterVessel: { id: string; name: string; imoNo: string | null };
  vesselCall: {
    id: string;
    callNo: string;
    status: string;
    vessel: { id: string; name: string };
  };
  statementOfFacts: { id: string; sofNo: string; status: string } | null;
};

/** Aligned with Prisma `LighterTripStatus` */
export const LIGHTER_TRIP_STATUSES = [
  "PLANNED",
  "ASSIGNED",
  "NOT_READY",
  "READY_TO_SAIL",
  "OUTBOUND_AT_SEA",
  "AT_CHECKPOINT",
  "ALONGSIDE",
  "PREPARING_TO_LOAD",
  "LOADING",
  "LOADED",
  "DRAFT_SURVEY_STAGING",
  "DRAFT_SURVEY_IN_PROGRESS",
  "DRAFT_SURVEY_COMPLETED",
  "RETURNING_AT_SEA",
  "ARRIVED_GHAT",
  "WAITING_UNLOAD",
  "UNLOADING",
  "ON_HOLD",
  "PARTIAL_UNLOADED",
  "UNLOADED",
  "CLOSED",
  "CANCELLED"
] as const;
export type LighterTripStatus = (typeof LIGHTER_TRIP_STATUSES)[number];

/** Aligned with Prisma `MotherVesselStatus` (mother vessel **call** workflow). */
export const MOTHER_VESSEL_STATUSES = [
  "EXPECTED",
  "ARRIVED",
  "ANCHORED",
  "LC_HOLD",
  "READY_TO_DISCHARGE",
  "DISCHARGING",
  "PARTIAL_DISCHARGED",
  "COMPLETED",
  "CLOSED",
  "CANCELLED"
] as const;
export type MotherVesselCallStatus = (typeof MOTHER_VESSEL_STATUSES)[number];

/** Aligned with Prisma `AppRole`. */
export const APP_ROLES = [
  "SUPER_ADMIN",
  "SYSTEM_ADMIN",
  "HEAD_OFFICE_LC",
  "COMMERCIAL_ADMIN",
  "FINANCE_APPROVER",
  "DOCUMENT_CONTROLLER",
  "APPROVAL_ADMIN",
  "INTEGRATION_ADMIN",
  "OPERATIONS_MANAGER",
  "MOTHER_VESSEL_ADMIN",
  "SHIPPING_AGENT_USER",
  "CNF_AGENT",
  "STEVEDORE_COORDINATOR",
  "LIGHTER_ASSIGNMENT_OFFICER",
  "CARRIER_COORDINATOR",
  "PORT_ADMIN",
  "GHAT_OPERATOR",
  "QUALITY_CONTROLLER",
  "WEIGHMENT_OFFICER",
  "TRUCK_DISPATCH_OFFICER",
  "SECURITY_GATE",
  "WAREHOUSE_OPERATOR",
  "WAREHOUSE_RECEIVER",
  "INVENTORY_CONTROLLER",
  "COST_ACCOUNTANT",
  "SALES_COORDINATOR",
  "MANAGEMENT_VIEWER",
  "AUDITOR",
  "REPORT_VIEWER",
  "SURVEYOR"
] as const;
export type AppRoleValue = (typeof APP_ROLES)[number];

export type MasterUserRow = {
  id: string;
  email: string | null;
  phone: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  organizationId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { roles: number };
};

export type UserRoleAssignmentRow = {
  id: string;
  role: string;
  locationId: string | null;
  grantedBy: string | null;
  grantedAt: string;
  expiresAt: string | null;
  location: { id: string; code: string; name: string; type: string } | null;
};

export type LighterTripDetail = LighterTripListRow & {
  remarks: string | null;
  holdReason?: string | null;
  lighterAssignment?: {
    id: string;
    assignmentNo: string;
    status: string;
    estimatedQtyMt: string;
    destinationGhat: { id: string; name: string } | null;
  } | null;
};

export type VesselCallListRow = {
  id: string;
  callNo: string;
  status: string;
  eta: string | null;
  ata: string | null;
  currentAnchorage: string | null;
  totalDischargeMt: string | null;
  cargoNameSnapshot: string | null;
  vessel: {
    id: string;
    name: string;
    imoNo: string | null;
    flag: string | null;
    isMotherVessel: boolean;
    isLighter: boolean;
  };
  arrivalLocation: { id: string; name: string; type: string } | null;
  statementOfFacts: { id: string; sofNo: string; status: string; scope: string } | null;
  _count: { lighterTrips: number; lighterAssignments: number };
};

/** Subset of `GET /vessel-calls/:id` used for Trips header (response may include more fields). */
export type VesselCallTripsMeta = {
  id: string;
  callNo: string;
  status: string;
  cargoNameSnapshot: string | null;
  vessel: { id: string; name: string; imoNo: string | null };
};

export type LighterVesselPickerRow = {
  id: string;
  name: string;
  imoNo: string | null;
  flag: string | null;
  activeTrip: {
    id: string;
    tripNo: string;
    status: string;
    vesselCall: { id: string; callNo: string; vessel: { name: string } };
  } | null;
};

export type OpenLighterAssignmentRow = {
  id: string;
  assignmentNo: string;
  estimatedQtyMt: string;
  status: string;
  lighter: { id: string; name: string };
  carrier: { id: string; organization: { name: string } };
  destinationGhat: { id: string; name: string };
};

export type Paginated<T> = {
  data: T[];
  nextCursor: string | null;
  limit: number;
};

export type MasterVesselKind = "mother" | "lighter";

/** Registry row from `GET /master-data/mother-vessels` or `/master-data/lighter-vessels`. */
export type MasterVesselRow = {
  id: string;
  name: string;
  imoNo: string | null;
  flag: string | null;
  vesselType: string | null;
  yearBuilt: number | null;
  deadweightTon: string | null;
  maxDraftMeters: string | null;
  lengthOverallM: string | null;
  beamM: string | null;
  isActive: boolean;
  isMotherVessel: boolean;
  isLighter: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { motherCalls: number } | { lighterTrips: number };
};

export const PRODUCT_TYPES = [
  "BULK_FOOD_GRAIN",
  "FERTILIZER",
  "CEMENT_CLINKER",
  "EDIBLE_OIL",
  "INDUSTRIAL_RAW_MATERIAL",
  "OTHER"
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const LOCATION_TYPES = [
  "ANCHORAGE",
  "SEA_POINT",
  "CHECKPOINT",
  "PORT",
  "GHAT",
  "PARTY_PORT",
  "SILO",
  "WAREHOUSE",
  "OFFICE",
  "OTHER"
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export type MasterOrganizationOption = {
  id: string;
  code: string;
  name: string;
  type: string;
};

export type MasterOrganizationTypeRow = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { organizations: number };
};

export type MasterOrganizationRow = {
  id: string;
  code: string;
  name: string;
  organizationType: { id: string; code: string; name: string };
  address: string | null;
  contactPerson: string | null;
  contactNo: string | null;
  email: string | null;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { users: number };
};

export type MasterProductRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  specification: string | null;
  defaultUom: string;
  hsCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MasterLocationRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  address: string | null;
  district: string | null;
  division: string | null;
  country: string;
  postalCode: string | null;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MasterLocationOption = {
  id: string;
  code: string;
  name: string;
  type: string;
};

export type MasterGhatRow = {
  id: string;
  code: string;
  name: string;
  locationId: string;
  unloadingCapacityMtPerDay: string | null;
  numberOfJetties: number;
  hasWarehouseStorage: boolean;
  warehouseCapacityMt: string | null;
  hasTruckScale: boolean;
  workingStartHour: string | null;
  workingEndHour: string | null;
  contactPerson: string | null;
  contactNo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  location: { id: string; code: string; name: string; type: string };
};

/** SOF event row from list endpoints */
export type SofEventListItem = {
  id: string;
  eventTypeId: string;
  eventTypeDefinition: { id: string; code: string; name: string };
  eventTime: string;
  durationHours: string | null;
  /** Whole minutes from period start to `eventTime`; preferred over `durationHours`. */
  durationMinutes?: number | null;
  remarks: string | null;
  isHold: boolean;
  holdReason: string | null;
  robQuantityMt: string | null;
  dischargeQuantityMt: string | null;
  cumulativeDischargeMt: string | null;
  createdBy: string;
  createdByUser: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type MotherSofListRow = {
  id: string;
  sofNo: string;
  status: string;
  startedAt: string | null;
  vesselCall: {
    id: string;
    callNo: string;
    status: string;
    eta: string | null;
    ata: string | null;
    currentAnchorage: string | null;
    cargoNameSnapshot: string | null;
    approxTotalWeightTon: string | null;
    totalDischargeMt: string | null;
    dischargeStartedAt: string | null;
    dischargeCompletedAt: string | null;
    vessel: { id: string; name: string; imoNo: string | null };
    cnf: { name: string } | null;
    arrivalLocation: { id: string; name: string; type: string } | null;
    _count: { lighterTrips: number; lighterAssignments: number };
  } | null;
  _count?: { events: number; hourlyStatuses?: number };
};

/** Aggregated lighter / discharge pipeline for one or more vessel calls */
export type VesselCallBoardMetrics = {
  totalTrips: number;
  totalAssignments: number;
  lastNightAllocated: number;
  released: number;
  engaged: number;
  pipeline: {
    toMv: number;
    alongside: number;
    loading: number;
    loadDone: number;
    voyageGhat: number;
    ghatStanding: number;
    ghatDischarging: number;
  };
  remVoyageMt: number | null;
  remGhatMt: number | null;
  dischargedFromLvMt: number | null;
  lighterDischargeLast5DayAvgMt: number | null;
};

export type LighterTripBoardMetricsResponse = {
  byVesselCallId: Record<string, VesselCallBoardMetrics>;
};

/** Lighter trip row when `GET /lighter-trips?report=ghat-aging&vesselCallId=…` */
export type LighterTripGhatAgingRow = {
  id: string;
  tripNo: string;
  status: string;
  assignedAt: string;
  createdAt: string;
  wayToMVStartedAt: string | null;
  alongsideDate: string | null;
  loadingStartedAt: string | null;
  loadingCompletedAt: string | null;
  departedMvDate: string | null;
  wayToGhatStartedAt: string | null;
  arrivedGhatDate: string | null;
  unloadStartedAt: string | null;
  unloadCompletedAt: string | null;
  lighterVessel: { id: string; name: string; imoNo: string | null };
  vesselCall: {
    id: string;
    callNo: string;
    status: string;
    vessel: { id: string; name: string };
  };
  statementOfFacts: { id: string; sofNo: string; status: string } | null;
  lighterAssignment: {
    assignedDate: string;
    estimatedQtyMt: string;
    actualDischargedQtyMt: string | null;
    destinationGhat: { name: string; location: { name: string } } | null;
    carrier: { organization: { name: string } } | null;
  } | null;
  cargoes: Array<{
    estimatedQtyTon: string | null;
    loadedQtyTon: string | null;
    dischargedQtyTon: string | null;
    product: { name: string };
  }>;
};

export type LighterSofListRow = {
  id: string;
  sofNo: string;
  status: string;
  startedAt: string | null;
  lighterTrip: {
    id: string;
    tripNo: string;
    lighterVessel: {
      id: string;
      name: string;
      imoNo: string | null;
      flag: string | null;
      isLighter: boolean;
    };
    /** Same vessel-call snapshot shape as `MotherSofListRow.vesselCall` for fleet discharge table parity */
    vesselCall: MotherSofListRow["vesselCall"];
  } | null;
  _count?: { events: number; hourlyStatuses?: number };
};

export type SofOptions = {
  vesselCalls: Array<{
    id: string;
    callNo: string;
    status: string;
    eta: string | null;
    currentAnchorage: string | null;
    vessel: { id: string; name: string; imoNo: string | null };
    statementOfFacts: { id: string; sofNo: string; status: string } | null;
  }>;
  lighterTrips: Array<{
    id: string;
    tripNo: string;
    status: string;
    assignedAt: string;
    lighterVessel: { id: string; name: string };
    vesselCall: { id: string; callNo: string; vessel: { id: string; name: string } };
    statementOfFacts: { id: string; sofNo: string; status: string } | null;
  }>;
  users: Array<{
    id: string;
    fullName: string;
    email: string;
    organization: { name: string } | null;
  }>;
};
