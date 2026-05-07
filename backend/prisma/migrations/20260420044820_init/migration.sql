-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('SUPER_ADMIN', 'HEAD_OFFICE_LC', 'COMMERCIAL_ADMIN', 'FINANCE_APPROVER', 'DOCUMENT_CONTROLLER', 'OPERATIONS_MANAGER', 'MOTHER_VESSEL_ADMIN', 'SHIPPING_AGENT_USER', 'CNF_AGENT', 'STEVEDORE_COORDINATOR', 'LIGHTER_ASSIGNMENT_OFFICER', 'CARRIER_COORDINATOR', 'PORT_ADMIN', 'GHAT_OPERATOR', 'WEIGHMENT_OFFICER', 'TRUCK_DISPATCH_OFFICER', 'WAREHOUSE_OPERATOR', 'WAREHOUSE_RECEIVER', 'INVENTORY_CONTROLLER', 'MANAGEMENT_VIEWER', 'AUDITOR', 'REPORT_VIEWER');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('OWN_COMPANY', 'SUPPLIER', 'CUSTOMER', 'SHIPPING_AGENT', 'STEVEDORE', 'CARRIER', 'CNF', 'INDENTOR', 'INSURER', 'BANK', 'TRANSPORTER', 'WAREHOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('ANCHORAGE', 'SEA_POINT', 'CHECKPOINT', 'PORT', 'GHAT', 'PARTY_PORT', 'SILO', 'WAREHOUSE', 'OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('GENERAL', 'GODOWN', 'FACTORY');

-- CreateEnum
CREATE TYPE "WarehouseCriteria" AS ENUM ('OWN', 'RENT', 'CONTRACT');

-- CreateEnum
CREATE TYPE "SiloUnloadingSystemType" AS ENUM ('SEMI_AUTOMATED', 'AUTOMATED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('BULK_FOOD_GRAIN', 'FERTILIZER', 'CEMENT_CLINKER', 'EDIBLE_OIL', 'INDUSTRIAL_RAW_MATERIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'PARTIAL_USED', 'FULLY_USED', 'BLOCKED', 'CLOSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MotherVesselStatus" AS ENUM ('EXPECTED', 'ARRIVED', 'ANCHORED', 'LC_HOLD', 'READY_TO_DISCHARGE', 'DISCHARGING', 'PARTIAL_DISCHARGED', 'COMPLETED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'REQUESTED', 'PENDING', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LighterTripStatus" AS ENUM ('PLANNED', 'ASSIGNED', 'NOT_READY', 'READY_TO_SAIL', 'OUTBOUND_AT_SEA', 'AT_CHECKPOINT', 'ALONGSIDE', 'PREPARING_TO_LOAD', 'LOADING', 'LOADED', 'RETURNING_AT_SEA', 'ARRIVED_GHAT', 'WAITING_UNLOAD', 'UNLOADING', 'ON_HOLD', 'PARTIAL_UNLOADED', 'UNLOADED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UnloadingMethod" AS ENUM ('TRUCK_DIRECT', 'WAREHOUSE_SACK_UNLOADING', 'SILO_AUTOMATED_UNLOADING', 'BAG_PACKING', 'MIXED');

-- CreateEnum
CREATE TYPE "TruckLoadStatus" AS ENUM ('LOADED', 'IN_TRANSIT', 'ARRIVED_DESTINATION', 'DELIVERED', 'PARTIAL_DELIVERED', 'REJECTED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "DeliveryReceiptStatus" AS ENUM ('FULL', 'PARTIAL', 'SHORT_RECEIVED', 'REJECTED', 'DIFFERENCE_RECEIVED');

-- CreateEnum
CREATE TYPE "TruckLoadSourceType" AS ENUM ('LIGHTER_UNLOADING', 'SILO', 'WAREHOUSE', 'DIRECT_PORT', 'OTHER');

-- CreateEnum
CREATE TYPE "WeightSource" AS ENUM ('DECLARED', 'ESTIMATED', 'DRAFT_SURVEY', 'AGREED_OPERATIONAL', 'WEIGHBRIDGE', 'SILO_SCALE', 'MANUAL_CONFIRMED');

-- CreateEnum
CREATE TYPE "EventDirection" AS ENUM ('OUTBOUND', 'RETURN', 'INTERNAL');

-- CreateEnum
CREATE TYPE "SOFEventType" AS ENUM ('ANCHOR_DROPPED', 'NOR_TENDERED', 'LC_RELEASED', 'DISCHARGE_STARTED', 'DISCHARGE_STOPPED', 'HOLD', 'SHIFTING', 'BREAKDOWN', 'COMPLETED', 'ANCHOR_UP', 'OTHER');

-- CreateEnum
CREATE TYPE "SOFScope" AS ENUM ('MOTHER_VESSEL', 'LIGHTER_VESSEL');

-- CreateEnum
CREATE TYPE "SaleAllocationType" AS ENUM ('INTERNAL_OWN_PORT', 'INTERNAL_OWN_WAREHOUSE', 'PARTY_PORT', 'PARTY_WAREHOUSE');

-- CreateEnum
CREATE TYPE "CostBearingScope" AS ENUM ('FULL_DELIVERY_TO_WAREHOUSE', 'PORT_ONLY', 'UNLOADING_ONLY', 'GHAT_TO_WAREHOUSE', 'CUSTOMER_ARRANGES_ALL');

-- CreateEnum
CREATE TYPE "SOFStatus" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'APPROVED', 'DISPUTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DischargeStage" AS ENUM ('ANCHORAGE_DISCHARGE', 'ALONGSIDE_DISCHARGE', 'MID_STREAM_DISCHARGE', 'BERTH_DISCHARGE', 'SHIFTED_DISCHARGE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('MOTHER_VESSEL_OPENING', 'LC_RELEASE', 'LIGHTER_LOADED', 'LIGHTER_RETURNING', 'GHAT_RECEIVED', 'SILO_RECEIVED', 'SILO_ISSUED', 'WAREHOUSE_RECEIVED', 'TRUCK_LOADED', 'TRUCK_DELIVERED', 'SALE_DELIVERED', 'DIFFERENCE_ADJUSTMENT', 'CORRECTION');

-- CreateEnum
CREATE TYPE "StockLocationType" AS ENUM ('MOTHER_VESSEL', 'LIGHTER', 'GHAT', 'SILO', 'TRUCK', 'WAREHOUSE', 'PARTY_LOCATION', 'IN_TRANSIT', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MOTHER_VESSEL_ADMIN', 'LIGHTER_ADMIN', 'PORT_ADMIN', 'ASSIGNMENT_OFFICER', 'HEAD_OFFICE_LC', 'STEVEDORE_SUPERVISOR', 'GHAT_MANAGER', 'SURVEYOR', 'CARRIER_MANAGER', 'FINANCE', 'VIEWER');

-- CreateEnum
CREATE TYPE "LighterStatus" AS ENUM ('ASSIGNED', 'READY_FOR_DEPARTURE', 'EN_ROUTE_TO_MV', 'WAITING_ALONGSIDE', 'ALONGSIDE_MV', 'LOADING', 'LOADING_SUSPENDED', 'LOADING_COMPLETE', 'RETURNING_TO_GHAT', 'WAITING_AT_GHAT', 'UNLOADING_AT_GHAT', 'UNLOADING_SUSPENDED', 'UNLOADING_COMPLETE', 'ON_HOLD', 'COMPLETED');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "address" TEXT,
    "contactPerson" TEXT,
    "contactNo" TEXT,
    "email" TEXT,
    "taxId" TEXT,
    "registrationNo" TEXT,
    "website" TEXT,
    "currentStatus" TEXT DEFAULT 'ACTIVE',
    "companyCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "password_hash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "organizationId" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AppRole" NOT NULL,
    "locationId" TEXT,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "address" TEXT,
    "district" TEXT,
    "division" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Bangladesh',
    "postal_code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anchorages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anchorages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ghats" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "unloading_capacity_mt_per_day" DECIMAL(18,3),
    "number_of_jetties" INTEGER NOT NULL DEFAULT 1,
    "has_warehouse_storage" BOOLEAN NOT NULL DEFAULT false,
    "warehouse_capacity_mt" DECIMAL(18,3),
    "has_truck_scale" BOOLEAN NOT NULL DEFAULT false,
    "working_start_hour" TEXT,
    "working_end_hour" TEXT,
    "contact_person" TEXT,
    "contact_no" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ghats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WarehouseType" NOT NULL DEFAULT 'GENERAL',
    "criteria" "WarehouseCriteria" NOT NULL DEFAULT 'OWN',
    "location_id" TEXT,
    "address" TEXT,
    "capacity_mt" DECIMAL(18,3),
    "current_fill_mt" DECIMAL(18,3) DEFAULT 0,
    "sack_handling_capacity_mt_per_day" DECIMAL(18,3),
    "owner_name" TEXT,
    "contact_no" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silos" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criteria" "WarehouseCriteria" NOT NULL DEFAULT 'OWN',
    "location_id" TEXT,
    "capacity_mt" DECIMAL(18,3),
    "current_fill_mt" DECIMAL(18,3) DEFAULT 0,
    "unloading_system_type" "SiloUnloadingSystemType" NOT NULL DEFAULT 'AUTOMATED',
    "machine_unloading_capacity_mt_per_hour" DECIMAL(18,3),
    "receives_directly_from_lighter" BOOLEAN NOT NULL DEFAULT true,
    "has_weight_calculation" BOOLEAN NOT NULL DEFAULT true,
    "weight_calculation_method" TEXT,
    "weight_calculation_accuracy_pct" DECIMAL(5,2),
    "owner_name" TEXT,
    "contact_no" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "silos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL DEFAULT 'OTHER',
    "specification" TEXT,
    "default_uom" TEXT NOT NULL DEFAULT 'MT',
    "hs_code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_contracts" (
    "id" TEXT NOT NULL,
    "contract_no" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "buyer_organization_id" TEXT,
    "contract_date" TIMESTAMP(3),
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "total_contract_qty_ton" DECIMAL(18,3),
    "total_contract_weight_ton" DECIMAL(18,3),
    "tolerance_min_pct" DECIMAL(5,2),
    "tolerance_max_pct" DECIMAL(5,2),
    "laytime_allowed_hours" DECIMAL(12,2),
    "demurrage_rate_per_day" DECIMAL(18,2),
    "dispatch_rate_per_day" DECIMAL(18,2),
    "remarks" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_contract_lines" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "line_no" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity_ton" DECIMAL(18,3),
    "weight_ton" DECIMAL(18,3),
    "rate" DECIMAL(18,4),
    "total_amount" DECIMAL(18,2),
    "product_spec" TEXT,
    "line_status" TEXT,

    CONSTRAINT "import_contract_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proforma_invoices" (
    "id" TEXT NOT NULL,
    "pi_no" TEXT NOT NULL,
    "pi_date" TIMESTAMP(3),
    "party_id" TEXT,
    "remarks" TEXT,
    "company_code" TEXT,
    "added_by_id" TEXT,
    "modified_by_id" TEXT,
    "entry_date" TIMESTAMP(3),
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proforma_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pi_items" (
    "id" TEXT NOT NULL,
    "pi_id" TEXT NOT NULL,
    "line_no" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "lc_qty" DECIMAL(18,3),
    "bl_qty" DECIMAL(18,3),
    "received_qty" DECIMAL(18,3),
    "lc_weight_ton" DECIMAL(18,3),

    CONSTRAINT "pi_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letters_of_credit" (
    "id" TEXT NOT NULL,
    "lc_no" TEXT NOT NULL,
    "pi_id" TEXT,
    "party_id" TEXT,
    "lc_open_date" TIMESTAMP(3),
    "lc_expiry_date" TIMESTAMP(3),
    "lc_ship_date" TIMESTAMP(3),
    "indentor_id" TEXT,
    "cnf_id" TEXT,
    "insurer_id" TEXT,
    "policy_no" TEXT,
    "lc_curr_rate" DECIMAL(18,6),
    "book_rate" DECIMAL(18,6),
    "book_value" DECIMAL(18,2),
    "book_currency" TEXT,
    "conversion_rate" DECIMAL(18,6),
    "lc_amount" DECIMAL(18,2),
    "utilized_amount" DECIMAL(18,2) DEFAULT 0,
    "commission_rate" DECIMAL(18,6),
    "commission_expense" DECIMAL(18,2),
    "difference_expense" DECIMAL(18,2),
    "bank_id" TEXT,
    "bank_name" TEXT,
    "country_of_origin" TEXT,
    "remarks" TEXT,
    "lc_status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "effective_ledger_name" TEXT,
    "value_in" TEXT,
    "company_code" TEXT,
    "added_by_id" TEXT,
    "modified_by_id" TEXT,
    "entry_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letters_of_credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_items" (
    "id" TEXT NOT NULL,
    "lc_id" TEXT NOT NULL,
    "line_no" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity_ton" DECIMAL(18,3),
    "weight_ton" DECIMAL(18,3),
    "rate" DECIMAL(18,4),
    "total_amount" DECIMAL(18,2),
    "product_spec" TEXT,
    "line_status" TEXT,
    "utilized_qty_ton" DECIMAL(18,3) DEFAULT 0,

    CONSTRAINT "lc_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_amendments" (
    "id" TEXT NOT NULL,
    "auto_no" TEXT,
    "lc_id" TEXT NOT NULL,
    "lc_expiry_date" TIMESTAMP(3),
    "last_ship_date" TIMESTAMP(3),
    "lc_qty" DECIMAL(18,3),
    "lc_weight_ton" DECIMAL(18,3),
    "book_rate" DECIMAL(18,6),
    "book_value" DECIMAL(18,2),
    "book_currency" TEXT,
    "conversion_rate" DECIMAL(18,6),
    "lc_amount" DECIMAL(18,2),
    "policy_no" TEXT,
    "remarks" TEXT,
    "time_entry" TIMESTAMP(3),
    "approval_status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "approval_date" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "requested_by_id" TEXT,
    "entry_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lc_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills_of_lading" (
    "id" TEXT NOT NULL,
    "bl_no" TEXT NOT NULL,
    "bl_date" TIMESTAMP(3),
    "ship_date" TIMESTAMP(3),
    "lc_id" TEXT,
    "vessel_name" TEXT,
    "entry_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_of_lading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bl_items" (
    "id" TEXT NOT NULL,
    "bl_id" TEXT NOT NULL,
    "line_no" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity_ton" DECIMAL(18,3),
    "weight_ton" DECIMAL(18,3),
    "rate" DECIMAL(18,4),
    "total_amount" DECIMAL(18,2),
    "product_spec" TEXT,
    "line_status" TEXT,

    CONSTRAINT "bl_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imo_no" TEXT,
    "vessel_type" TEXT,
    "flag" TEXT,
    "deadweight_ton" DECIMAL(18,3),
    "max_draft_meters" DECIMAL(8,3),
    "length_overall_m" DECIMAL(8,2),
    "beam_m" DECIMAL(8,2),
    "year_built" INTEGER,
    "is_mother_vessel" BOOLEAN NOT NULL DEFAULT false,
    "is_lighter" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vessels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessel_calls" (
    "id" TEXT NOT NULL,
    "call_no" TEXT NOT NULL,
    "vessel_id" TEXT NOT NULL,
    "import_contract_id" TEXT,
    "arrival_location_id" TEXT,
    "shipping_agent_id" TEXT,
    "stevedore_id" TEXT,
    "cnf_id" TEXT,
    "eta" TIMESTAMP(3),
    "etd" TIMESTAMP(3),
    "ata" TIMESTAMP(3),
    "atd" TIMESTAMP(3),
    "anchor_dropped_at" TIMESTAMP(3),
    "nor_tendered_at" TIMESTAMP(3),
    "nor_accepted_at" TIMESTAMP(3),
    "ready_to_discharge_at" TIMESTAMP(3),
    "discharge_started_at" TIMESTAMP(3),
    "discharge_completed_at" TIMESTAMP(3),
    "anchor_up_at" TIMESTAMP(3),
    "cargo_name_snapshot" TEXT,
    "approx_total_weight_ton" DECIMAL(18,3),
    "tolerance_minus_pct" DECIMAL(5,2),
    "tolerance_plus_pct" DECIMAL(5,2),
    "hold_reason" TEXT,
    "status" "MotherVesselStatus" NOT NULL DEFAULT 'EXPECTED',
    "added_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "total_stages" INTEGER NOT NULL DEFAULT 1,
    "completed_stages" INTEGER NOT NULL DEFAULT 0,
    "last_stage_completed_at" TIMESTAMP(3),
    "next_stage_expected_at" TIMESTAMP(3),
    "anchorage_discharge_mt" DECIMAL(18,3) DEFAULT 0,
    "alongside_discharge_mt" DECIMAL(18,3) DEFAULT 0,
    "total_discharge_mt" DECIMAL(18,3) DEFAULT 0,

    CONSTRAINT "vessel_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessel_cargo_lines" (
    "id" TEXT NOT NULL,
    "vessel_call_id" TEXT NOT NULL,
    "line_no" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "lc_item_id" TEXT,
    "bl_item_id" TEXT,
    "approx_qty_ton" DECIMAL(18,3),
    "approx_weight_ton" DECIMAL(18,3),
    "estimated_balance_ton" DECIMAL(18,3),
    "discharged_qty_ton" DECIMAL(18,3) DEFAULT 0,
    "remaining_qty_ton" DECIMAL(18,3),
    "remarks" TEXT,

    CONSTRAINT "vessel_cargo_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carriers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "contact_person" TEXT,
    "contact_no" TEXT,
    "email" TEXT,
    "address" TEXT,
    "payment_terms" TEXT,
    "credit_limit_mt" DECIMAL(18,3),
    "rating" INTEGER DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lighters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registration_no" TEXT,
    "carrier_id" TEXT NOT NULL,
    "capacity_mt" DECIMAL(18,3) NOT NULL,
    "length_m" DOUBLE PRECISION,
    "draft_m" DOUBLE PRECISION,
    "engine_hp" INTEGER,
    "has_fender" BOOLEAN NOT NULL DEFAULT true,
    "has_cover" BOOLEAN NOT NULL DEFAULT false,
    "last_survey_date" TIMESTAMP(3),
    "next_survey_date" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lighters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lighter_assignments" (
    "id" TEXT NOT NULL,
    "assignment_no" TEXT NOT NULL,
    "carrier_id" TEXT NOT NULL,
    "lighter_id" TEXT NOT NULL,
    "lc_id" TEXT,
    "lc_release_id" TEXT,
    "vessel_call_id" TEXT NOT NULL,
    "cost_bearing_scope" "CostBearingScope" NOT NULL DEFAULT 'PORT_ONLY',
    "freight_rate_usd" DECIMAL(18,2),
    "total_freight_usd" DECIMAL(18,2),
    "delivery_destination" TEXT,
    "destination_ghat_id" TEXT NOT NULL,
    "estimated_qty_mt" DECIMAL(18,3) NOT NULL,
    "surveyor_loaded_qty_mt" DECIMAL(18,3),
    "actual_discharged_qty_mt" DECIMAL(18,3),
    "weight_difference_mt" DECIMAL(18,3),
    "weight_difference_percent" DECIMAL(8,4),
    "assigned_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "carrier_confirmed_date" TIMESTAMP(3),
    "ready_date" TIMESTAMP(3),
    "departed_date" TIMESTAMP(3),
    "arrived_mv_date" TIMESTAMP(3),
    "alongside_date" TIMESTAMP(3),
    "loading_start_date" TIMESTAMP(3),
    "loading_suspended_date" TIMESTAMP(3),
    "loading_resumed_date" TIMESTAMP(3),
    "loading_complete_date" TIMESTAMP(3),
    "departed_mv_date" TIMESTAMP(3),
    "arrived_ghat_date" TIMESTAMP(3),
    "unloading_start_date" TIMESTAMP(3),
    "unloading_suspended_date" TIMESTAMP(3),
    "unloading_resumed_date" TIMESTAMP(3),
    "unloading_complete_date" TIMESTAMP(3),
    "status" "LighterStatus" NOT NULL DEFAULT 'ASSIGNED',
    "hold_reason" TEXT,
    "hold_hours" DECIMAL(10,2),
    "discharge_stage" "DischargeStage" NOT NULL DEFAULT 'ANCHORAGE_DISCHARGE',
    "stage_quantity_mt" DECIMAL(18,3),
    "stage_freight_rate_usd" DECIMAL(18,2),
    "assigned_by" TEXT NOT NULL,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lighter_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statements_of_fact" (
    "id" TEXT NOT NULL,
    "sof_no" TEXT NOT NULL,
    "scope" "SOFScope" NOT NULL DEFAULT 'MOTHER_VESSEL',
    "vessel_call_id" TEXT,
    "lighter_trip_id" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" "SOFStatus" NOT NULL DEFAULT 'DRAFT',
    "laytime_allowed_hours" DECIMAL(12,2),
    "laytime_used_hours" DECIMAL(12,2),
    "laytime_excluded_hours" DECIMAL(12,2) DEFAULT 0,
    "laytime_balance_hours" DECIMAL(12,2),
    "demurrage_amount" DECIMAL(18,2),
    "dispatch_amount" DECIMAL(18,2),
    "net_amount" DECIMAL(18,2),
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statements_of_fact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sof_events" (
    "id" TEXT NOT NULL,
    "statement_id" TEXT NOT NULL,
    "event_type" "SOFEventType" NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "duration_hours" DECIMAL(10,2),
    "counts_as_laytime" BOOLEAN NOT NULL DEFAULT true,
    "laytime_impact_hours" DECIMAL(10,2),
    "location" TEXT,
    "anchorage_id" TEXT,
    "rob_quantity_mt" DECIMAL(18,3),
    "discharge_quantity_mt" DECIMAL(18,3),
    "cumulative_discharge_mt" DECIMAL(18,3),
    "is_hold" BOOLEAN NOT NULL DEFAULT false,
    "hold_reason" TEXT,
    "responsible_party" TEXT,
    "laytime_account" TEXT,
    "reference_no" TEXT,
    "remarks" TEXT,
    "supporting_documents" TEXT[],
    "created_by" TEXT NOT NULL,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sof_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mother_vessel_daily_discharges" (
    "id" TEXT NOT NULL,
    "vessel_call_id" TEXT NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL,
    "quantity_24h_mt" DECIMAL(18,3) NOT NULL,
    "cumulative_mt" DECIMAL(18,3),
    "remaining_mt" DECIMAL(18,3),
    "entered_by_id" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mother_vessel_daily_discharges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sof_hourly_statuses" (
    "id" TEXT NOT NULL,
    "statement_id" TEXT NOT NULL,
    "daily_discharge_id" TEXT,
    "lighter_trip_id" TEXT,
    "hour_start_at" TIMESTAMP(3) NOT NULL,
    "hour_end_at" TIMESTAMP(3),
    "event_type" "SOFEventType",
    "status_text" TEXT NOT NULL,
    "discharge_qty_mt" DECIMAL(18,3),
    "cumulative_mt" DECIMAL(18,3),
    "rob_qty_mt" DECIMAL(18,3),
    "hold_reason" TEXT,
    "remarks" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sof_hourly_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lighter_trips" (
    "id" TEXT NOT NULL,
    "trip_no" TEXT NOT NULL,
    "vessel_call_id" TEXT NOT NULL,
    "lighter_assignment_id" TEXT,
    "lighter_vessel_id" TEXT NOT NULL,
    "assigned_by_id" TEXT,
    "return_location_id" TEXT,
    "destination_type" "SaleAllocationType",
    "driver_name" TEXT,
    "driver_phone" TEXT,
    "lighter_capacity_ton" DECIMAL(18,3),
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "way_to_mv_ready_at" TIMESTAMP(3),
    "way_to_mv_started_at" TIMESTAMP(3),
    "way_to_mv_completed_at" TIMESTAMP(3),
    "loading_started_at" TIMESTAMP(3),
    "loading_completed_at" TIMESTAMP(3),
    "way_to_ghat_started_at" TIMESTAMP(3),
    "way_to_ghat_completed_at" TIMESTAMP(3),
    "unload_started_at" TIMESTAMP(3),
    "unload_completed_at" TIMESTAMP(3),
    "status" "LighterTripStatus" NOT NULL DEFAULT 'PLANNED',
    "remarks" TEXT,
    "payment_status" "PaymentStatus" DEFAULT 'PENDING',
    "hold_reason" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lighter_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lighter_trip_cargoes" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "lc_release_id" TEXT,
    "estimated_qty_ton" DECIMAL(18,3),
    "agreed_qty_ton" DECIMAL(18,3),
    "loaded_qty_ton" DECIMAL(18,3),
    "discharged_qty_ton" DECIMAL(18,3),
    "difference_qty_ton" DECIMAL(18,3),
    "difference_pct" DECIMAL(5,2),
    "weight_source" "WeightSource",
    "remarks" TEXT,

    CONSTRAINT "lighter_trip_cargoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lighter_trip_events" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_after" "LighterTripStatus",
    "direction" "EventDirection",
    "remarks" TEXT,

    CONSTRAINT "lighter_trip_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ghat_unloadings" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "ghat_id" TEXT NOT NULL,
    "queue_no" INTEGER,
    "method" "UnloadingMethod" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "weighing_method" TEXT NOT NULL,
    "total_weighed_mt" DECIMAL(18,3),
    "number_of_trucks" INTEGER,
    "number_of_bags" INTEGER,
    "sample_taken" BOOLEAN NOT NULL DEFAULT false,
    "sample_quality" TEXT,
    "difference_pct" DECIMAL(5,2),
    "customer_warehouse_id" TEXT,
    "transport_cost_usd" DECIMAL(18,2),
    "unloading_rate_mt_per_hr" DECIMAL(18,3),
    "hold_reason" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ghat_unloadings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trucks" (
    "id" TEXT NOT NULL,
    "reg_no" TEXT NOT NULL,
    "owner_org_id" TEXT,
    "capacity_ton" DECIMAL(18,3),
    "driver_name" TEXT,
    "driver_phone" TEXT,
    "license_no" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trucks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "truck_loads" (
    "id" TEXT NOT NULL,
    "unloading_id" TEXT NOT NULL,
    "source_type" "TruckLoadSourceType" NOT NULL DEFAULT 'LIGHTER_UNLOADING',
    "silo_receipt_id" TEXT,
    "truck_id" TEXT,
    "truck_number" TEXT NOT NULL,
    "product_id" TEXT,
    "driver_name" TEXT,
    "driver_phone" TEXT,
    "gross_weight_mt" DECIMAL(18,3),
    "tare_weight_mt" DECIMAL(18,3),
    "weight_mt" DECIMAL(18,3) NOT NULL,
    "weighbridge_slip_no" TEXT,
    "product_type" TEXT NOT NULL,
    "destination_id" TEXT,
    "destination" TEXT NOT NULL,
    "delivery_address" TEXT,
    "dispatched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimated_arrival" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "status" "TruckLoadStatus" NOT NULL DEFAULT 'LOADED',
    "receiver_name" TEXT,
    "warehouse_id" TEXT,
    "received_at" TIMESTAMP(3),
    "received_by" TEXT,
    "quantity_received_mt" DECIMAL(18,3),
    "delivery_status" "DeliveryReceiptStatus",
    "delivery_hold_reason" TEXT,
    "delivery_remarks" TEXT,
    "notes" TEXT,

    CONSTRAINT "truck_loads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silo_receipts" (
    "id" TEXT NOT NULL,
    "receipt_no" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "silo_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "exact_qty_ton" DECIMAL(18,3),
    "quality_grade" TEXT,
    "received_at" TIMESTAMP(3),
    "received_by" TEXT,
    "remarks" TEXT,

    CONSTRAINT "silo_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "movement_no" TEXT NOT NULL,
    "movement_type" "StockMovementType" NOT NULL,
    "product_id" TEXT NOT NULL,
    "vessel_call_id" TEXT,
    "lc_release_id" TEXT,
    "lighter_assignment_id" TEXT,
    "lighter_trip_id" TEXT,
    "ghat_unloading_id" TEXT,
    "silo_receipt_id" TEXT,
    "truck_load_id" TEXT,
    "from_location_type" "StockLocationType",
    "from_location_id" TEXT,
    "to_location_type" "StockLocationType",
    "to_location_id" TEXT,
    "from_vessel_id" TEXT,
    "to_lighter_id" TEXT,
    "ghat_id" TEXT,
    "silo_id" TEXT,
    "warehouse_id" TEXT,
    "quantity_ton" DECIMAL(18,3) NOT NULL,
    "weight_source" "WeightSource",
    "movement_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_no" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_releases" (
    "id" TEXT NOT NULL,
    "lc_id" TEXT NOT NULL,
    "vessel_call_id" TEXT NOT NULL,
    "released_qty_ton" DECIMAL(18,3) NOT NULL,
    "used_qty_ton" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "status" "DocumentStatus" NOT NULL DEFAULT 'APPROVED',
    "release_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "released_by_id" TEXT,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "lc_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unloading_operations" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "method" "UnloadingMethod" NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "exact_total_qty_ton" DECIMAL(18,3),
    "exact_weight_source" "WeightSource",
    "unloading_rate_ton_hr" DECIMAL(18,3),
    "hold_reason" TEXT,
    "remarks" TEXT,

    CONSTRAINT "unloading_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unloading_lines" (
    "id" TEXT NOT NULL,
    "unloading_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "exact_qty_ton" DECIMAL(18,3),
    "destination_type" "UnloadingMethod",
    "remarks" TEXT,

    CONSTRAINT "unloading_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_taxId_key" ON "organizations"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_registrationNo_key" ON "organizations"("registrationNo");

-- CreateIndex
CREATE INDEX "organizations_type_idx" ON "organizations"("type");

-- CreateIndex
CREATE INDEX "organizations_isActive_idx" ON "organizations"("isActive");

-- CreateIndex
CREATE INDEX "organizations_deleted_at_idx" ON "organizations"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_type_key" ON "organizations"("code", "type");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_email_isActive_idx" ON "users"("email", "isActive");

-- CreateIndex
CREATE INDEX "users_organizationId_isActive_idx" ON "users"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "user_roles_role_idx" ON "user_roles"("role");

-- CreateIndex
CREATE INDEX "user_roles_expiresAt_idx" ON "user_roles"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_locationId_key" ON "user_roles"("userId", "role", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "locations"("code");

-- CreateIndex
CREATE INDEX "locations_type_idx" ON "locations"("type");

-- CreateIndex
CREATE INDEX "locations_district_idx" ON "locations"("district");

-- CreateIndex
CREATE INDEX "locations_isActive_idx" ON "locations"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_type_key" ON "locations"("code", "type");

-- CreateIndex
CREATE UNIQUE INDEX "anchorages_code_key" ON "anchorages"("code");

-- CreateIndex
CREATE INDEX "anchorages_locationId_idx" ON "anchorages"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "ghats_code_key" ON "ghats"("code");

-- CreateIndex
CREATE INDEX "ghats_locationId_idx" ON "ghats"("locationId");

-- CreateIndex
CREATE INDEX "ghats_isActive_idx" ON "ghats"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE INDEX "warehouses_type_criteria_idx" ON "warehouses"("type", "criteria");

-- CreateIndex
CREATE INDEX "warehouses_location_id_idx" ON "warehouses"("location_id");

-- CreateIndex
CREATE INDEX "warehouses_isActive_idx" ON "warehouses"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "silos_code_key" ON "silos"("code");

-- CreateIndex
CREATE INDEX "silos_criteria_idx" ON "silos"("criteria");

-- CreateIndex
CREATE INDEX "silos_location_id_idx" ON "silos"("location_id");

-- CreateIndex
CREATE INDEX "silos_isActive_idx" ON "silos"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE INDEX "products_type_idx" ON "products"("type");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "import_contracts_contract_no_key" ON "import_contracts"("contract_no");

-- CreateIndex
CREATE INDEX "import_contracts_supplier_id_idx" ON "import_contracts"("supplier_id");

-- CreateIndex
CREATE INDEX "import_contracts_status_idx" ON "import_contracts"("status");

-- CreateIndex
CREATE INDEX "import_contracts_contract_no_idx" ON "import_contracts"("contract_no");

-- CreateIndex
CREATE UNIQUE INDEX "import_contract_lines_contract_id_line_no_key" ON "import_contract_lines"("contract_id", "line_no");

-- CreateIndex
CREATE UNIQUE INDEX "proforma_invoices_pi_no_key" ON "proforma_invoices"("pi_no");

-- CreateIndex
CREATE INDEX "proforma_invoices_pi_no_idx" ON "proforma_invoices"("pi_no");

-- CreateIndex
CREATE INDEX "proforma_invoices_status_idx" ON "proforma_invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "pi_items_pi_id_line_no_key" ON "pi_items"("pi_id", "line_no");

-- CreateIndex
CREATE UNIQUE INDEX "letters_of_credit_lc_no_key" ON "letters_of_credit"("lc_no");

-- CreateIndex
CREATE INDEX "letters_of_credit_lc_no_lc_status_idx" ON "letters_of_credit"("lc_no", "lc_status");

-- CreateIndex
CREATE INDEX "letters_of_credit_party_id_lc_expiry_date_idx" ON "letters_of_credit"("party_id", "lc_expiry_date");

-- CreateIndex
CREATE INDEX "letters_of_credit_lc_open_date_lc_status_idx" ON "letters_of_credit"("lc_open_date", "lc_status");

-- CreateIndex
CREATE INDEX "letters_of_credit_deleted_at_idx" ON "letters_of_credit"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "lc_items_lc_id_line_no_key" ON "lc_items"("lc_id", "line_no");

-- CreateIndex
CREATE UNIQUE INDEX "lc_amendments_auto_no_key" ON "lc_amendments"("auto_no");

-- CreateIndex
CREATE INDEX "lc_amendments_lc_id_idx" ON "lc_amendments"("lc_id");

-- CreateIndex
CREATE INDEX "lc_amendments_approval_status_idx" ON "lc_amendments"("approval_status");

-- CreateIndex
CREATE UNIQUE INDEX "bills_of_lading_bl_no_key" ON "bills_of_lading"("bl_no");

-- CreateIndex
CREATE INDEX "bills_of_lading_bl_no_idx" ON "bills_of_lading"("bl_no");

-- CreateIndex
CREATE INDEX "bills_of_lading_lc_id_idx" ON "bills_of_lading"("lc_id");

-- CreateIndex
CREATE UNIQUE INDEX "bl_items_bl_id_line_no_key" ON "bl_items"("bl_id", "line_no");

-- CreateIndex
CREATE UNIQUE INDEX "vessels_name_key" ON "vessels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vessels_imo_no_key" ON "vessels"("imo_no");

-- CreateIndex
CREATE INDEX "vessels_name_idx" ON "vessels"("name");

-- CreateIndex
CREATE INDEX "vessels_imo_no_idx" ON "vessels"("imo_no");

-- CreateIndex
CREATE INDEX "vessels_is_mother_vessel_idx" ON "vessels"("is_mother_vessel");

-- CreateIndex
CREATE UNIQUE INDEX "vessel_calls_call_no_key" ON "vessel_calls"("call_no");

-- CreateIndex
CREATE INDEX "vessel_calls_status_idx" ON "vessel_calls"("status");

-- CreateIndex
CREATE INDEX "vessel_calls_vessel_id_idx" ON "vessel_calls"("vessel_id");

-- CreateIndex
CREATE INDEX "vessel_calls_eta_idx" ON "vessel_calls"("eta");

-- CreateIndex
CREATE INDEX "vessel_calls_call_no_idx" ON "vessel_calls"("call_no");

-- CreateIndex
CREATE INDEX "vessel_calls_cnf_id_stevedore_id_idx" ON "vessel_calls"("cnf_id", "stevedore_id");

-- CreateIndex
CREATE INDEX "vessel_calls_total_stages_completed_stages_idx" ON "vessel_calls"("total_stages", "completed_stages");

-- CreateIndex
CREATE UNIQUE INDEX "vessel_cargo_lines_vessel_call_id_line_no_key" ON "vessel_cargo_lines"("vessel_call_id", "line_no");

-- CreateIndex
CREATE UNIQUE INDEX "vessel_cargo_lines_vessel_call_id_lc_item_id_key" ON "vessel_cargo_lines"("vessel_call_id", "lc_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "vessel_cargo_lines_vessel_call_id_bl_item_id_key" ON "vessel_cargo_lines"("vessel_call_id", "bl_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "carriers_code_key" ON "carriers"("code");

-- CreateIndex
CREATE INDEX "carriers_organization_id_idx" ON "carriers"("organization_id");

-- CreateIndex
CREATE INDEX "carriers_isActive_idx" ON "carriers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "lighters_registration_no_key" ON "lighters"("registration_no");

-- CreateIndex
CREATE INDEX "lighters_carrier_id_idx" ON "lighters"("carrier_id");

-- CreateIndex
CREATE INDEX "lighters_registration_no_idx" ON "lighters"("registration_no");

-- CreateIndex
CREATE INDEX "lighters_isActive_idx" ON "lighters"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "lighter_assignments_assignment_no_key" ON "lighter_assignments"("assignment_no");

-- CreateIndex
CREATE INDEX "lighter_assignments_vessel_call_id_idx" ON "lighter_assignments"("vessel_call_id");

-- CreateIndex
CREATE INDEX "lighter_assignments_lc_release_id_idx" ON "lighter_assignments"("lc_release_id");

-- CreateIndex
CREATE INDEX "lighter_assignments_carrier_id_idx" ON "lighter_assignments"("carrier_id");

-- CreateIndex
CREATE INDEX "lighter_assignments_lighter_id_idx" ON "lighter_assignments"("lighter_id");

-- CreateIndex
CREATE INDEX "lighter_assignments_status_assigned_date_idx" ON "lighter_assignments"("status", "assigned_date");

-- CreateIndex
CREATE INDEX "lighter_assignments_vessel_call_id_status_idx" ON "lighter_assignments"("vessel_call_id", "status");

-- CreateIndex
CREATE INDEX "lighter_assignments_destination_ghat_id_status_idx" ON "lighter_assignments"("destination_ghat_id", "status");

-- CreateIndex
CREATE INDEX "lighter_assignments_deleted_at_idx" ON "lighter_assignments"("deleted_at");

-- CreateIndex
CREATE INDEX "lighter_assignments_discharge_stage_idx" ON "lighter_assignments"("discharge_stage");

-- CreateIndex
CREATE UNIQUE INDEX "statements_of_fact_sof_no_key" ON "statements_of_fact"("sof_no");

-- CreateIndex
CREATE UNIQUE INDEX "statements_of_fact_vessel_call_id_key" ON "statements_of_fact"("vessel_call_id");

-- CreateIndex
CREATE UNIQUE INDEX "statements_of_fact_lighter_trip_id_key" ON "statements_of_fact"("lighter_trip_id");

-- CreateIndex
CREATE INDEX "statements_of_fact_sof_no_idx" ON "statements_of_fact"("sof_no");

-- CreateIndex
CREATE INDEX "statements_of_fact_vessel_call_id_idx" ON "statements_of_fact"("vessel_call_id");

-- CreateIndex
CREATE INDEX "statements_of_fact_lighter_trip_id_idx" ON "statements_of_fact"("lighter_trip_id");

-- CreateIndex
CREATE INDEX "statements_of_fact_scope_status_idx" ON "statements_of_fact"("scope", "status");

-- CreateIndex
CREATE INDEX "statements_of_fact_status_idx" ON "statements_of_fact"("status");

-- CreateIndex
CREATE INDEX "sof_events_statement_id_idx" ON "sof_events"("statement_id");

-- CreateIndex
CREATE INDEX "sof_events_event_type_idx" ON "sof_events"("event_type");

-- CreateIndex
CREATE INDEX "sof_events_event_time_idx" ON "sof_events"("event_time");

-- CreateIndex
CREATE INDEX "sof_events_is_hold_idx" ON "sof_events"("is_hold");

-- CreateIndex
CREATE INDEX "mother_vessel_daily_discharges_report_date_idx" ON "mother_vessel_daily_discharges"("report_date");

-- CreateIndex
CREATE INDEX "mother_vessel_daily_discharges_entered_by_id_idx" ON "mother_vessel_daily_discharges"("entered_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "mother_vessel_daily_discharges_vessel_call_id_report_date_key" ON "mother_vessel_daily_discharges"("vessel_call_id", "report_date");

-- CreateIndex
CREATE INDEX "sof_hourly_statuses_daily_discharge_id_idx" ON "sof_hourly_statuses"("daily_discharge_id");

-- CreateIndex
CREATE INDEX "sof_hourly_statuses_lighter_trip_id_idx" ON "sof_hourly_statuses"("lighter_trip_id");

-- CreateIndex
CREATE INDEX "sof_hourly_statuses_hour_start_at_idx" ON "sof_hourly_statuses"("hour_start_at");

-- CreateIndex
CREATE INDEX "sof_hourly_statuses_event_type_idx" ON "sof_hourly_statuses"("event_type");

-- CreateIndex
CREATE UNIQUE INDEX "sof_hourly_statuses_statement_id_hour_start_at_key" ON "sof_hourly_statuses"("statement_id", "hour_start_at");

-- CreateIndex
CREATE UNIQUE INDEX "lighter_trips_trip_no_key" ON "lighter_trips"("trip_no");

-- CreateIndex
CREATE UNIQUE INDEX "lighter_trips_lighter_assignment_id_key" ON "lighter_trips"("lighter_assignment_id");

-- CreateIndex
CREATE INDEX "lighter_trips_vessel_call_id_idx" ON "lighter_trips"("vessel_call_id");

-- CreateIndex
CREATE INDEX "lighter_trips_lighter_vessel_id_idx" ON "lighter_trips"("lighter_vessel_id");

-- CreateIndex
CREATE INDEX "lighter_trips_status_created_at_idx" ON "lighter_trips"("status", "created_at");

-- CreateIndex
CREATE INDEX "lighter_trips_trip_no_idx" ON "lighter_trips"("trip_no");

-- CreateIndex
CREATE INDEX "lighter_trips_deleted_at_idx" ON "lighter_trips"("deleted_at");

-- CreateIndex
CREATE INDEX "lighter_trips_payment_status_idx" ON "lighter_trips"("payment_status");

-- CreateIndex
CREATE INDEX "lighter_trip_cargoes_lc_release_id_idx" ON "lighter_trip_cargoes"("lc_release_id");

-- CreateIndex
CREATE UNIQUE INDEX "lighter_trip_cargoes_trip_id_product_id_key" ON "lighter_trip_cargoes"("trip_id", "product_id");

-- CreateIndex
CREATE INDEX "lighter_trip_events_trip_id_idx" ON "lighter_trip_events"("trip_id");

-- CreateIndex
CREATE INDEX "lighter_trip_events_event_time_idx" ON "lighter_trip_events"("event_time");

-- CreateIndex
CREATE UNIQUE INDEX "ghat_unloadings_assignment_id_key" ON "ghat_unloadings"("assignment_id");

-- CreateIndex
CREATE INDEX "ghat_unloadings_ghat_id_idx" ON "ghat_unloadings"("ghat_id");

-- CreateIndex
CREATE INDEX "ghat_unloadings_started_at_idx" ON "ghat_unloadings"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "trucks_reg_no_key" ON "trucks"("reg_no");

-- CreateIndex
CREATE INDEX "trucks_owner_org_id_idx" ON "trucks"("owner_org_id");

-- CreateIndex
CREATE INDEX "trucks_reg_no_idx" ON "trucks"("reg_no");

-- CreateIndex
CREATE INDEX "truck_loads_unloading_id_idx" ON "truck_loads"("unloading_id");

-- CreateIndex
CREATE INDEX "truck_loads_source_type_idx" ON "truck_loads"("source_type");

-- CreateIndex
CREATE INDEX "truck_loads_silo_receipt_id_idx" ON "truck_loads"("silo_receipt_id");

-- CreateIndex
CREATE INDEX "truck_loads_truck_id_idx" ON "truck_loads"("truck_id");

-- CreateIndex
CREATE INDEX "truck_loads_product_id_idx" ON "truck_loads"("product_id");

-- CreateIndex
CREATE INDEX "truck_loads_destination_id_idx" ON "truck_loads"("destination_id");

-- CreateIndex
CREATE INDEX "truck_loads_warehouse_id_idx" ON "truck_loads"("warehouse_id");

-- CreateIndex
CREATE INDEX "truck_loads_status_idx" ON "truck_loads"("status");

-- CreateIndex
CREATE INDEX "truck_loads_dispatched_at_idx" ON "truck_loads"("dispatched_at");

-- CreateIndex
CREATE UNIQUE INDEX "silo_receipts_receipt_no_key" ON "silo_receipts"("receipt_no");

-- CreateIndex
CREATE INDEX "silo_receipts_receipt_no_idx" ON "silo_receipts"("receipt_no");

-- CreateIndex
CREATE INDEX "silo_receipts_silo_id_idx" ON "silo_receipts"("silo_id");

-- CreateIndex
CREATE INDEX "silo_receipts_received_at_idx" ON "silo_receipts"("received_at");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_movement_no_key" ON "stock_movements"("movement_no");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_movement_at_idx" ON "stock_movements"("product_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_vessel_call_id_idx" ON "stock_movements"("vessel_call_id");

-- CreateIndex
CREATE INDEX "stock_movements_lighter_trip_id_idx" ON "stock_movements"("lighter_trip_id");

-- CreateIndex
CREATE INDEX "stock_movements_truck_load_id_idx" ON "stock_movements"("truck_load_id");

-- CreateIndex
CREATE INDEX "stock_movements_movement_type_idx" ON "stock_movements"("movement_type");

-- CreateIndex
CREATE INDEX "stock_movements_from_location_type_to_location_type_idx" ON "stock_movements"("from_location_type", "to_location_type");

-- CreateIndex
CREATE INDEX "lc_releases_lc_id_vessel_call_id_idx" ON "lc_releases"("lc_id", "vessel_call_id");

-- CreateIndex
CREATE INDEX "lc_releases_status_idx" ON "lc_releases"("status");

-- CreateIndex
CREATE INDEX "lc_releases_released_by_id_idx" ON "lc_releases"("released_by_id");

-- CreateIndex
CREATE INDEX "lc_releases_approved_by_id_idx" ON "lc_releases"("approved_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "unloading_operations_trip_id_key" ON "unloading_operations"("trip_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anchorages" ADD CONSTRAINT "anchorages_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghats" ADD CONSTRAINT "ghats_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silos" ADD CONSTRAINT "silos_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_contracts" ADD CONSTRAINT "import_contracts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_contracts" ADD CONSTRAINT "import_contracts_buyer_organization_id_fkey" FOREIGN KEY ("buyer_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_contract_lines" ADD CONSTRAINT "import_contract_lines_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "import_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_contract_lines" ADD CONSTRAINT "import_contract_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proforma_invoices" ADD CONSTRAINT "proforma_invoices_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proforma_invoices" ADD CONSTRAINT "proforma_invoices_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proforma_invoices" ADD CONSTRAINT "proforma_invoices_modified_by_id_fkey" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pi_items" ADD CONSTRAINT "pi_items_pi_id_fkey" FOREIGN KEY ("pi_id") REFERENCES "proforma_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pi_items" ADD CONSTRAINT "pi_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_pi_id_fkey" FOREIGN KEY ("pi_id") REFERENCES "proforma_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_party_id_fkey" FOREIGN KEY ("party_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_indentor_id_fkey" FOREIGN KEY ("indentor_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_cnf_id_fkey" FOREIGN KEY ("cnf_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_insurer_id_fkey" FOREIGN KEY ("insurer_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_modified_by_id_fkey" FOREIGN KEY ("modified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_items" ADD CONSTRAINT "lc_items_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_items" ADD CONSTRAINT "lc_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_amendments" ADD CONSTRAINT "lc_amendments_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_amendments" ADD CONSTRAINT "lc_amendments_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_amendments" ADD CONSTRAINT "lc_amendments_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills_of_lading" ADD CONSTRAINT "bills_of_lading_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_items" ADD CONSTRAINT "bl_items_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bl_items" ADD CONSTRAINT "bl_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_vessel_id_fkey" FOREIGN KEY ("vessel_id") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_import_contract_id_fkey" FOREIGN KEY ("import_contract_id") REFERENCES "import_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_arrival_location_id_fkey" FOREIGN KEY ("arrival_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_shipping_agent_id_fkey" FOREIGN KEY ("shipping_agent_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_stevedore_id_fkey" FOREIGN KEY ("stevedore_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_cnf_id_fkey" FOREIGN KEY ("cnf_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_calls" ADD CONSTRAINT "vessel_calls_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_cargo_lines" ADD CONSTRAINT "vessel_cargo_lines_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_cargo_lines" ADD CONSTRAINT "vessel_cargo_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_cargo_lines" ADD CONSTRAINT "vessel_cargo_lines_lc_item_id_fkey" FOREIGN KEY ("lc_item_id") REFERENCES "lc_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_cargo_lines" ADD CONSTRAINT "vessel_cargo_lines_bl_item_id_fkey" FOREIGN KEY ("bl_item_id") REFERENCES "bl_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carriers" ADD CONSTRAINT "carriers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighters" ADD CONSTRAINT "lighters_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_assignments" ADD CONSTRAINT "lighter_assignments_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_assignments" ADD CONSTRAINT "lighter_assignments_lighter_id_fkey" FOREIGN KEY ("lighter_id") REFERENCES "lighters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_assignments" ADD CONSTRAINT "lighter_assignments_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_assignments" ADD CONSTRAINT "lighter_assignments_lc_release_id_fkey" FOREIGN KEY ("lc_release_id") REFERENCES "lc_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_assignments" ADD CONSTRAINT "lighter_assignments_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_assignments" ADD CONSTRAINT "lighter_assignments_destination_ghat_id_fkey" FOREIGN KEY ("destination_ghat_id") REFERENCES "ghats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_assignments" ADD CONSTRAINT "lighter_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statements_of_fact" ADD CONSTRAINT "statements_of_fact_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statements_of_fact" ADD CONSTRAINT "statements_of_fact_lighter_trip_id_fkey" FOREIGN KEY ("lighter_trip_id") REFERENCES "lighter_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statements_of_fact" ADD CONSTRAINT "statements_of_fact_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sof_events" ADD CONSTRAINT "sof_events_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "statements_of_fact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sof_events" ADD CONSTRAINT "sof_events_anchorage_id_fkey" FOREIGN KEY ("anchorage_id") REFERENCES "anchorages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sof_events" ADD CONSTRAINT "sof_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sof_events" ADD CONSTRAINT "sof_events_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mother_vessel_daily_discharges" ADD CONSTRAINT "mother_vessel_daily_discharges_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mother_vessel_daily_discharges" ADD CONSTRAINT "mother_vessel_daily_discharges_entered_by_id_fkey" FOREIGN KEY ("entered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sof_hourly_statuses" ADD CONSTRAINT "sof_hourly_statuses_statement_id_fkey" FOREIGN KEY ("statement_id") REFERENCES "statements_of_fact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sof_hourly_statuses" ADD CONSTRAINT "sof_hourly_statuses_daily_discharge_id_fkey" FOREIGN KEY ("daily_discharge_id") REFERENCES "mother_vessel_daily_discharges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sof_hourly_statuses" ADD CONSTRAINT "sof_hourly_statuses_lighter_trip_id_fkey" FOREIGN KEY ("lighter_trip_id") REFERENCES "lighter_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sof_hourly_statuses" ADD CONSTRAINT "sof_hourly_statuses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_trips" ADD CONSTRAINT "lighter_trips_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_trips" ADD CONSTRAINT "lighter_trips_lighter_assignment_id_fkey" FOREIGN KEY ("lighter_assignment_id") REFERENCES "lighter_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_trips" ADD CONSTRAINT "lighter_trips_lighter_vessel_id_fkey" FOREIGN KEY ("lighter_vessel_id") REFERENCES "vessels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_trips" ADD CONSTRAINT "lighter_trips_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_trips" ADD CONSTRAINT "lighter_trips_return_location_id_fkey" FOREIGN KEY ("return_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_trip_cargoes" ADD CONSTRAINT "lighter_trip_cargoes_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "lighter_trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_trip_cargoes" ADD CONSTRAINT "lighter_trip_cargoes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_trip_cargoes" ADD CONSTRAINT "lighter_trip_cargoes_lc_release_id_fkey" FOREIGN KEY ("lc_release_id") REFERENCES "lc_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_trip_events" ADD CONSTRAINT "lighter_trip_events_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "lighter_trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghat_unloadings" ADD CONSTRAINT "ghat_unloadings_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "lighter_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghat_unloadings" ADD CONSTRAINT "ghat_unloadings_ghat_id_fkey" FOREIGN KEY ("ghat_id") REFERENCES "ghats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghat_unloadings" ADD CONSTRAINT "ghat_unloadings_customer_warehouse_id_fkey" FOREIGN KEY ("customer_warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_owner_org_id_fkey" FOREIGN KEY ("owner_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "truck_loads" ADD CONSTRAINT "truck_loads_unloading_id_fkey" FOREIGN KEY ("unloading_id") REFERENCES "ghat_unloadings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "truck_loads" ADD CONSTRAINT "truck_loads_silo_receipt_id_fkey" FOREIGN KEY ("silo_receipt_id") REFERENCES "silo_receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "truck_loads" ADD CONSTRAINT "truck_loads_truck_id_fkey" FOREIGN KEY ("truck_id") REFERENCES "trucks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "truck_loads" ADD CONSTRAINT "truck_loads_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "truck_loads" ADD CONSTRAINT "truck_loads_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "truck_loads" ADD CONSTRAINT "truck_loads_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silo_receipts" ADD CONSTRAINT "silo_receipts_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "lighter_trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silo_receipts" ADD CONSTRAINT "silo_receipts_silo_id_fkey" FOREIGN KEY ("silo_id") REFERENCES "silos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "silo_receipts" ADD CONSTRAINT "silo_receipts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_lc_release_id_fkey" FOREIGN KEY ("lc_release_id") REFERENCES "lc_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_lighter_assignment_id_fkey" FOREIGN KEY ("lighter_assignment_id") REFERENCES "lighter_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_lighter_trip_id_fkey" FOREIGN KEY ("lighter_trip_id") REFERENCES "lighter_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_ghat_unloading_id_fkey" FOREIGN KEY ("ghat_unloading_id") REFERENCES "ghat_unloadings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_silo_receipt_id_fkey" FOREIGN KEY ("silo_receipt_id") REFERENCES "silo_receipts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_truck_load_id_fkey" FOREIGN KEY ("truck_load_id") REFERENCES "truck_loads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_from_vessel_id_fkey" FOREIGN KEY ("from_vessel_id") REFERENCES "vessels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_to_lighter_id_fkey" FOREIGN KEY ("to_lighter_id") REFERENCES "lighters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_ghat_id_fkey" FOREIGN KEY ("ghat_id") REFERENCES "ghats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_silo_id_fkey" FOREIGN KEY ("silo_id") REFERENCES "silos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_releases" ADD CONSTRAINT "lc_releases_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_releases" ADD CONSTRAINT "lc_releases_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_releases" ADD CONSTRAINT "lc_releases_released_by_id_fkey" FOREIGN KEY ("released_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_releases" ADD CONSTRAINT "lc_releases_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unloading_operations" ADD CONSTRAINT "unloading_operations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "lighter_trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unloading_lines" ADD CONSTRAINT "unloading_lines_unloading_id_fkey" FOREIGN KEY ("unloading_id") REFERENCES "unloading_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unloading_lines" ADD CONSTRAINT "unloading_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
