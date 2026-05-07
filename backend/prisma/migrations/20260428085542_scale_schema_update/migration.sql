/*
  Warnings:

  - You are about to drop the column `entry_time` on the `bills_of_lading` table. All the data in the column will be lost.
  - You are about to drop the column `ship_date` on the `bills_of_lading` table. All the data in the column will be lost.
  - You are about to drop the column `demurrage_rate_per_day` on the `import_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `dispatch_rate_per_day` on the `import_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `laytime_allowed_hours` on the `import_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `tolerance_max_pct` on the `import_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `tolerance_min_pct` on the `import_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `total_contract_weight_ton` on the `import_contracts` table. All the data in the column will be lost.
  - You are about to drop the column `bank_id` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `bank_name` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `book_currency` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `book_rate` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `book_value` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `cnf_id` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `commission_expense` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `commission_rate` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `conversion_rate` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `country_of_origin` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `difference_expense` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `effective_ledger_name` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `indentor_id` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `insurer_id` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `lc_curr_rate` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `lc_expiry_date` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `lc_open_date` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `lc_ship_date` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `party_id` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `policy_no` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `value_in` on the `letters_of_credit` table. All the data in the column will be lost.
  - You are about to drop the column `driver_name` on the `lighter_trips` table. All the data in the column will be lost.
  - You are about to drop the column `driver_phone` on the `lighter_trips` table. All the data in the column will be lost.
  - You are about to drop the column `contactNo` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `contactPerson` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `party_id` on the `proforma_invoices` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `proforma_invoices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vessel_call_id]` on the table `bills_of_lading` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[draft_survey_id]` on the table `lighter_trips` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `commodity_description` to the `bills_of_lading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `port_of_discharge` to the `bills_of_lading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `port_of_loading` to the `bills_of_lading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipper_name` to the `bills_of_lading` table without a default value. This is not possible if the table is not empty.
  - Made the column `bl_date` on table `bills_of_lading` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vessel_name` on table `bills_of_lading` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ProcurementRequestStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'SOURCING', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NegotiationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'AGREED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('DRAFT', 'APPLIED', 'PENDING', 'ISSUED', 'COLLECTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RegulatoryDocumentType" AS ENUM ('IMPORT_PERMIT', 'NOC', 'QUARANTINE_CLEARANCE', 'PORT_CLEARANCE', 'CUSTOMS_CLEARANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "LcApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'BANK_QUERY', 'SANCTIONED', 'REJECTED', 'LC_OPENED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NorStatus" AS ENUM ('TENDERED', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VesselShiftReason" AS ENUM ('DRAFT_IMPROVED', 'PORT_INSTRUCTION', 'WEATHER', 'TRAFFIC', 'OPERATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ScoutType" AS ENUM ('SURVEYOR', 'IMPORTER', 'OWN_COMPANY');

-- AlterEnum
ALTER TYPE "AppRole" ADD VALUE 'SURVEYOR';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LighterTripStatus" ADD VALUE 'DRAFT_SURVEY_STAGING';
ALTER TYPE "LighterTripStatus" ADD VALUE 'DRAFT_SURVEY_IN_PROGRESS';
ALTER TYPE "LighterTripStatus" ADD VALUE 'DRAFT_SURVEY_COMPLETED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrganizationType" ADD VALUE 'LABOUR';
ALTER TYPE "OrganizationType" ADD VALUE 'SURVEYOR';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SOFEventType" ADD VALUE 'NOR_ACCEPTED';
ALTER TYPE "SOFEventType" ADD VALUE 'LC_HOLD';

-- AlterEnum
ALTER TYPE "WeightSource" ADD VALUE 'BILL_OF_LADING';

-- DropForeignKey
ALTER TABLE "letters_of_credit" DROP CONSTRAINT "letters_of_credit_bank_id_fkey";

-- DropForeignKey
ALTER TABLE "letters_of_credit" DROP CONSTRAINT "letters_of_credit_cnf_id_fkey";

-- DropForeignKey
ALTER TABLE "letters_of_credit" DROP CONSTRAINT "letters_of_credit_indentor_id_fkey";

-- DropForeignKey
ALTER TABLE "letters_of_credit" DROP CONSTRAINT "letters_of_credit_insurer_id_fkey";

-- DropForeignKey
ALTER TABLE "letters_of_credit" DROP CONSTRAINT "letters_of_credit_party_id_fkey";

-- DropForeignKey
ALTER TABLE "proforma_invoices" DROP CONSTRAINT "proforma_invoices_party_id_fkey";

-- DropIndex
DROP INDEX "bills_of_lading_lc_id_idx";

-- DropIndex
DROP INDEX "lc_releases_approved_by_id_idx";

-- DropIndex
DROP INDEX "lc_releases_released_by_id_idx";

-- DropIndex
DROP INDEX "letters_of_credit_lc_open_date_lc_status_idx";

-- DropIndex
DROP INDEX "letters_of_credit_party_id_lc_expiry_date_idx";

-- DropIndex
DROP INDEX "vessel_calls_cnf_id_stevedore_id_idx";

-- DropIndex
DROP INDEX "vessel_calls_total_stages_completed_stages_idx";

-- AlterTable
ALTER TABLE "bills_of_lading" DROP COLUMN "entry_time",
DROP COLUMN "ship_date",
ADD COLUMN     "aes_post" TEXT,
ADD COLUMN     "agent_name" TEXT,
ADD COLUMN     "agent_signature" TEXT,
ADD COLUMN     "applicant_address" TEXT,
ADD COLUMN     "applicant_id" TEXT,
ADD COLUMN     "applicant_irc" TEXT,
ADD COLUMN     "applicant_name" TEXT,
ADD COLUMN     "applicant_tin" TEXT,
ADD COLUMN     "charter_party_date" TIMESTAMP(3),
ADD COLUMN     "charter_party_ref" TEXT,
ADD COLUMN     "commodity_description" TEXT NOT NULL,
ADD COLUMN     "consignee" TEXT NOT NULL DEFAULT 'TO ORDER',
ADD COLUMN     "date_of_issue" TIMESTAMP(3),
ADD COLUMN     "edition" TEXT DEFAULT 'NORTH AMERICAN GRAIN BILL OF LADING',
ADD COLUMN     "export_regulations_text" TEXT,
ADD COLUMN     "freight_payable_as_per" TEXT DEFAULT 'CHARTER PARTY',
ADD COLUMN     "gross_weight_lbs" DECIMAL(18,0),
ADD COLUMN     "gross_weight_mt" DECIMAL(18,3),
ADD COLUMN     "hs_code" TEXT,
ADD COLUMN     "issuing_bank_address" TEXT,
ADD COLUMN     "issuing_bank_name" TEXT,
ADD COLUMN     "lc_date" TIMESTAMP(3),
ADD COLUMN     "lc_number" TEXT,
ADD COLUMN     "master_name" TEXT,
ADD COLUMN     "master_signature" TEXT,
ADD COLUMN     "net_weight_mt" DECIMAL(18,3),
ADD COLUMN     "notify_party_address" TEXT,
ADD COLUMN     "notify_party_id" TEXT,
ADD COLUMN     "notify_party_name" TEXT,
ADD COLUMN     "number_of_original_bls" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "packing" TEXT NOT NULL DEFAULT 'IN BULK',
ADD COLUMN     "place_of_issue" TEXT,
ADD COLUMN     "port_of_discharge" TEXT NOT NULL,
ADD COLUMN     "port_of_loading" TEXT NOT NULL,
ADD COLUMN     "seal_numbers" JSONB,
ADD COLUMN     "set_no" TEXT,
ADD COLUMN     "shipped_on_board_date" TIMESTAMP(3),
ADD COLUMN     "shipped_on_board_location" TEXT,
ADD COLUMN     "shipper_address" TEXT,
ADD COLUMN     "shipper_id" TEXT,
ADD COLUMN     "shipper_name" TEXT NOT NULL,
ADD COLUMN     "stowage_holds" TEXT,
ADD COLUMN     "vat_registration_number" TEXT,
ADD COLUMN     "vessel_call_id" TEXT,
ADD COLUMN     "vessel_prefix" TEXT DEFAULT 'MV',
ALTER COLUMN "bl_date" SET NOT NULL,
ALTER COLUMN "vessel_name" SET NOT NULL;

-- AlterTable
ALTER TABLE "import_contracts" DROP COLUMN "demurrage_rate_per_day",
DROP COLUMN "dispatch_rate_per_day",
DROP COLUMN "laytime_allowed_hours",
DROP COLUMN "tolerance_max_pct",
DROP COLUMN "tolerance_min_pct",
DROP COLUMN "total_contract_weight_ton",
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_id" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "discharge_port" TEXT,
ADD COLUMN     "discharge_rate_mt_per_day" DECIMAL(18,2),
ADD COLUMN     "discharge_rate_unit" TEXT DEFAULT 'WEATHER WORKING DAY OF 24 CONSECUTIVE HOURS',
ADD COLUMN     "excluded_days" TEXT[] DEFAULT ARRAY['FRIDAY', 'SATURDAY']::TEXT[],
ADD COLUMN     "excluded_time_period" TEXT,
ADD COLUMN     "holidays_excluded" BOOLEAN DEFAULT true,
ADD COLUMN     "lc_establish_by_date" TIMESTAMP(3),
ADD COLUMN     "price_per_mt" DECIMAL(18,4),
ADD COLUMN     "safe_anchorages_count" INTEGER DEFAULT 2,
ADD COLUMN     "safe_ports_count" INTEGER DEFAULT 1,
ADD COLUMN     "sent_to_supplier_at" TIMESTAMP(3),
ADD COLUMN     "shipment_from_date" TIMESTAMP(3),
ADD COLUMN     "shipment_to_date" TIMESTAMP(3),
ADD COLUMN     "submitted_by_supplier_at" TIMESTAMP(3),
ADD COLUMN     "supplier_acknowledged_at" TIMESTAMP(3),
ADD COLUMN     "tolerance_percent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "letters_of_credit" DROP COLUMN "bank_id",
DROP COLUMN "bank_name",
DROP COLUMN "book_currency",
DROP COLUMN "book_rate",
DROP COLUMN "book_value",
DROP COLUMN "cnf_id",
DROP COLUMN "commission_expense",
DROP COLUMN "commission_rate",
DROP COLUMN "conversion_rate",
DROP COLUMN "country_of_origin",
DROP COLUMN "difference_expense",
DROP COLUMN "effective_ledger_name",
DROP COLUMN "indentor_id",
DROP COLUMN "insurer_id",
DROP COLUMN "lc_curr_rate",
DROP COLUMN "lc_expiry_date",
DROP COLUMN "lc_open_date",
DROP COLUMN "lc_ship_date",
DROP COLUMN "party_id",
DROP COLUMN "policy_no",
DROP COLUMN "value_in",
ADD COLUMN     "applicable_rules" TEXT DEFAULT 'UCP LATEST VERSION',
ADD COLUMN     "applicant_bin" TEXT,
ADD COLUMN     "applicant_id" TEXT,
ADD COLUMN     "applicant_tin" TEXT,
ADD COLUMN     "available_by" TEXT DEFAULT 'BY NEGOTIATION',
ADD COLUMN     "available_with" TEXT,
ADD COLUMN     "bank_charges_outside_bd" TEXT,
ADD COLUMN     "bank_credit_limit_id" TEXT,
ADD COLUMN     "beneficiary_id" TEXT,
ADD COLUMN     "charter_party_bl_allowed" BOOLEAN DEFAULT true,
ADD COLUMN     "commodity_description" TEXT,
ADD COLUMN     "commodity_specification" TEXT,
ADD COLUMN     "confirmation_instructions" TEXT DEFAULT 'WITHOUT',
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "discrepancy_fee" DECIMAL(10,2) DEFAULT 100.00,
ADD COLUMN     "docs_processing_fee" DECIMAL(10,2) DEFAULT 50.00,
ADD COLUMN     "drafts_at" TEXT DEFAULT 'SIGHT',
ADD COLUMN     "drawee_id" TEXT,
ADD COLUMN     "expiry_date" TIMESTAMP(3),
ADD COLUMN     "expiry_place" TEXT DEFAULT 'SINGAPORE',
ADD COLUMN     "fob_value" DECIMAL(18,2),
ADD COLUMN     "freight_charge" DECIMAL(18,2),
ADD COLUMN     "geared_vessel_required" BOOLEAN DEFAULT true,
ADD COLUMN     "hs_code" TEXT,
ADD COLUMN     "incoterm" TEXT DEFAULT 'CFR',
ADD COLUMN     "incoterm_location" TEXT,
ADD COLUMN     "incoterm_version" TEXT DEFAULT '2020',
ADD COLUMN     "insurance_covered_by" TEXT DEFAULT 'APPLICANT',
ADD COLUMN     "irc_no" TEXT,
ADD COLUMN     "issuing_bank_address" TEXT,
ADD COLUMN     "issuing_bank_id" TEXT,
ADD COLUMN     "issuing_bank_swift" TEXT,
ADD COLUMN     "latest_shipment_date" TIMESTAMP(3),
ADD COLUMN     "lc_date" TIMESTAMP(3),
ADD COLUMN     "lc_type" TEXT DEFAULT 'IRREVOCABLE',
ADD COLUMN     "misspelling_acceptable" BOOLEAN DEFAULT true,
ADD COLUMN     "partial_shipments" BOOLEAN DEFAULT true,
ADD COLUMN     "port_of_discharge" TEXT,
ADD COLUMN     "port_of_loading" TEXT,
ADD COLUMN     "presentation_days" INTEGER DEFAULT 30,
ADD COLUMN     "proforma_invoice_date" TIMESTAMP(3),
ADD COLUMN     "proforma_invoice_no" TEXT,
ADD COLUMN     "quantity_mt" DECIMAL(18,3),
ADD COLUMN     "sequence_total" TEXT,
ADD COLUMN     "shipment_before_lc_date_acceptable" BOOLEAN DEFAULT true,
ADD COLUMN     "third_party_docs_acceptable_except_invoice" BOOLEAN DEFAULT true,
ADD COLUMN     "tolerance_percent" DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN     "transhipment" BOOLEAN DEFAULT true,
ADD COLUMN     "unit_price" DECIMAL(18,4),
ADD COLUMN     "vessel_max_age_years" INTEGER DEFAULT 25;

-- AlterTable
ALTER TABLE "lighter_trips" DROP COLUMN "driver_name",
DROP COLUMN "driver_phone",
ADD COLUMN     "alongside_date" TIMESTAMP(3),
ADD COLUMN     "arrived_ghat_date" TIMESTAMP(3),
ADD COLUMN     "assistant_name" TEXT,
ADD COLUMN     "assistant_phone" TEXT,
ADD COLUMN     "departed_mv_date" TIMESTAMP(3),
ADD COLUMN     "draft_survey_id" TEXT,
ADD COLUMN     "draft_survey_status" TEXT,
ADD COLUMN     "draft_survey_weight_mt" DECIMAL(18,3),
ADD COLUMN     "has_importer_scout" BOOLEAN DEFAULT false,
ADD COLUMN     "has_surveyor_scout" BOOLEAN DEFAULT false,
ADD COLUMN     "importer_scout_boarded_at" TIMESTAMP(3),
ADD COLUMN     "master_license_no" TEXT,
ADD COLUMN     "master_name" TEXT,
ADD COLUMN     "master_phone" TEXT,
ADD COLUMN     "number_of_crew" INTEGER DEFAULT 2,
ADD COLUMN     "surveyor_scout_boarded_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "contactNo",
DROP COLUMN "contactPerson",
ADD COLUMN     "contact_no" TEXT,
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "manager_email" TEXT,
ADD COLUMN     "manager_name" TEXT,
ADD COLUMN     "manager_phone" TEXT,
ADD COLUMN     "owner_email" TEXT,
ADD COLUMN     "owner_name" TEXT,
ADD COLUMN     "owner_phone" TEXT;

-- AlterTable
ALTER TABLE "proforma_invoices" DROP COLUMN "party_id",
DROP COLUMN "remarks",
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_id" TEXT,
ADD COLUMN     "beneficiary_bank_address" TEXT,
ADD COLUMN     "beneficiary_bank_name" TEXT,
ADD COLUMN     "beneficiary_bank_swift" TEXT,
ADD COLUMN     "buyer_id" TEXT,
ADD COLUMN     "consignee" TEXT DEFAULT 'To Order',
ADD COLUMN     "contract_date" TIMESTAMP(3),
ADD COLUMN     "contract_no" TEXT,
ADD COLUMN     "country_of_destination" TEXT,
ADD COLUMN     "country_of_origin" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "delivery_terms" TEXT,
ADD COLUMN     "delivery_terms_details" TEXT,
ADD COLUMN     "final_destination" TEXT,
ADD COLUMN     "fob_value" DECIMAL(18,2),
ADD COLUMN     "freight_value" DECIMAL(18,2),
ADD COLUMN     "hs_code" TEXT,
ADD COLUMN     "marks_and_nos" TEXT DEFAULT 'NIL',
ADD COLUMN     "packing" TEXT DEFAULT 'IN BULK',
ADD COLUMN     "payment_terms" TEXT,
ADD COLUMN     "port_of_discharge" TEXT,
ADD COLUMN     "port_of_loading" TEXT,
ADD COLUMN     "product_description" TEXT,
ADD COLUMN     "quantity_mt" DECIMAL(18,3),
ADD COLUMN     "rate_per_mt" DECIMAL(18,4),
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "seller_id" TEXT,
ADD COLUMN     "shipment_deadline" TIMESTAMP(3),
ADD COLUMN     "spec_aflaxon_ppb" INTEGER,
ADD COLUMN     "spec_broken_pct" DECIMAL(5,2),
ADD COLUMN     "spec_foreign_matter_pct" DECIMAL(5,2),
ADD COLUMN     "spec_moisture_pct" DECIMAL(5,2),
ADD COLUMN     "spec_total_damage_pct" DECIMAL(5,2),
ADD COLUMN     "tolerance_option" TEXT DEFAULT 'SELLER''S OPTION',
ADD COLUMN     "tolerance_percent" DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN     "total_value" DECIMAL(18,2),
ADD COLUMN     "total_value_in_words" TEXT,
ADD COLUMN     "validity_date" TIMESTAMP(3),
ADD COLUMN     "vessel_terms" TEXT DEFAULT 'By Sea';

-- AlterTable
ALTER TABLE "vessel_calls" ADD COLUMN     "current_anchorage" TEXT,
ADD COLUMN     "customs_clearance_date" TIMESTAMP(3),
ADD COLUMN     "igm_date" TIMESTAMP(3),
ADD COLUMN     "is_alongside" BOOLEAN DEFAULT false,
ADD COLUMN     "is_anchored" BOOLEAN DEFAULT false,
ADD COLUMN     "laytime_commence_at" TIMESTAMP(3),
ADD COLUMN     "nor_number" TEXT,
ADD COLUMN     "nor_rejected_at" TIMESTAMP(3),
ADD COLUMN     "nor_rejection_reason" TEXT,
ADD COLUMN     "port_authority_clearance_date" TIMESTAMP(3),
ADD COLUMN     "quarantine_clearance_date" TIMESTAMP(3);

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "procurement_requests" (
    "id" TEXT NOT NULL,
    "request_no" TEXT NOT NULL,
    "buyer_organization_id" TEXT,
    "product_id" TEXT NOT NULL,
    "requested_by_id" TEXT,
    "approved_by_id" TEXT,
    "required_qty_mt" DECIMAL(18,3) NOT NULL,
    "target_price_per_mt" DECIMAL(18,4),
    "currency" TEXT DEFAULT 'USD',
    "target_shipment_date" TIMESTAMP(3),
    "target_arrival_date" TIMESTAMP(3),
    "approval_status" "ProcurementRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "approved_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "broker_engagements" (
    "id" TEXT NOT NULL,
    "engagement_no" TEXT NOT NULL,
    "procurement_request_id" TEXT NOT NULL,
    "broker_org_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "commission_type" TEXT,
    "commission_rate" DECIMAL(10,4),
    "status" "NegotiationStatus" NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "broker_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_offers" (
    "id" TEXT NOT NULL,
    "offer_no" TEXT NOT NULL,
    "procurement_request_id" TEXT NOT NULL,
    "broker_engagement_id" TEXT,
    "supplier_id" TEXT NOT NULL,
    "product_id" TEXT,
    "offered_qty_mt" DECIMAL(18,3),
    "price_per_mt" DECIMAL(18,4),
    "currency" TEXT DEFAULT 'USD',
    "origin" TEXT,
    "shipment_window_from" TIMESTAMP(3),
    "shipment_window_to" TIMESTAMP(3),
    "payment_terms" TEXT,
    "validity_date" TIMESTAMP(3),
    "status" "NegotiationStatus" NOT NULL DEFAULT 'DRAFT',
    "received_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_permits" (
    "id" TEXT NOT NULL,
    "permit_no" TEXT NOT NULL,
    "procurement_request_id" TEXT,
    "import_contract_id" TEXT,
    "applicant_org_id" TEXT,
    "product_id" TEXT,
    "application_date" TIMESTAMP(3),
    "issue_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "permitted_qty_mt" DECIMAL(18,3),
    "status" "PermitStatus" NOT NULL DEFAULT 'DRAFT',
    "issued_by_authority" TEXT,
    "reference_no" TEXT,
    "approved_by_id" TEXT,
    "collected_by_id" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_permits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regulatory_clearances" (
    "id" TEXT NOT NULL,
    "clearance_no" TEXT,
    "import_permit_id" TEXT,
    "import_contract_id" TEXT,
    "vessel_call_id" TEXT,
    "document_type" "RegulatoryDocumentType" NOT NULL,
    "authority_name" TEXT,
    "received_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "status" "PermitStatus" NOT NULL DEFAULT 'DRAFT',
    "reference_no" TEXT,
    "collected_by_id" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regulatory_clearances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_credit_limits" (
    "id" TEXT NOT NULL,
    "facility_no" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "applicant_org_id" TEXT NOT NULL,
    "sanctioned_amount" DECIMAL(18,2) NOT NULL,
    "utilized_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "available_amount" DECIMAL(18,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effective_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_credit_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lc_applications" (
    "id" TEXT NOT NULL,
    "application_no" TEXT NOT NULL,
    "lc_id" TEXT,
    "pi_id" TEXT,
    "import_permit_id" TEXT,
    "bank_credit_limit_id" TEXT,
    "insurance_cover_note_no" TEXT,
    "application_date" TIMESTAMP(3),
    "submitted_to_bank_at" TIMESTAMP(3),
    "bank_response_at" TIMESTAMP(3),
    "approved_amount" DECIMAL(18,2),
    "status" "LcApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "requested_by_id" TEXT,
    "reviewed_by_id" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lc_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packing_lists" (
    "id" TEXT NOT NULL,
    "packing_list_no" TEXT,
    "bl_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consignee_id" TEXT,
    "consignee_name" TEXT NOT NULL,
    "consignee_address" TEXT,
    "commodity" TEXT NOT NULL,
    "hs_code" TEXT NOT NULL,
    "country_of_origin" TEXT NOT NULL,
    "packing" TEXT NOT NULL DEFAULT 'IN BULK',
    "gross_weight_mt" DECIMAL(18,3) NOT NULL,
    "net_weight_mt" DECIMAL(18,3) NOT NULL,
    "lc_number" TEXT,
    "lc_date" TIMESTAMP(3),
    "irc_no" TEXT,
    "bin_no" TEXT,
    "tin_no" TEXT,
    "issuing_bank_bin_no" TEXT,
    "vessel_name" TEXT NOT NULL,
    "bill_of_lading_no" TEXT NOT NULL,
    "bill_of_lading_date" TIMESTAMP(3) NOT NULL,
    "proforma_invoice_no" TEXT,
    "proforma_invoice_date" TIMESTAMP(3),
    "load_port" TEXT NOT NULL,
    "discharge_port" TEXT NOT NULL,
    "issuing_bank_name" TEXT,
    "issuing_bank_address" TEXT,
    "applicant_name" TEXT,
    "applicant_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packing_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_invoices" (
    "id" TEXT NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL,
    "lc_id" TEXT NOT NULL,
    "bl_id" TEXT,
    "seller_id" TEXT,
    "seller_name" TEXT NOT NULL,
    "seller_address" TEXT,
    "buyer_id" TEXT,
    "buyer_name" TEXT NOT NULL,
    "buyer_address" TEXT,
    "product_description" TEXT NOT NULL,
    "hs_code" TEXT,
    "irc_no" TEXT,
    "bin_no" TEXT,
    "tin_no" TEXT,
    "quantity_mt" DECIMAL(18,3) NOT NULL,
    "fob_value" DECIMAL(18,2),
    "freight_charge" DECIMAL(18,2),
    "unit_price_usd" DECIMAL(18,4) NOT NULL,
    "total_amount_usd" DECIMAL(18,2) NOT NULL,
    "total_amount_in_words" TEXT,
    "payment_terms" TEXT,
    "shipment_terms" TEXT,
    "country_of_origin" TEXT,
    "vessel_name" TEXT,
    "port_of_loading" TEXT,
    "port_of_discharge" TEXT,
    "declaration_text" TEXT,
    "certification_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "origin_certificates" (
    "id" TEXT NOT NULL,
    "certificate_no" TEXT NOT NULL,
    "certificate_date" TIMESTAMP(3) NOT NULL,
    "lc_id" TEXT NOT NULL,
    "bl_id" TEXT,
    "shipper_name" TEXT NOT NULL,
    "shipper_address" TEXT,
    "consignee_name" TEXT NOT NULL,
    "notify_party_name" TEXT,
    "notify_party_address" TEXT,
    "vessel_name" TEXT,
    "port_of_loading" TEXT,
    "port_of_discharge" TEXT,
    "bl_no" TEXT,
    "bl_date" TIMESTAMP(3),
    "hs_code" TEXT,
    "irc_no" TEXT,
    "bin_no" TEXT,
    "tin_no" TEXT,
    "product_description" TEXT NOT NULL,
    "packing" TEXT DEFAULT 'IN BULK',
    "gross_weight_lbs" DECIMAL(18,0),
    "quantity_mt" DECIMAL(18,3) NOT NULL,
    "origin_country" TEXT NOT NULL,
    "origin_criteria" TEXT,
    "declaration_text" TEXT,
    "chamber_attestation_text" TEXT,
    "chamber_name" TEXT,
    "issuing_authority" TEXT NOT NULL,
    "place_of_issue" TEXT NOT NULL,
    "date_of_issue" TIMESTAMP(3) NOT NULL,
    "declarant_name" TEXT,
    "declarant_company" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "origin_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phytosanitary_certificates" (
    "id" TEXT NOT NULL,
    "certificate_no" TEXT,
    "replaces_certificate_no" TEXT,
    "bl_id" TEXT NOT NULL,
    "exporter_name" TEXT NOT NULL,
    "exporter_address" TEXT,
    "consignee_name" TEXT NOT NULL,
    "consignee_address" TEXT,
    "place_of_origin" TEXT NOT NULL,
    "means_of_conveyance" TEXT NOT NULL,
    "point_of_entry" TEXT NOT NULL,
    "number_of_packages" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity_lbs" DECIMAL(18,0),
    "quantity_mt" DECIMAL(18,3) NOT NULL,
    "distinguishing_marks" TEXT,
    "botanical_name" TEXT NOT NULL,
    "chemical_active_ingredient" TEXT,
    "concentration" TEXT,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "treatment_date" TIMESTAMP(3),
    "date_of_issue" TIMESTAMP(3) NOT NULL,
    "place_of_issue" TEXT NOT NULL,
    "authorized_officer_name" TEXT NOT NULL,
    "authorized_officer_signature" TEXT,
    "warning_text" TEXT,

    CONSTRAINT "phytosanitary_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fumigation_certificates" (
    "id" TEXT NOT NULL,
    "certificate_no" TEXT,
    "certificate_date" TIMESTAMP(3) NOT NULL,
    "bl_id" TEXT NOT NULL,
    "vessel_name" TEXT NOT NULL,
    "shipper_name" TEXT NOT NULL,
    "shipper_address" TEXT,
    "description_of_goods" TEXT NOT NULL,
    "total_vessel_quantity_lbs" DECIMAL(18,0),
    "total_vessel_quantity_mt" DECIMAL(18,3),
    "port_of_loading" TEXT NOT NULL,
    "port_of_discharge" TEXT NOT NULL,
    "notify_party" TEXT,
    "bill_of_lading_no" TEXT NOT NULL,
    "bill_of_lading_date" TIMESTAMP(3) NOT NULL,
    "bill_of_lading_quantity_lbs" DECIMAL(18,0),
    "bill_of_lading_quantity_mt" DECIMAL(18,3),
    "fumigation_date" TIMESTAMP(3) NOT NULL,
    "place_of_treatment" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "product_percentage" TEXT,
    "concentration" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "application_method" TEXT,
    "temperature_fahrenheit" DECIMAL(5,2),
    "exposure_time_days" INTEGER,
    "stowage_holds" TEXT,
    "tablets_per_hold" JSONB,
    "dust_retained_sleeves_per_hold" JSONB,
    "fumigation_company" TEXT NOT NULL,
    "certified_applicator" TEXT,
    "destination" TEXT,
    "estimated_voyage_days" INTEGER,
    "confirmation_statement" TEXT,
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issue_place" TEXT NOT NULL,

    CONSTRAINT "fumigation_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "non_radiation_certificates" (
    "id" TEXT NOT NULL,
    "certificate_no" TEXT,
    "bl_id" TEXT NOT NULL,
    "vessel_name" TEXT NOT NULL,
    "loading_port" TEXT NOT NULL,
    "discharge_port" TEXT NOT NULL,
    "description_of_goods" TEXT NOT NULL,
    "quantity_lbs" DECIMAL(18,0),
    "quantity_mt" DECIMAL(18,3) NOT NULL,
    "stowage_holds" TEXT,
    "shipper_name" TEXT NOT NULL,
    "shipper_address" TEXT,
    "notify_party_name" TEXT,
    "notify_party_address" TEXT,
    "consignee" TEXT,
    "isotope" TEXT NOT NULL DEFAULT 'Cs-137',
    "result_bq_per_kg" DECIMAL(10,2),
    "max_allowed_bq_per_kg" DECIMAL(65,30) NOT NULL DEFAULT 50,
    "conclusion" TEXT,
    "usda_seal_number" TEXT,
    "certificate_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_date" TIMESTAMP(3),
    "surveyor_company" TEXT,
    "surveyor_name" TEXT,
    "surveyor_title" TEXT,
    "reference_no" TEXT,
    "lc_id" TEXT,

    CONSTRAINT "non_radiation_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_certificates" (
    "id" TEXT NOT NULL,
    "certificate_no" TEXT,
    "bl_id" TEXT NOT NULL,
    "lc_id" TEXT,
    "vessel_name" TEXT NOT NULL,
    "commodity" TEXT NOT NULL,
    "quantity_lbs" DECIMAL(18,0),
    "quantity_mt" DECIMAL(18,3) NOT NULL,
    "load_port" TEXT NOT NULL,
    "load_date" TIMESTAMP(3) NOT NULL,
    "discharge_port" TEXT NOT NULL,
    "stowage_holds" TEXT,
    "shipper_name" TEXT NOT NULL,
    "shipper_address" TEXT,
    "notify_party_name" TEXT,
    "notify_party_address" TEXT,
    "consignee" TEXT,
    "bl_no" TEXT,
    "bl_date" TIMESTAMP(3),
    "usda_seal_number" TEXT,
    "certification_text" TEXT NOT NULL,
    "guideline_reference" TEXT DEFAULT 'TIC Guidelines',
    "certificate_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_date" TIMESTAMP(3),
    "surveyor_company" TEXT,
    "surveyor_name" TEXT,
    "surveyor_title" TEXT,

    CONSTRAINT "health_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_weight_quality" (
    "id" TEXT NOT NULL,
    "certificate_no" TEXT,
    "bl_id" TEXT NOT NULL,
    "vessel_name" TEXT NOT NULL,
    "loading_port" TEXT NOT NULL,
    "discharge_port" TEXT NOT NULL,
    "description_of_goods" TEXT NOT NULL,
    "quantity_lbs" DECIMAL(18,0),
    "quantity_mt" DECIMAL(18,3) NOT NULL,
    "stowage_holds" TEXT,
    "shipper_name" TEXT NOT NULL,
    "shipper_address" TEXT,
    "notify_party_name" TEXT,
    "notify_party_address" TEXT,
    "consignee" TEXT,
    "moisture_pct" DECIMAL(5,2),
    "moisture_method" TEXT,
    "protein_pct" DECIMAL(5,2),
    "protein_method" TEXT,
    "oil_pct" DECIMAL(5,2),
    "oil_method" TEXT,
    "foreign_matter_pct" DECIMAL(5,2),
    "broken_kernels_pct" DECIMAL(5,2),
    "damaged_kernels_pct" DECIMAL(5,2),
    "alive_insects" BOOLEAN NOT NULL DEFAULT false,
    "test_methods" JSONB,
    "usda_seal_number" TEXT,
    "sample_reference" TEXT,
    "certificate_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_date" TIMESTAMP(3),
    "surveyor_company" TEXT,
    "surveyor_name" TEXT,
    "surveyor_title" TEXT,
    "reference_no" TEXT,
    "certification_text" TEXT,

    CONSTRAINT "certificate_weight_quality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hold_cleaning_certificates" (
    "id" TEXT NOT NULL,
    "certificate_no" TEXT,
    "bl_id" TEXT NOT NULL,
    "lc_id" TEXT,
    "vessel_name" TEXT NOT NULL,
    "vessel_call_id" TEXT,
    "commodity" TEXT NOT NULL,
    "quantity_lbs" DECIMAL(18,0),
    "quantity_mt" DECIMAL(18,3),
    "load_port" TEXT NOT NULL,
    "load_date" TIMESTAMP(3) NOT NULL,
    "discharge_port" TEXT NOT NULL,
    "stowage_holds" TEXT NOT NULL,
    "inspection_date" TIMESTAMP(3) NOT NULL,
    "inspection_finding" TEXT NOT NULL,
    "fgis_certificate_no" TEXT,
    "shipper_name" TEXT NOT NULL,
    "shipper_address" TEXT,
    "notify_party_name" TEXT,
    "notify_party_address" TEXT,
    "consignee" TEXT NOT NULL,
    "certificate_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_date" TIMESTAMP(3),
    "surveyor_company" TEXT,
    "sealed_hatches" JSONB,
    "seal_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hold_cleaning_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_certificates" (
    "id" TEXT NOT NULL,
    "certificate_no" TEXT,
    "certificate_date" TIMESTAMP(3) NOT NULL,
    "lc_id" TEXT NOT NULL,
    "bl_id" TEXT,
    "product_description" TEXT NOT NULL,
    "quantity_mt" DECIMAL(18,3) NOT NULL,
    "hs_code" TEXT,
    "country_of_origin" TEXT,
    "packing" TEXT DEFAULT 'IN BULK',
    "lc_no" TEXT,
    "lc_date" TIMESTAMP(3),
    "vessel_name" TEXT,
    "bl_no" TEXT,
    "bl_date" TIMESTAMP(3),
    "proforma_invoice_no" TEXT,
    "proforma_invoice_date" TIMESTAMP(3),
    "port_of_loading" TEXT,
    "port_of_discharge" TEXT,
    "certificate_type" TEXT NOT NULL,
    "declaration_text" TEXT NOT NULL,
    "insurance_company" TEXT,
    "cover_note_no" TEXT,
    "cover_note_date" TIMESTAMP(3),
    "email_sent_to" TEXT,
    "email_dispatched_to" TEXT,
    "vessel_geared" BOOLEAN,
    "vessel_classed" TEXT,
    "vessel_age_years" INTEGER,
    "vessel_fit_for_voyage" BOOLEAN,
    "issuer_name" TEXT NOT NULL,
    "issuer_address" TEXT,
    "authorized_signatory" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills_of_exchange" (
    "id" TEXT NOT NULL,
    "bill_no" TEXT NOT NULL,
    "lc_id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "tenor" TEXT NOT NULL,
    "drawer" TEXT NOT NULL,
    "drawee" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "acceptance_date" TIMESTAMP(3),
    "acceptance_status" TEXT DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bills_of_exchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_advices" (
    "id" TEXT NOT NULL,
    "advice_no" TEXT,
    "lc_id" TEXT NOT NULL,
    "bl_id" TEXT,
    "cover_note_no" TEXT NOT NULL,
    "cover_note_date" TIMESTAMP(3) NOT NULL,
    "insurance_company" TEXT NOT NULL,
    "insurance_company_address" TEXT,
    "email_sent_to" TEXT,
    "applicant_email" TEXT,
    "email_sent_date" TIMESTAMP(3),
    "product_description" TEXT,
    "quantity_mt" DECIMAL(18,3),
    "vessel_name" TEXT,
    "bl_no" TEXT,
    "lc_no" TEXT,
    "advised_within_days" INTEGER,
    "is_compliant" BOOLEAN NOT NULL DEFAULT true,
    "advised_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_advices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices_of_readiness" (
    "id" TEXT NOT NULL,
    "nor_no" TEXT NOT NULL,
    "vessel_call_id" TEXT NOT NULL,
    "sender_org_id" TEXT,
    "received_by_id" TEXT,
    "tendered_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "laytime_commence_at" TIMESTAMP(3),
    "status" "NorStatus" NOT NULL DEFAULT 'TENDERED',
    "rejection_reason" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_of_readiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessel_shifts" (
    "id" TEXT NOT NULL,
    "shift_no" TEXT NOT NULL,
    "vessel_call_id" TEXT NOT NULL,
    "from_anchorage_id" TEXT,
    "to_anchorage_id" TEXT,
    "shifted_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "stage_before" "DischargeStage",
    "stage_after" "DischargeStage",
    "discharged_qty_before_mt" DECIMAL(18,3),
    "discharged_qty_after_mt" DECIMAL(18,3),
    "reason" "VesselShiftReason" NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vessel_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lighter_scouts" (
    "id" TEXT NOT NULL,
    "lighter_trip_id" TEXT NOT NULL,
    "scout_type" "ScoutType" NOT NULL,
    "scout_name" TEXT NOT NULL,
    "scout_phone" TEXT,
    "scout_nid" TEXT,
    "organization_id" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boarded_at" TIMESTAMP(3),
    "disembarked_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lighter_scouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_surveys" (
    "id" TEXT NOT NULL,
    "survey_no" TEXT NOT NULL,
    "lighter_trip_id" TEXT NOT NULL,
    "lighter_assignment_id" TEXT,
    "surveyor_id" TEXT,
    "surveyed_by_user_id" TEXT,
    "survey_location" TEXT NOT NULL,
    "location_id" TEXT,
    "water_density" DECIMAL(5,3),
    "water_temperature" DECIMAL(5,2),
    "wind_speed_knots" DECIMAL(5,2),
    "wave_height_meters" DECIMAL(4,2),
    "is_tidal_influence" BOOLEAN DEFAULT false,
    "tide_condition" TEXT,
    "pre_load_draft_forward" DECIMAL(5,3),
    "pre_load_draft_mid" DECIMAL(5,3),
    "pre_load_draft_aft" DECIMAL(5,3),
    "pre_load_draft_mean" DECIMAL(5,3),
    "pre_load_displacement" DECIMAL(18,3),
    "pre_load_ballast_water_mt" DECIMAL(18,3) DEFAULT 0,
    "pre_load_fresh_water_mt" DECIMAL(18,3) DEFAULT 0,
    "pre_load_fuel_oil_mt" DECIMAL(18,3) DEFAULT 0,
    "pre_load_diesel_oil_mt" DECIMAL(18,3) DEFAULT 0,
    "pre_load_lub_oil_mt" DECIMAL(18,3) DEFAULT 0,
    "pre_load_crew_and_stores_mt" DECIMAL(18,3) DEFAULT 0,
    "pre_load_constant_mt" DECIMAL(18,3) DEFAULT 0,
    "pre_load_total_deductions_mt" DECIMAL(18,3),
    "pre_load_light_ship_weight_mt" DECIMAL(18,3),
    "post_load_draft_forward" DECIMAL(5,3),
    "post_load_draft_mid" DECIMAL(5,3),
    "post_load_draft_aft" DECIMAL(5,3),
    "post_load_draft_mean" DECIMAL(5,3),
    "post_load_displacement" DECIMAL(18,3),
    "post_load_ballast_water_mt" DECIMAL(18,3) DEFAULT 0,
    "post_load_fresh_water_mt" DECIMAL(18,3) DEFAULT 0,
    "post_load_fuel_oil_mt" DECIMAL(18,3) DEFAULT 0,
    "post_load_diesel_oil_mt" DECIMAL(18,3) DEFAULT 0,
    "post_load_lub_oil_mt" DECIMAL(18,3) DEFAULT 0,
    "post_load_crew_and_stores_mt" DECIMAL(18,3) DEFAULT 0,
    "post_load_constant_mt" DECIMAL(18,3) DEFAULT 0,
    "post_load_total_deductions_mt" DECIMAL(18,3),
    "post_load_weight_mt" DECIMAL(18,3),
    "calculated_cargo_weight_mt" DECIMAL(18,3),
    "boat_note_capacity_mt" DECIMAL(18,3),
    "surveyor_loaded_qty_mt" DECIMAL(18,3),
    "weight_difference_mt" DECIMAL(18,3),
    "weight_difference_percent" DECIMAL(5,2),
    "difference_reason" TEXT,
    "tolerance_pct" DECIMAL(5,2) DEFAULT 0.5,
    "trim_correction_applied" BOOLEAN DEFAULT false,
    "density_correction_applied" BOOLEAN DEFAULT false,
    "list_correction_applied" BOOLEAN DEFAULT false,
    "surveyor_remarks" TEXT,
    "master_witness_name" TEXT,
    "master_witness_signature" TEXT,
    "importer_scout_witness_name" TEXT,
    "importer_scout_witness_signature" TEXT,
    "survey_status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dispute_reason" TEXT,
    "dispute_resolved_at" TIMESTAMP(3),
    "dispute_resolved_by" TEXT,
    "survey_started_at" TIMESTAMP(3) NOT NULL,
    "pre_load_survey_at" TIMESTAMP(3),
    "post_load_survey_at" TIMESTAMP(3),
    "survey_completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draft_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_balances" (
    "id" TEXT NOT NULL,
    "balance_date" TIMESTAMP(3) NOT NULL,
    "product_id" TEXT NOT NULL,
    "location_type" "StockLocationType" NOT NULL,
    "location_ref_id" TEXT NOT NULL,
    "quantity_ton" DECIMAL(18,3) NOT NULL,
    "in_transit_qty_ton" DECIMAL(18,3) DEFAULT 0,
    "reserved_qty_ton" DECIMAL(18,3) DEFAULT 0,
    "available_qty_ton" DECIMAL(18,3),
    "last_movement_at" TIMESTAMP(3),
    "source_movement_no" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vessel_cargo_summaries" (
    "id" TEXT NOT NULL,
    "vessel_call_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "summary_date" TIMESTAMP(3) NOT NULL,
    "released_qty_mt" DECIMAL(18,3),
    "assigned_qty_mt" DECIMAL(18,3),
    "draft_survey_qty_mt" DECIMAL(18,3),
    "ghat_received_qty_mt" DECIMAL(18,3),
    "silo_received_qty_mt" DECIMAL(18,3),
    "truck_delivered_qty_mt" DECIMAL(18,3),
    "remaining_qty_mt" DECIMAL(18,3),
    "trips_count" INTEGER DEFAULT 0,
    "trucks_count" INTEGER DEFAULT 0,
    "last_activity_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vessel_cargo_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BillOfExchangeToBillOfLading" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BillOfExchangeToBillOfLading_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DraftSurveySurveyor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DraftSurveySurveyor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DraftSurveyUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DraftSurveyUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "procurement_requests_request_no_key" ON "procurement_requests"("request_no");

-- CreateIndex
CREATE INDEX "procurement_requests_buyer_organization_id_idx" ON "procurement_requests"("buyer_organization_id");

-- CreateIndex
CREATE INDEX "procurement_requests_product_id_idx" ON "procurement_requests"("product_id");

-- CreateIndex
CREATE INDEX "procurement_requests_approval_status_idx" ON "procurement_requests"("approval_status");

-- CreateIndex
CREATE INDEX "procurement_requests_approval_status_target_shipment_date_idx" ON "procurement_requests"("approval_status", "target_shipment_date");

-- CreateIndex
CREATE INDEX "procurement_requests_product_id_created_at_idx" ON "procurement_requests"("product_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "broker_engagements_engagement_no_key" ON "broker_engagements"("engagement_no");

-- CreateIndex
CREATE INDEX "broker_engagements_procurement_request_id_idx" ON "broker_engagements"("procurement_request_id");

-- CreateIndex
CREATE INDEX "broker_engagements_broker_org_id_idx" ON "broker_engagements"("broker_org_id");

-- CreateIndex
CREATE INDEX "broker_engagements_status_idx" ON "broker_engagements"("status");

-- CreateIndex
CREATE INDEX "broker_engagements_supplier_id_status_idx" ON "broker_engagements"("supplier_id", "status");

-- CreateIndex
CREATE INDEX "broker_engagements_procurement_request_id_status_idx" ON "broker_engagements"("procurement_request_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_offers_offer_no_key" ON "supplier_offers"("offer_no");

-- CreateIndex
CREATE INDEX "supplier_offers_procurement_request_id_idx" ON "supplier_offers"("procurement_request_id");

-- CreateIndex
CREATE INDEX "supplier_offers_broker_engagement_id_idx" ON "supplier_offers"("broker_engagement_id");

-- CreateIndex
CREATE INDEX "supplier_offers_supplier_id_idx" ON "supplier_offers"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_offers_status_idx" ON "supplier_offers"("status");

-- CreateIndex
CREATE INDEX "supplier_offers_supplier_id_received_at_idx" ON "supplier_offers"("supplier_id", "received_at");

-- CreateIndex
CREATE INDEX "supplier_offers_procurement_request_id_status_received_at_idx" ON "supplier_offers"("procurement_request_id", "status", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "import_permits_permit_no_key" ON "import_permits"("permit_no");

-- CreateIndex
CREATE INDEX "import_permits_procurement_request_id_idx" ON "import_permits"("procurement_request_id");

-- CreateIndex
CREATE INDEX "import_permits_import_contract_id_idx" ON "import_permits"("import_contract_id");

-- CreateIndex
CREATE INDEX "import_permits_applicant_org_id_idx" ON "import_permits"("applicant_org_id");

-- CreateIndex
CREATE INDEX "import_permits_status_idx" ON "import_permits"("status");

-- CreateIndex
CREATE INDEX "import_permits_status_expiry_date_idx" ON "import_permits"("status", "expiry_date");

-- CreateIndex
CREATE INDEX "import_permits_product_id_status_idx" ON "import_permits"("product_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "regulatory_clearances_clearance_no_key" ON "regulatory_clearances"("clearance_no");

-- CreateIndex
CREATE INDEX "regulatory_clearances_import_permit_id_idx" ON "regulatory_clearances"("import_permit_id");

-- CreateIndex
CREATE INDEX "regulatory_clearances_import_contract_id_idx" ON "regulatory_clearances"("import_contract_id");

-- CreateIndex
CREATE INDEX "regulatory_clearances_vessel_call_id_idx" ON "regulatory_clearances"("vessel_call_id");

-- CreateIndex
CREATE INDEX "regulatory_clearances_document_type_status_idx" ON "regulatory_clearances"("document_type", "status");

-- CreateIndex
CREATE INDEX "regulatory_clearances_status_expiry_date_idx" ON "regulatory_clearances"("status", "expiry_date");

-- CreateIndex
CREATE INDEX "regulatory_clearances_vessel_call_id_document_type_status_idx" ON "regulatory_clearances"("vessel_call_id", "document_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_credit_limits_facility_no_key" ON "bank_credit_limits"("facility_no");

-- CreateIndex
CREATE INDEX "bank_credit_limits_bank_id_idx" ON "bank_credit_limits"("bank_id");

-- CreateIndex
CREATE INDEX "bank_credit_limits_applicant_org_id_idx" ON "bank_credit_limits"("applicant_org_id");

-- CreateIndex
CREATE INDEX "bank_credit_limits_status_idx" ON "bank_credit_limits"("status");

-- CreateIndex
CREATE INDEX "bank_credit_limits_bank_id_status_expiry_date_idx" ON "bank_credit_limits"("bank_id", "status", "expiry_date");

-- CreateIndex
CREATE INDEX "bank_credit_limits_applicant_org_id_status_expiry_date_idx" ON "bank_credit_limits"("applicant_org_id", "status", "expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "lc_applications_application_no_key" ON "lc_applications"("application_no");

-- CreateIndex
CREATE INDEX "lc_applications_lc_id_idx" ON "lc_applications"("lc_id");

-- CreateIndex
CREATE INDEX "lc_applications_pi_id_idx" ON "lc_applications"("pi_id");

-- CreateIndex
CREATE INDEX "lc_applications_import_permit_id_idx" ON "lc_applications"("import_permit_id");

-- CreateIndex
CREATE INDEX "lc_applications_bank_credit_limit_id_idx" ON "lc_applications"("bank_credit_limit_id");

-- CreateIndex
CREATE INDEX "lc_applications_status_idx" ON "lc_applications"("status");

-- CreateIndex
CREATE INDEX "lc_applications_status_submitted_to_bank_at_idx" ON "lc_applications"("status", "submitted_to_bank_at");

-- CreateIndex
CREATE INDEX "lc_applications_bank_credit_limit_id_status_idx" ON "lc_applications"("bank_credit_limit_id", "status");

-- CreateIndex
CREATE INDEX "lc_applications_requested_by_id_status_idx" ON "lc_applications"("requested_by_id", "status");

-- CreateIndex
CREATE INDEX "packing_lists_bl_id_idx" ON "packing_lists"("bl_id");

-- CreateIndex
CREATE INDEX "packing_lists_packing_list_no_idx" ON "packing_lists"("packing_list_no");

-- CreateIndex
CREATE INDEX "packing_lists_bill_of_lading_no_idx" ON "packing_lists"("bill_of_lading_no");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_invoices_invoice_no_key" ON "commercial_invoices"("invoice_no");

-- CreateIndex
CREATE INDEX "commercial_invoices_invoice_no_idx" ON "commercial_invoices"("invoice_no");

-- CreateIndex
CREATE INDEX "commercial_invoices_lc_id_idx" ON "commercial_invoices"("lc_id");

-- CreateIndex
CREATE INDEX "commercial_invoices_bl_id_idx" ON "commercial_invoices"("bl_id");

-- CreateIndex
CREATE UNIQUE INDEX "origin_certificates_certificate_no_key" ON "origin_certificates"("certificate_no");

-- CreateIndex
CREATE INDEX "origin_certificates_certificate_no_idx" ON "origin_certificates"("certificate_no");

-- CreateIndex
CREATE INDEX "origin_certificates_lc_id_idx" ON "origin_certificates"("lc_id");

-- CreateIndex
CREATE INDEX "origin_certificates_bl_id_idx" ON "origin_certificates"("bl_id");

-- CreateIndex
CREATE UNIQUE INDEX "phytosanitary_certificates_certificate_no_key" ON "phytosanitary_certificates"("certificate_no");

-- CreateIndex
CREATE UNIQUE INDEX "phytosanitary_certificates_bl_id_key" ON "phytosanitary_certificates"("bl_id");

-- CreateIndex
CREATE UNIQUE INDEX "fumigation_certificates_certificate_no_key" ON "fumigation_certificates"("certificate_no");

-- CreateIndex
CREATE UNIQUE INDEX "fumigation_certificates_bl_id_key" ON "fumigation_certificates"("bl_id");

-- CreateIndex
CREATE INDEX "fumigation_certificates_bl_id_idx" ON "fumigation_certificates"("bl_id");

-- CreateIndex
CREATE INDEX "fumigation_certificates_certificate_date_idx" ON "fumigation_certificates"("certificate_date");

-- CreateIndex
CREATE INDEX "fumigation_certificates_bill_of_lading_no_idx" ON "fumigation_certificates"("bill_of_lading_no");

-- CreateIndex
CREATE UNIQUE INDEX "non_radiation_certificates_certificate_no_key" ON "non_radiation_certificates"("certificate_no");

-- CreateIndex
CREATE UNIQUE INDEX "non_radiation_certificates_bl_id_key" ON "non_radiation_certificates"("bl_id");

-- CreateIndex
CREATE INDEX "non_radiation_certificates_bl_id_idx" ON "non_radiation_certificates"("bl_id");

-- CreateIndex
CREATE UNIQUE INDEX "health_certificates_certificate_no_key" ON "health_certificates"("certificate_no");

-- CreateIndex
CREATE UNIQUE INDEX "health_certificates_bl_id_key" ON "health_certificates"("bl_id");

-- CreateIndex
CREATE INDEX "health_certificates_bl_id_idx" ON "health_certificates"("bl_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_weight_quality_certificate_no_key" ON "certificate_weight_quality"("certificate_no");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_weight_quality_bl_id_key" ON "certificate_weight_quality"("bl_id");

-- CreateIndex
CREATE INDEX "certificate_weight_quality_bl_id_idx" ON "certificate_weight_quality"("bl_id");

-- CreateIndex
CREATE INDEX "certificate_weight_quality_certificate_date_idx" ON "certificate_weight_quality"("certificate_date");

-- CreateIndex
CREATE UNIQUE INDEX "hold_cleaning_certificates_certificate_no_key" ON "hold_cleaning_certificates"("certificate_no");

-- CreateIndex
CREATE UNIQUE INDEX "hold_cleaning_certificates_bl_id_key" ON "hold_cleaning_certificates"("bl_id");

-- CreateIndex
CREATE INDEX "hold_cleaning_certificates_certificate_no_idx" ON "hold_cleaning_certificates"("certificate_no");

-- CreateIndex
CREATE INDEX "hold_cleaning_certificates_bl_id_idx" ON "hold_cleaning_certificates"("bl_id");

-- CreateIndex
CREATE INDEX "hold_cleaning_certificates_inspection_date_idx" ON "hold_cleaning_certificates"("inspection_date");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiary_certificates_certificate_no_key" ON "beneficiary_certificates"("certificate_no");

-- CreateIndex
CREATE INDEX "beneficiary_certificates_certificate_no_idx" ON "beneficiary_certificates"("certificate_no");

-- CreateIndex
CREATE INDEX "beneficiary_certificates_lc_id_idx" ON "beneficiary_certificates"("lc_id");

-- CreateIndex
CREATE INDEX "beneficiary_certificates_bl_id_idx" ON "beneficiary_certificates"("bl_id");

-- CreateIndex
CREATE INDEX "beneficiary_certificates_certificate_type_idx" ON "beneficiary_certificates"("certificate_type");

-- CreateIndex
CREATE UNIQUE INDEX "bills_of_exchange_bill_no_key" ON "bills_of_exchange"("bill_no");

-- CreateIndex
CREATE INDEX "bills_of_exchange_bill_no_idx" ON "bills_of_exchange"("bill_no");

-- CreateIndex
CREATE INDEX "bills_of_exchange_lc_id_idx" ON "bills_of_exchange"("lc_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_advices_advice_no_key" ON "insurance_advices"("advice_no");

-- CreateIndex
CREATE INDEX "insurance_advices_cover_note_no_idx" ON "insurance_advices"("cover_note_no");

-- CreateIndex
CREATE INDEX "insurance_advices_lc_id_idx" ON "insurance_advices"("lc_id");

-- CreateIndex
CREATE INDEX "insurance_advices_bl_id_idx" ON "insurance_advices"("bl_id");

-- CreateIndex
CREATE UNIQUE INDEX "notices_of_readiness_nor_no_key" ON "notices_of_readiness"("nor_no");

-- CreateIndex
CREATE INDEX "notices_of_readiness_vessel_call_id_idx" ON "notices_of_readiness"("vessel_call_id");

-- CreateIndex
CREATE INDEX "notices_of_readiness_status_idx" ON "notices_of_readiness"("status");

-- CreateIndex
CREATE INDEX "notices_of_readiness_status_tendered_at_idx" ON "notices_of_readiness"("status", "tendered_at");

-- CreateIndex
CREATE INDEX "notices_of_readiness_vessel_call_id_status_tendered_at_idx" ON "notices_of_readiness"("vessel_call_id", "status", "tendered_at");

-- CreateIndex
CREATE UNIQUE INDEX "vessel_shifts_shift_no_key" ON "vessel_shifts"("shift_no");

-- CreateIndex
CREATE INDEX "vessel_shifts_vessel_call_id_idx" ON "vessel_shifts"("vessel_call_id");

-- CreateIndex
CREATE INDEX "vessel_shifts_shifted_at_idx" ON "vessel_shifts"("shifted_at");

-- CreateIndex
CREATE INDEX "vessel_shifts_reason_idx" ON "vessel_shifts"("reason");

-- CreateIndex
CREATE INDEX "vessel_shifts_vessel_call_id_shifted_at_idx" ON "vessel_shifts"("vessel_call_id", "shifted_at");

-- CreateIndex
CREATE INDEX "lighter_scouts_lighter_trip_id_idx" ON "lighter_scouts"("lighter_trip_id");

-- CreateIndex
CREATE INDEX "lighter_scouts_scout_type_status_idx" ON "lighter_scouts"("scout_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "lighter_scouts_lighter_trip_id_scout_type_key" ON "lighter_scouts"("lighter_trip_id", "scout_type");

-- CreateIndex
CREATE UNIQUE INDEX "draft_surveys_survey_no_key" ON "draft_surveys"("survey_no");

-- CreateIndex
CREATE UNIQUE INDEX "draft_surveys_lighter_trip_id_key" ON "draft_surveys"("lighter_trip_id");

-- CreateIndex
CREATE INDEX "draft_surveys_survey_no_idx" ON "draft_surveys"("survey_no");

-- CreateIndex
CREATE INDEX "draft_surveys_survey_status_idx" ON "draft_surveys"("survey_status");

-- CreateIndex
CREATE INDEX "draft_surveys_survey_started_at_idx" ON "draft_surveys"("survey_started_at");

-- CreateIndex
CREATE INDEX "draft_surveys_lighter_assignment_id_survey_status_idx" ON "draft_surveys"("lighter_assignment_id", "survey_status");

-- CreateIndex
CREATE INDEX "draft_surveys_surveyor_id_survey_started_at_idx" ON "draft_surveys"("surveyor_id", "survey_started_at");

-- CreateIndex
CREATE INDEX "draft_surveys_location_id_survey_started_at_idx" ON "draft_surveys"("location_id", "survey_started_at");

-- CreateIndex
CREATE INDEX "inventory_balances_product_id_balance_date_idx" ON "inventory_balances"("product_id", "balance_date");

-- CreateIndex
CREATE INDEX "inventory_balances_location_type_location_ref_id_balance_da_idx" ON "inventory_balances"("location_type", "location_ref_id", "balance_date");

-- CreateIndex
CREATE INDEX "inventory_balances_last_movement_at_idx" ON "inventory_balances"("last_movement_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_balances_balance_date_product_id_location_type_lo_key" ON "inventory_balances"("balance_date", "product_id", "location_type", "location_ref_id");

-- CreateIndex
CREATE INDEX "vessel_cargo_summaries_vessel_call_id_summary_date_idx" ON "vessel_cargo_summaries"("vessel_call_id", "summary_date");

-- CreateIndex
CREATE INDEX "vessel_cargo_summaries_product_id_summary_date_idx" ON "vessel_cargo_summaries"("product_id", "summary_date");

-- CreateIndex
CREATE INDEX "vessel_cargo_summaries_last_activity_at_idx" ON "vessel_cargo_summaries"("last_activity_at");

-- CreateIndex
CREATE UNIQUE INDEX "vessel_cargo_summaries_vessel_call_id_product_id_summary_da_key" ON "vessel_cargo_summaries"("vessel_call_id", "product_id", "summary_date");

-- CreateIndex
CREATE INDEX "_BillOfExchangeToBillOfLading_B_index" ON "_BillOfExchangeToBillOfLading"("B");

-- CreateIndex
CREATE INDEX "_DraftSurveySurveyor_B_index" ON "_DraftSurveySurveyor"("B");

-- CreateIndex
CREATE INDEX "_DraftSurveyUser_B_index" ON "_DraftSurveyUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "bills_of_lading_vessel_call_id_key" ON "bills_of_lading"("vessel_call_id");

-- CreateIndex
CREATE INDEX "bills_of_lading_lc_number_idx" ON "bills_of_lading"("lc_number");

-- CreateIndex
CREATE INDEX "bills_of_lading_vessel_name_idx" ON "bills_of_lading"("vessel_name");

-- CreateIndex
CREATE INDEX "bills_of_lading_bl_date_idx" ON "bills_of_lading"("bl_date");

-- CreateIndex
CREATE INDEX "bills_of_lading_set_no_idx" ON "bills_of_lading"("set_no");

-- CreateIndex
CREATE INDEX "ghat_unloadings_ghat_id_started_at_idx" ON "ghat_unloadings"("ghat_id", "started_at");

-- CreateIndex
CREATE INDEX "ghat_unloadings_method_started_at_idx" ON "ghat_unloadings"("method", "started_at");

-- CreateIndex
CREATE INDEX "ghat_unloadings_customer_warehouse_id_started_at_idx" ON "ghat_unloadings"("customer_warehouse_id", "started_at");

-- CreateIndex
CREATE INDEX "import_contracts_approved_by_id_idx" ON "import_contracts"("approved_by_id");

-- CreateIndex
CREATE INDEX "import_contracts_buyer_organization_id_status_idx" ON "import_contracts"("buyer_organization_id", "status");

-- CreateIndex
CREATE INDEX "import_contracts_shipment_from_date_shipment_to_date_idx" ON "import_contracts"("shipment_from_date", "shipment_to_date");

-- CreateIndex
CREATE INDEX "letters_of_credit_applicant_id_expiry_date_idx" ON "letters_of_credit"("applicant_id", "expiry_date");

-- CreateIndex
CREATE INDEX "letters_of_credit_lc_date_lc_status_idx" ON "letters_of_credit"("lc_date", "lc_status");

-- CreateIndex
CREATE INDEX "letters_of_credit_bank_credit_limit_id_idx" ON "letters_of_credit"("bank_credit_limit_id");

-- CreateIndex
CREATE INDEX "letters_of_credit_issuing_bank_id_lc_status_idx" ON "letters_of_credit"("issuing_bank_id", "lc_status");

-- CreateIndex
CREATE INDEX "letters_of_credit_beneficiary_id_lc_status_idx" ON "letters_of_credit"("beneficiary_id", "lc_status");

-- CreateIndex
CREATE INDEX "letters_of_credit_expiry_date_lc_status_idx" ON "letters_of_credit"("expiry_date", "lc_status");

-- CreateIndex
CREATE INDEX "letters_of_credit_latest_shipment_date_lc_status_idx" ON "letters_of_credit"("latest_shipment_date", "lc_status");

-- CreateIndex
CREATE INDEX "letters_of_credit_pi_id_idx" ON "letters_of_credit"("pi_id");

-- CreateIndex
CREATE INDEX "lighter_assignments_vessel_call_id_discharge_stage_status_idx" ON "lighter_assignments"("vessel_call_id", "discharge_stage", "status");

-- CreateIndex
CREATE INDEX "lighter_assignments_lighter_id_status_idx" ON "lighter_assignments"("lighter_id", "status");

-- CreateIndex
CREATE INDEX "lighter_assignments_destination_ghat_id_assigned_date_idx" ON "lighter_assignments"("destination_ghat_id", "assigned_date");

-- CreateIndex
CREATE INDEX "lighter_trip_cargoes_trip_id_product_id_lc_release_id_idx" ON "lighter_trip_cargoes"("trip_id", "product_id", "lc_release_id");

-- CreateIndex
CREATE INDEX "lighter_trip_cargoes_product_id_lc_release_id_idx" ON "lighter_trip_cargoes"("product_id", "lc_release_id");

-- CreateIndex
CREATE INDEX "lighter_trip_events_trip_id_event_time_idx" ON "lighter_trip_events"("trip_id", "event_time");

-- CreateIndex
CREATE INDEX "lighter_trip_events_status_after_event_time_idx" ON "lighter_trip_events"("status_after", "event_time");

-- CreateIndex
CREATE UNIQUE INDEX "lighter_trips_draft_survey_id_key" ON "lighter_trips"("draft_survey_id");

-- CreateIndex
CREATE INDEX "lighter_trips_has_surveyor_scout_has_importer_scout_idx" ON "lighter_trips"("has_surveyor_scout", "has_importer_scout");

-- CreateIndex
CREATE INDEX "lighter_trips_draft_survey_status_idx" ON "lighter_trips"("draft_survey_status");

-- CreateIndex
CREATE INDEX "lighter_trips_vessel_call_id_status_assigned_at_idx" ON "lighter_trips"("vessel_call_id", "status", "assigned_at");

-- CreateIndex
CREATE INDEX "lighter_trips_lighter_vessel_id_status_idx" ON "lighter_trips"("lighter_vessel_id", "status");

-- CreateIndex
CREATE INDEX "lighter_trips_arrived_ghat_date_status_idx" ON "lighter_trips"("arrived_ghat_date", "status");

-- CreateIndex
CREATE INDEX "lighter_trips_way_to_mv_started_at_status_idx" ON "lighter_trips"("way_to_mv_started_at", "status");

-- CreateIndex
CREATE INDEX "mother_vessel_daily_discharges_vessel_call_id_report_date_c_idx" ON "mother_vessel_daily_discharges"("vessel_call_id", "report_date", "created_at");

-- CreateIndex
CREATE INDEX "products_code_isActive_idx" ON "products"("code", "isActive");

-- CreateIndex
CREATE INDEX "proforma_invoices_contract_no_idx" ON "proforma_invoices"("contract_no");

-- CreateIndex
CREATE INDEX "proforma_invoices_approved_by_id_idx" ON "proforma_invoices"("approved_by_id");

-- CreateIndex
CREATE INDEX "proforma_invoices_seller_id_status_idx" ON "proforma_invoices"("seller_id", "status");

-- CreateIndex
CREATE INDEX "proforma_invoices_buyer_id_status_idx" ON "proforma_invoices"("buyer_id", "status");

-- CreateIndex
CREATE INDEX "proforma_invoices_pi_date_status_idx" ON "proforma_invoices"("pi_date", "status");

-- CreateIndex
CREATE INDEX "silo_receipts_silo_id_received_at_idx" ON "silo_receipts"("silo_id", "received_at");

-- CreateIndex
CREATE INDEX "silo_receipts_product_id_received_at_idx" ON "silo_receipts"("product_id", "received_at");

-- CreateIndex
CREATE INDEX "silo_receipts_trip_id_received_at_idx" ON "silo_receipts"("trip_id", "received_at");

-- CreateIndex
CREATE INDEX "sof_events_statement_id_event_time_idx" ON "sof_events"("statement_id", "event_time");

-- CreateIndex
CREATE INDEX "sof_events_event_type_event_time_idx" ON "sof_events"("event_type", "event_time");

-- CreateIndex
CREATE INDEX "sof_events_is_hold_event_time_idx" ON "sof_events"("is_hold", "event_time");

-- CreateIndex
CREATE INDEX "sof_events_anchorage_id_event_time_idx" ON "sof_events"("anchorage_id", "event_time");

-- CreateIndex
CREATE INDEX "sof_hourly_statuses_daily_discharge_id_hour_start_at_idx" ON "sof_hourly_statuses"("daily_discharge_id", "hour_start_at");

-- CreateIndex
CREATE INDEX "sof_hourly_statuses_lighter_trip_id_hour_start_at_idx" ON "sof_hourly_statuses"("lighter_trip_id", "hour_start_at");

-- CreateIndex
CREATE INDEX "sof_hourly_statuses_event_type_hour_start_at_idx" ON "sof_hourly_statuses"("event_type", "hour_start_at");

-- CreateIndex
CREATE INDEX "statements_of_fact_scope_started_at_idx" ON "statements_of_fact"("scope", "started_at");

-- CreateIndex
CREATE INDEX "statements_of_fact_scope_completed_at_idx" ON "statements_of_fact"("scope", "completed_at");

-- CreateIndex
CREATE INDEX "stock_movements_movement_type_movement_at_idx" ON "stock_movements"("movement_type", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_movement_type_movement_at_idx" ON "stock_movements"("product_id", "movement_type", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_lc_release_id_movement_at_idx" ON "stock_movements"("lc_release_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_lighter_assignment_id_movement_at_idx" ON "stock_movements"("lighter_assignment_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_warehouse_id_product_id_movement_at_idx" ON "stock_movements"("warehouse_id", "product_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_silo_id_product_id_movement_at_idx" ON "stock_movements"("silo_id", "product_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_ghat_id_product_id_movement_at_idx" ON "stock_movements"("ghat_id", "product_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_from_location_id_movement_at_idx" ON "stock_movements"("from_location_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_to_location_id_movement_at_idx" ON "stock_movements"("to_location_id", "movement_at");

-- CreateIndex
CREATE INDEX "truck_loads_status_dispatched_at_idx" ON "truck_loads"("status", "dispatched_at");

-- CreateIndex
CREATE INDEX "truck_loads_warehouse_id_status_received_at_idx" ON "truck_loads"("warehouse_id", "status", "received_at");

-- CreateIndex
CREATE INDEX "truck_loads_destination_id_status_dispatched_at_idx" ON "truck_loads"("destination_id", "status", "dispatched_at");

-- CreateIndex
CREATE INDEX "truck_loads_product_id_dispatched_at_idx" ON "truck_loads"("product_id", "dispatched_at");

-- CreateIndex
CREATE INDEX "truck_loads_truck_id_dispatched_at_idx" ON "truck_loads"("truck_id", "dispatched_at");

-- CreateIndex
CREATE INDEX "vessel_calls_status_eta_idx" ON "vessel_calls"("status", "eta");

-- CreateIndex
CREATE INDEX "vessel_calls_status_ata_idx" ON "vessel_calls"("status", "ata");

-- CreateIndex
CREATE INDEX "vessel_calls_shipping_agent_id_status_idx" ON "vessel_calls"("shipping_agent_id", "status");

-- CreateIndex
CREATE INDEX "vessel_calls_cnf_id_status_idx" ON "vessel_calls"("cnf_id", "status");

-- CreateIndex
CREATE INDEX "vessel_calls_discharge_started_at_status_idx" ON "vessel_calls"("discharge_started_at", "status");

-- AddForeignKey
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_buyer_organization_id_fkey" FOREIGN KEY ("buyer_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_engagements" ADD CONSTRAINT "broker_engagements_procurement_request_id_fkey" FOREIGN KEY ("procurement_request_id") REFERENCES "procurement_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_engagements" ADD CONSTRAINT "broker_engagements_broker_org_id_fkey" FOREIGN KEY ("broker_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "broker_engagements" ADD CONSTRAINT "broker_engagements_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_offers" ADD CONSTRAINT "supplier_offers_procurement_request_id_fkey" FOREIGN KEY ("procurement_request_id") REFERENCES "procurement_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_offers" ADD CONSTRAINT "supplier_offers_broker_engagement_id_fkey" FOREIGN KEY ("broker_engagement_id") REFERENCES "broker_engagements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_offers" ADD CONSTRAINT "supplier_offers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_offers" ADD CONSTRAINT "supplier_offers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_contracts" ADD CONSTRAINT "import_contracts_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proforma_invoices" ADD CONSTRAINT "proforma_invoices_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proforma_invoices" ADD CONSTRAINT "proforma_invoices_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proforma_invoices" ADD CONSTRAINT "proforma_invoices_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_issuing_bank_id_fkey" FOREIGN KEY ("issuing_bank_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_drawee_id_fkey" FOREIGN KEY ("drawee_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letters_of_credit" ADD CONSTRAINT "letters_of_credit_bank_credit_limit_id_fkey" FOREIGN KEY ("bank_credit_limit_id") REFERENCES "bank_credit_limits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_permits" ADD CONSTRAINT "import_permits_procurement_request_id_fkey" FOREIGN KEY ("procurement_request_id") REFERENCES "procurement_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_permits" ADD CONSTRAINT "import_permits_import_contract_id_fkey" FOREIGN KEY ("import_contract_id") REFERENCES "import_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_permits" ADD CONSTRAINT "import_permits_applicant_org_id_fkey" FOREIGN KEY ("applicant_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_permits" ADD CONSTRAINT "import_permits_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_permits" ADD CONSTRAINT "import_permits_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_clearances" ADD CONSTRAINT "regulatory_clearances_import_permit_id_fkey" FOREIGN KEY ("import_permit_id") REFERENCES "import_permits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_clearances" ADD CONSTRAINT "regulatory_clearances_import_contract_id_fkey" FOREIGN KEY ("import_contract_id") REFERENCES "import_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_clearances" ADD CONSTRAINT "regulatory_clearances_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regulatory_clearances" ADD CONSTRAINT "regulatory_clearances_collected_by_id_fkey" FOREIGN KEY ("collected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_credit_limits" ADD CONSTRAINT "bank_credit_limits_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_credit_limits" ADD CONSTRAINT "bank_credit_limits_applicant_org_id_fkey" FOREIGN KEY ("applicant_org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_applications" ADD CONSTRAINT "lc_applications_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_applications" ADD CONSTRAINT "lc_applications_pi_id_fkey" FOREIGN KEY ("pi_id") REFERENCES "proforma_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_applications" ADD CONSTRAINT "lc_applications_import_permit_id_fkey" FOREIGN KEY ("import_permit_id") REFERENCES "import_permits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_applications" ADD CONSTRAINT "lc_applications_bank_credit_limit_id_fkey" FOREIGN KEY ("bank_credit_limit_id") REFERENCES "bank_credit_limits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_applications" ADD CONSTRAINT "lc_applications_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lc_applications" ADD CONSTRAINT "lc_applications_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills_of_lading" ADD CONSTRAINT "bills_of_lading_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills_of_lading" ADD CONSTRAINT "bills_of_lading_shipper_id_fkey" FOREIGN KEY ("shipper_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills_of_lading" ADD CONSTRAINT "bills_of_lading_notify_party_id_fkey" FOREIGN KEY ("notify_party_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills_of_lading" ADD CONSTRAINT "bills_of_lading_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_lists" ADD CONSTRAINT "packing_lists_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packing_lists" ADD CONSTRAINT "packing_lists_consignee_id_fkey" FOREIGN KEY ("consignee_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_invoices" ADD CONSTRAINT "commercial_invoices_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_invoices" ADD CONSTRAINT "commercial_invoices_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_invoices" ADD CONSTRAINT "commercial_invoices_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_invoices" ADD CONSTRAINT "commercial_invoices_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "origin_certificates" ADD CONSTRAINT "origin_certificates_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "origin_certificates" ADD CONSTRAINT "origin_certificates_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phytosanitary_certificates" ADD CONSTRAINT "phytosanitary_certificates_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fumigation_certificates" ADD CONSTRAINT "fumigation_certificates_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_radiation_certificates" ADD CONSTRAINT "non_radiation_certificates_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "non_radiation_certificates" ADD CONSTRAINT "non_radiation_certificates_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_certificates" ADD CONSTRAINT "health_certificates_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_certificates" ADD CONSTRAINT "health_certificates_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_weight_quality" ADD CONSTRAINT "certificate_weight_quality_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hold_cleaning_certificates" ADD CONSTRAINT "hold_cleaning_certificates_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hold_cleaning_certificates" ADD CONSTRAINT "hold_cleaning_certificates_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hold_cleaning_certificates" ADD CONSTRAINT "hold_cleaning_certificates_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_certificates" ADD CONSTRAINT "beneficiary_certificates_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiary_certificates" ADD CONSTRAINT "beneficiary_certificates_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills_of_exchange" ADD CONSTRAINT "bills_of_exchange_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_advices" ADD CONSTRAINT "insurance_advices_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_advices" ADD CONSTRAINT "insurance_advices_bl_id_fkey" FOREIGN KEY ("bl_id") REFERENCES "bills_of_lading"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices_of_readiness" ADD CONSTRAINT "notices_of_readiness_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices_of_readiness" ADD CONSTRAINT "notices_of_readiness_sender_org_id_fkey" FOREIGN KEY ("sender_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices_of_readiness" ADD CONSTRAINT "notices_of_readiness_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_shifts" ADD CONSTRAINT "vessel_shifts_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_shifts" ADD CONSTRAINT "vessel_shifts_from_anchorage_id_fkey" FOREIGN KEY ("from_anchorage_id") REFERENCES "anchorages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_shifts" ADD CONSTRAINT "vessel_shifts_to_anchorage_id_fkey" FOREIGN KEY ("to_anchorage_id") REFERENCES "anchorages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_scouts" ADD CONSTRAINT "lighter_scouts_lighter_trip_id_fkey" FOREIGN KEY ("lighter_trip_id") REFERENCES "lighter_trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_scouts" ADD CONSTRAINT "lighter_scouts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_surveys" ADD CONSTRAINT "draft_surveys_lighter_trip_id_fkey" FOREIGN KEY ("lighter_trip_id") REFERENCES "lighter_trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_surveys" ADD CONSTRAINT "draft_surveys_lighter_assignment_id_fkey" FOREIGN KEY ("lighter_assignment_id") REFERENCES "lighter_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_surveys" ADD CONSTRAINT "draft_surveys_surveyor_id_fkey" FOREIGN KEY ("surveyor_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_surveys" ADD CONSTRAINT "draft_surveys_surveyed_by_user_id_fkey" FOREIGN KEY ("surveyed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_surveys" ADD CONSTRAINT "draft_surveys_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_cargo_summaries" ADD CONSTRAINT "vessel_cargo_summaries_vessel_call_id_fkey" FOREIGN KEY ("vessel_call_id") REFERENCES "vessel_calls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vessel_cargo_summaries" ADD CONSTRAINT "vessel_cargo_summaries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BillOfExchangeToBillOfLading" ADD CONSTRAINT "_BillOfExchangeToBillOfLading_A_fkey" FOREIGN KEY ("A") REFERENCES "bills_of_exchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BillOfExchangeToBillOfLading" ADD CONSTRAINT "_BillOfExchangeToBillOfLading_B_fkey" FOREIGN KEY ("B") REFERENCES "bills_of_lading"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DraftSurveySurveyor" ADD CONSTRAINT "_DraftSurveySurveyor_A_fkey" FOREIGN KEY ("A") REFERENCES "draft_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DraftSurveySurveyor" ADD CONSTRAINT "_DraftSurveySurveyor_B_fkey" FOREIGN KEY ("B") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DraftSurveyUser" ADD CONSTRAINT "_DraftSurveyUser_A_fkey" FOREIGN KEY ("A") REFERENCES "draft_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DraftSurveyUser" ADD CONSTRAINT "_DraftSurveyUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
