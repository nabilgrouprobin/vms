-- CreateEnum
CREATE TYPE "WorkflowEntityType" AS ENUM ('PROCUREMENT_REQUEST', 'IMPORT_CONTRACT', 'PROFORMA_INVOICE', 'LC_APPLICATION', 'LETTER_OF_CREDIT', 'LC_AMENDMENT', 'LC_RELEASE', 'IMPORT_PERMIT', 'REGULATORY_CLEARANCE', 'VESSEL_CALL', 'LIGHTER_ASSIGNMENT', 'LIGHTER_TRIP', 'DRAFT_SURVEY', 'GATE_PASS', 'STOCK_CORRECTION', 'CLAIM', 'PERIOD_CLOSING', 'COST_ENTRY', 'QUALITY_INSPECTION', 'SALES_ALLOCATION', 'IMPORT_EXPORT_JOB', 'BACKGROUND_JOB', 'SAVED_REPORT', 'WEBHOOK_DELIVERY', 'ARCHIVE_RUN', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalStepStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AttachmentEntityType" AS ENUM ('PROCUREMENT_REQUEST', 'IMPORT_CONTRACT', 'PROFORMA_INVOICE', 'LC_APPLICATION', 'LETTER_OF_CREDIT', 'LC_AMENDMENT', 'LC_RELEASE', 'IMPORT_PERMIT', 'REGULATORY_CLEARANCE', 'BILL_OF_LADING', 'SHIPPING_CERTIFICATE', 'VESSEL_CALL', 'NOTICE_OF_READINESS', 'STATEMENT_OF_FACTS', 'SOF_EVENT', 'LIGHTER_ASSIGNMENT', 'LIGHTER_TRIP', 'DRAFT_SURVEY', 'GHAT_UNLOADING', 'SILO_RECEIPT', 'TRUCK_LOAD', 'WEIGHBRIDGE_SLIP', 'QUALITY_INSPECTION', 'CLAIM', 'COST_ENTRY', 'GATE_PASS', 'OTHER');

-- CreateEnum
CREATE TYPE "AttachmentStatus" AS ENUM ('UPLOADED', 'VERIFIED', 'REJECTED', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('REQUIRED', 'PENDING', 'RECEIVED', 'VERIFIED', 'WAIVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'READ', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_PENDING', 'DOCUMENT_MISSING', 'DOCUMENT_EXPIRING', 'LC_EXPIRING', 'PERMIT_EXPIRING', 'VESSEL_ETA_CHANGED', 'LIGHTER_DELAY', 'TRUCK_OVERDUE', 'STOCK_MISMATCH', 'CLAIM_UPDATE', 'PERIOD_CLOSING', 'GENERAL');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('LC_BANK_CHARGE', 'INSURANCE', 'CNF', 'SHIPPING_AGENT', 'STEVEDORE', 'CARRIER_FREIGHT', 'LIGHTER_FREIGHT', 'GHAT_UNLOADING', 'LABOUR', 'TRUCK_TRANSPORT', 'SURVEY', 'PORT_CHARGE', 'CUSTOMS_DUTY', 'DEMURRAGE', 'DISPATCH', 'WAREHOUSE', 'SILO', 'CLAIM_SETTLEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "CostStatus" AS ENUM ('ESTIMATED', 'ACCRUED', 'INVOICED', 'APPROVED', 'PAID', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QualityInspectionStatus" AS ENUM ('DRAFT', 'SAMPLE_COLLECTED', 'SENT_TO_LAB', 'PASSED', 'FAILED', 'DISPUTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('SHORTAGE', 'QUALITY', 'DAMAGE', 'DEMURRAGE', 'DISPATCH', 'INSURANCE', 'SUPPLIER', 'CARRIER', 'SURVEY', 'OTHER');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'SETTLED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesAllocationStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIAL_DELIVERED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GatePassType" AS ENUM ('TRUCK_IN', 'TRUCK_OUT', 'LIGHTER_IN', 'LIGHTER_OUT', 'WAREHOUSE_RECEIPT', 'VISITOR', 'OTHER');

-- CreateEnum
CREATE TYPE "GatePassStatus" AS ENUM ('ISSUED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'APPROVE', 'REJECT', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'CORRECTION');

-- CreateEnum
CREATE TYPE "PeriodClosingStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'CLOSED', 'LOCKED', 'REOPENED');

-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UserSessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BackgroundJobType" AS ENUM ('INVENTORY_REBUILD', 'VESSEL_SUMMARY_REBUILD', 'NOTIFICATION_DISPATCH', 'WEBHOOK_DISPATCH', 'IMPORT_PROCESSING', 'EXPORT_GENERATION', 'DOCUMENT_EXPIRY_SCAN', 'OVERDUE_TRUCK_SCAN', 'PERIOD_CLOSING', 'ARCHIVE_RUN', 'PARTITION_MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "BackgroundJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'RETRYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportExportType" AS ENUM ('IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "ImportExportFormat" AS ENUM ('CSV', 'XLSX', 'JSON', 'PDF');

-- CreateEnum
CREATE TYPE "ImportExportStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'PARTIAL_COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WebhookEndpointStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISABLED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'RETRYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IntegrationEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportVisibility" AS ENUM ('PRIVATE', 'ROLE', 'ORGANIZATION', 'COMPANY', 'PUBLIC');

-- CreateEnum
CREATE TYPE "RetentionAction" AS ENUM ('KEEP', 'ARCHIVE', 'DELETE', 'ANONYMIZE');

-- CreateEnum
CREATE TYPE "RetentionRunStatus" AS ENUM ('PLANNED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartitionStatus" AS ENUM ('PLANNED', 'ACTIVE', 'SEALED', 'ARCHIVED', 'DROPPED');

-- CreateEnum
CREATE TYPE "SettingScope" AS ENUM ('GLOBAL', 'COMPANY', 'ORGANIZATION', 'LOCATION', 'USER');

-- CreateEnum
CREATE TYPE "BusinessRuleCategory" AS ENUM ('COMMERCIAL', 'LC_CONTROL', 'DOCUMENT_CONTROL', 'VESSEL_OPERATION', 'LIGHTER_OPERATION', 'SURVEY_CONTROL', 'GHAT_OPERATION', 'TRUCK_DELIVERY', 'INVENTORY_CONTROL', 'COST_CONTROL', 'QUALITY_CONTROL', 'SECURITY_CONTROL', 'PERIOD_LOCK', 'INTEGRATION_CONTROL', 'OTHER');

-- CreateEnum
CREATE TYPE "BusinessRuleSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BusinessRuleAction" AS ENUM ('ALLOW', 'WARN', 'REQUIRE_APPROVAL', 'BLOCK');

-- CreateEnum
CREATE TYPE "BusinessRuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RuleViolationStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'OVERRIDDEN', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PermissionResource" AS ENUM ('MASTER_DATA', 'PROCUREMENT', 'CONTRACT', 'PI', 'LC', 'DOCUMENT', 'VESSEL', 'LIGHTER', 'SURVEY', 'GHAT', 'SILO', 'TRUCK', 'INVENTORY', 'COST', 'QUALITY', 'CLAIM', 'SALES', 'GATE', 'REPORT', 'AUDIT', 'INTEGRATION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT', 'CLOSE', 'REOPEN', 'OVERRIDE', 'MANAGE');

-- CreateEnum
CREATE TYPE "PermissionEffect" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "OperationalLockStatus" AS ENUM ('ACTIVE', 'RELEASED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DashboardWidgetType" AS ENUM ('KPI', 'TABLE', 'LINE_CHART', 'BAR_CHART', 'PIE_CHART', 'MAP', 'TIMELINE', 'QUEUE', 'ALERT_LIST');

-- CreateEnum
CREATE TYPE "PerformanceMetricType" AS ENUM ('API_REQUEST', 'DB_QUERY', 'BACKGROUND_JOB', 'REPORT', 'WEBHOOK', 'IMPORT_EXPORT', 'DASHBOARD');

-- CreateEnum
CREATE TYPE "DataQualityCheckStatus" AS ENUM ('QUEUED', 'RUNNING', 'PASSED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DataQualityIssueStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'WAIVED');

-- CreateEnum
CREATE TYPE "ScaleTableRole" AS ENUM ('MASTER', 'TRANSACTION', 'LEDGER', 'EVENT', 'QUEUE', 'SNAPSHOT', 'AUDIT', 'CACHE');

-- CreateEnum
CREATE TYPE "PartitionGranularity" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'HASH');

-- CreateEnum
CREATE TYPE "BatchItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'SKIPPED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AppRole" ADD VALUE 'SYSTEM_ADMIN';
ALTER TYPE "AppRole" ADD VALUE 'APPROVAL_ADMIN';
ALTER TYPE "AppRole" ADD VALUE 'INTEGRATION_ADMIN';
ALTER TYPE "AppRole" ADD VALUE 'QUALITY_CONTROLLER';
ALTER TYPE "AppRole" ADD VALUE 'SECURITY_GATE';
ALTER TYPE "AppRole" ADD VALUE 'COST_ACCOUNTANT';
ALTER TYPE "AppRole" ADD VALUE 'SALES_COORDINATOR';

-- AlterTable
ALTER TABLE "lighter_trip_events" ADD COLUMN     "operation_batch_id" TEXT;

-- AlterTable
ALTER TABLE "sof_events" ADD COLUMN     "operation_batch_id" TEXT;

-- AlterTable
ALTER TABLE "sof_hourly_statuses" ADD COLUMN     "operation_batch_id" TEXT;

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "operation_batch_id" TEXT;

-- AlterTable
ALTER TABLE "truck_loads" ADD COLUMN     "operation_batch_id" TEXT;

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "request_no" TEXT NOT NULL,
    "entity_type" "WorkflowEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'REQUESTED',
    "requested_by_id" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "final_decision_by_id" TEXT,
    "final_decision_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_steps" (
    "id" TEXT NOT NULL,
    "approval_request_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "role" "AppRole",
    "approver_user_id" TEXT,
    "status" "ApprovalStepStatus" NOT NULL DEFAULT 'PENDING',
    "decided_by_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_attachments" (
    "id" TEXT NOT NULL,
    "attachment_no" TEXT,
    "entity_type" "AttachmentEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "document_type" TEXT,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT,
    "file_size_bytes" INTEGER,
    "version_no" INTEGER NOT NULL DEFAULT 1,
    "status" "AttachmentStatus" NOT NULL DEFAULT 'UPLOADED',
    "issue_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "uploaded_by_id" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_checklist_items" (
    "id" TEXT NOT NULL,
    "entity_type" "AttachmentEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'REQUIRED',
    "due_date" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "attachment_id" TEXT,
    "responsible_role" "AppRole",
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "notification_no" TEXT,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "recipient_user_id" TEXT,
    "recipient_role" "AppRole",
    "entity_type" "WorkflowEntityType",
    "entity_id" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "failed_reason" TEXT,
    "operation_batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_entries" (
    "id" TEXT NOT NULL,
    "cost_no" TEXT NOT NULL,
    "cost_type" "CostType" NOT NULL,
    "status" "CostStatus" NOT NULL DEFAULT 'ESTIMATED',
    "entity_type" "WorkflowEntityType",
    "entity_id" TEXT,
    "vessel_call_id" TEXT,
    "lighter_trip_id" TEXT,
    "truck_load_id" TEXT,
    "vendor_org_id" TEXT,
    "product_id" TEXT,
    "quantity_mt" DECIMAL(18,3),
    "rate" DECIMAL(18,4),
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchange_rate" DECIMAL(18,6),
    "amount_local" DECIMAL(18,2),
    "invoice_no" TEXT,
    "invoice_date" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_inspections" (
    "id" TEXT NOT NULL,
    "inspection_no" TEXT NOT NULL,
    "entity_type" "AttachmentEntityType",
    "entity_id" TEXT,
    "product_id" TEXT,
    "vessel_call_id" TEXT,
    "lighter_trip_id" TEXT,
    "ghat_unloading_id" TEXT,
    "truck_load_id" TEXT,
    "sample_no" TEXT,
    "sample_taken_at" TIMESTAMP(3),
    "sample_taken_by_id" TEXT,
    "lab_name" TEXT,
    "lab_report_no" TEXT,
    "lab_report_date" TIMESTAMP(3),
    "status" "QualityInspectionStatus" NOT NULL DEFAULT 'DRAFT',
    "overall_result" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_parameter_results" (
    "id" TEXT NOT NULL,
    "inspection_id" TEXT NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "unit" TEXT,
    "expected_min" DECIMAL(18,4),
    "expected_max" DECIMAL(18,4),
    "actual_value" DECIMAL(18,4),
    "text_value" TEXT,
    "passed" BOOLEAN,
    "remarks" TEXT,

    CONSTRAINT "quality_parameter_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "claim_no" TEXT NOT NULL,
    "claim_type" "ClaimType" NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "entity_type" "WorkflowEntityType",
    "entity_id" TEXT,
    "against_org_id" TEXT,
    "raised_by_org_id" TEXT,
    "vessel_call_id" TEXT,
    "lighter_trip_id" TEXT,
    "truck_load_id" TEXT,
    "product_id" TEXT,
    "claimed_qty_mt" DECIMAL(18,3),
    "claimed_amount" DECIMAL(18,2),
    "currency" TEXT DEFAULT 'USD',
    "reason" TEXT,
    "submitted_at" TIMESTAMP(3),
    "settled_qty_mt" DECIMAL(18,3),
    "settled_amount" DECIMAL(18,2),
    "settled_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_allocations" (
    "id" TEXT NOT NULL,
    "allocation_no" TEXT NOT NULL,
    "customer_org_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "vessel_call_id" TEXT,
    "lc_release_id" TEXT,
    "allocation_type" "SaleAllocationType" NOT NULL,
    "status" "SalesAllocationStatus" NOT NULL DEFAULT 'DRAFT',
    "allocated_qty_mt" DECIMAL(18,3) NOT NULL,
    "delivered_qty_mt" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "balance_qty_mt" DECIMAL(18,3),
    "rate_per_mt" DECIMAL(18,4),
    "currency" TEXT DEFAULT 'BDT',
    "delivery_location_id" TEXT,
    "delivery_address" TEXT,
    "delivery_deadline" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_passes" (
    "id" TEXT NOT NULL,
    "gate_pass_no" TEXT NOT NULL,
    "type" "GatePassType" NOT NULL,
    "status" "GatePassStatus" NOT NULL DEFAULT 'ISSUED',
    "location_id" TEXT,
    "truck_load_id" TEXT,
    "truck_no" TEXT,
    "lighter_trip_id" TEXT,
    "driver_name" TEXT,
    "driver_phone" TEXT,
    "issued_by_id" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "checked_in_at" TIMESTAMP(3),
    "checked_out_at" TIMESTAMP(3),
    "checked_by_id" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gate_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" "WorkflowEntityType",
    "entity_name" TEXT,
    "entity_id" TEXT,
    "action" "AuditActionType" NOT NULL,
    "actor_user_id" TEXT,
    "actor_role" "AppRole",
    "operation_batch_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_closings" (
    "id" TEXT NOT NULL,
    "closing_no" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "product_id" TEXT,
    "location_type" "StockLocationType",
    "location_ref_id" TEXT,
    "status" "PeriodClosingStatus" NOT NULL DEFAULT 'OPEN',
    "opening_qty_mt" DECIMAL(18,3),
    "received_qty_mt" DECIMAL(18,3),
    "issued_qty_mt" DECIMAL(18,3),
    "adjustment_qty_mt" DECIMAL(18,3),
    "closing_qty_mt" DECIMAL(18,3),
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "closed_by_id" TEXT,
    "closed_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "period_closings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_policies" (
    "id" TEXT NOT NULL,
    "policy_no" TEXT NOT NULL,
    "role" "AppRole" NOT NULL,
    "resource" "PermissionResource" NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "effect" "PermissionEffect" NOT NULL DEFAULT 'ALLOW',
    "organization_id" TEXT,
    "location_id" TEXT,
    "condition_json" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_rules" (
    "id" TEXT NOT NULL,
    "rule_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "BusinessRuleCategory" NOT NULL,
    "entity_type" "WorkflowEntityType",
    "trigger_event" TEXT NOT NULL,
    "severity" "BusinessRuleSeverity" NOT NULL DEFAULT 'ERROR',
    "action" "BusinessRuleAction" NOT NULL DEFAULT 'BLOCK',
    "status" "BusinessRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "expression_json" JSONB,
    "message" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_rule_violations" (
    "id" TEXT NOT NULL,
    "violation_no" TEXT NOT NULL,
    "rule_id" TEXT,
    "rule_code" TEXT,
    "entity_type" "WorkflowEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "severity" "BusinessRuleSeverity" NOT NULL,
    "action" "BusinessRuleAction" NOT NULL,
    "status" "RuleViolationStatus" NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "context_json" JSONB,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_by_id" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "override_approval_request_id" TEXT,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_rule_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_locks" (
    "id" TEXT NOT NULL,
    "lock_no" TEXT NOT NULL,
    "entity_type" "WorkflowEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "lock_reason" TEXT NOT NULL,
    "status" "OperationalLockStatus" NOT NULL DEFAULT 'ACTIVE',
    "locked_by_id" TEXT,
    "locked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "released_by_id" TEXT,
    "released_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_definitions" (
    "id" TEXT NOT NULL,
    "dashboard_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dashboard_key" TEXT NOT NULL,
    "visibility" "ReportVisibility" NOT NULL DEFAULT 'PRIVATE',
    "owner_user_id" TEXT,
    "role" "AppRole",
    "organization_id" TEXT,
    "filter_json" JSONB,
    "refresh_seconds" INTEGER DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widgets" (
    "id" TEXT NOT NULL,
    "dashboard_id" TEXT NOT NULL,
    "widget_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DashboardWidgetType" NOT NULL,
    "query_key" TEXT NOT NULL,
    "config_json" JSONB,
    "position_json" JSONB,
    "refresh_seconds" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_caches" (
    "id" TEXT NOT NULL,
    "cache_key" TEXT NOT NULL,
    "dashboard_id" TEXT,
    "dashboard_key" TEXT NOT NULL,
    "widget_key" TEXT,
    "filter_hash" TEXT,
    "payload" JSONB NOT NULL,
    "row_count" BIGINT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_caches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL,
    "metric_type" "PerformanceMetricType" NOT NULL,
    "route" TEXT,
    "query_key" TEXT,
    "entity_type" "WorkflowEntityType",
    "entity_id" TEXT,
    "duration_ms" INTEGER NOT NULL,
    "row_count" BIGINT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_quality_checks" (
    "id" TEXT NOT NULL,
    "check_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entity_type" "WorkflowEntityType",
    "rule_code" TEXT,
    "status" "DataQualityCheckStatus" NOT NULL DEFAULT 'QUEUED',
    "total_rows" BIGINT,
    "checked_rows" BIGINT,
    "issue_count" BIGINT,
    "result_json" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_quality_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_quality_issues" (
    "id" TEXT NOT NULL,
    "issue_no" TEXT NOT NULL,
    "check_id" TEXT,
    "entity_type" "WorkflowEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "severity" "BusinessRuleSeverity" NOT NULL DEFAULT 'ERROR',
    "status" "DataQualityIssueStatus" NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "context_json" JSONB,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_by_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "data_quality_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scale_table_policies" (
    "id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "table_role" "ScaleTableRole" NOT NULL DEFAULT 'TRANSACTION',
    "partition_key" TEXT,
    "partition_granularity" "PartitionGranularity" NOT NULL DEFAULT 'NONE',
    "retention_days" INTEGER,
    "archive_after_days" INTEGER,
    "hot_window_days" INTEGER,
    "cursor_column" TEXT,
    "cursor_tie_breaker" TEXT DEFAULT 'id',
    "max_online_rows" BIGINT,
    "is_append_only" BOOLEAN NOT NULL DEFAULT false,
    "summary_strategy" TEXT,
    "read_pattern" TEXT,
    "write_pattern" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scale_table_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_operation_batches" (
    "id" TEXT NOT NULL,
    "batch_no" TEXT NOT NULL,
    "batch_type" "BackgroundJobType" NOT NULL DEFAULT 'OTHER',
    "status" "BackgroundJobStatus" NOT NULL DEFAULT 'QUEUED',
    "entity_type" "WorkflowEntityType",
    "entity_id" TEXT,
    "import_export_job_id" TEXT,
    "background_job_id" TEXT,
    "source_file_url" TEXT,
    "total_rows" BIGINT,
    "processed_rows" BIGINT DEFAULT 0,
    "success_rows" BIGINT DEFAULT 0,
    "failed_rows" BIGINT DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "locked_until" TIMESTAMP(3),
    "requested_by_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_operation_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_operation_batch_items" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "sequence_no" BIGINT NOT NULL,
    "source_row_no" BIGINT,
    "entity_type" "WorkflowEntityType",
    "entity_id" TEXT,
    "operation" "AuditActionType",
    "status" "BatchItemStatus" NOT NULL DEFAULT 'PENDING',
    "payload_hash" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bulk_operation_batch_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_sequences" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "period_key" TEXT NOT NULL DEFAULT 'GLOBAL',
    "prefix" TEXT,
    "padding" INTEGER DEFAULT 6,
    "next_value" BIGINT NOT NULL DEFAULT 1,
    "last_issued_value" BIGINT,
    "last_issued_at" TIMESTAMP(3),
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "summary_refresh_states" (
    "id" TEXT NOT NULL,
    "summary_key" TEXT NOT NULL,
    "entity_type" "WorkflowEntityType",
    "entity_id" TEXT,
    "source_table" TEXT,
    "status" "BackgroundJobStatus" NOT NULL DEFAULT 'QUEUED',
    "watermark_at" TIMESTAMP(3),
    "last_started_at" TIMESTAMP(3),
    "last_successful_at" TIMESTAMP(3),
    "last_failed_at" TIMESTAMP(3),
    "processed_rows" BIGINT DEFAULT 0,
    "failed_reason" TEXT,
    "background_job_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "summary_refresh_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_health_snapshots" (
    "id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "scale_table_policy_id" TEXT,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "row_estimate" BIGINT,
    "table_bytes" BIGINT,
    "index_bytes" BIGINT,
    "dead_tuple_estimate" BIGINT,
    "sequential_scans" BIGINT,
    "index_scans" BIGINT,
    "slow_query_count" BIGINT,
    "longest_query_ms" INTEGER,
    "notes" TEXT,

    CONSTRAINT "table_health_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_token_hash" TEXT NOT NULL,
    "refresh_token_hash" TEXT,
    "status" "UserSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_name" TEXT,
    "last_seen_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "key_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "organization_id" TEXT,
    "user_id" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowed_ips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "request_hash" TEXT,
    "response_code" INTEGER,
    "response_body" JSONB,
    "locked_until" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" TEXT NOT NULL,
    "job_no" TEXT NOT NULL,
    "type" "BackgroundJobType" NOT NULL,
    "status" "BackgroundJobStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 100,
    "entity_type" "WorkflowEntityType",
    "entity_id" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "run_after" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_reason" TEXT,
    "locked_by" TEXT,
    "locked_until" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_export_jobs" (
    "id" TEXT NOT NULL,
    "job_no" TEXT NOT NULL,
    "type" "ImportExportType" NOT NULL,
    "format" "ImportExportFormat" NOT NULL,
    "status" "ImportExportStatus" NOT NULL DEFAULT 'QUEUED',
    "entity_type" "WorkflowEntityType",
    "entity_name" TEXT,
    "requested_by_id" TEXT,
    "source_file_url" TEXT,
    "result_file_url" TEXT,
    "total_rows" BIGINT,
    "success_rows" BIGINT,
    "failed_rows" BIGINT,
    "error_summary" JSONB,
    "filter_json" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "endpoint_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret_hash" TEXT,
    "status" "WebhookEndpointStatus" NOT NULL DEFAULT 'ACTIVE',
    "event_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "organization_id" TEXT,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "timeout_seconds" INTEGER NOT NULL DEFAULT 20,
    "last_success_at" TIMESTAMP(3),
    "last_failure_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "delivery_no" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" "WorkflowEntityType",
    "entity_id" TEXT,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "response_code" INTEGER,
    "response_body" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "failed_reason" TEXT,
    "operation_batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_outbox" (
    "id" TEXT NOT NULL,
    "event_no" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "entity_type" "WorkflowEntityType",
    "entity_id" TEXT,
    "status" "IntegrationEventStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "failed_reason" TEXT,
    "operation_batch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_reports" (
    "id" TEXT NOT NULL,
    "report_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "report_key" TEXT NOT NULL,
    "visibility" "ReportVisibility" NOT NULL DEFAULT 'PRIVATE',
    "owner_user_id" TEXT,
    "role" "AppRole",
    "organization_id" TEXT,
    "filter_json" JSONB,
    "column_json" JSONB,
    "schedule_cron" TEXT,
    "last_run_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_snapshots" (
    "id" TEXT NOT NULL,
    "snapshot_no" TEXT NOT NULL,
    "saved_report_id" TEXT,
    "report_key" TEXT NOT NULL,
    "format" "ImportExportFormat" NOT NULL,
    "file_url" TEXT,
    "row_count" BIGINT,
    "generated_by_id" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "filter_json" JSONB,

    CONSTRAINT "report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_retention_policies" (
    "id" TEXT NOT NULL,
    "policy_no" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "scale_table_policy_id" TEXT,
    "action" "RetentionAction" NOT NULL,
    "retain_days" INTEGER NOT NULL,
    "archive_location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archive_runs" (
    "id" TEXT NOT NULL,
    "run_no" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "status" "RetentionRunStatus" NOT NULL DEFAULT 'PLANNED',
    "action" "RetentionAction" NOT NULL,
    "cutoff_date" TIMESTAMP(3) NOT NULL,
    "operation_batch_id" TEXT,
    "rows_scanned" BIGINT,
    "rows_archived" BIGINT,
    "rows_deleted" BIGINT,
    "archive_file_url" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "failed_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archive_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partition_maintenance" (
    "id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "scale_table_policy_id" TEXT,
    "partition_name" TEXT NOT NULL,
    "partition_key" TEXT NOT NULL,
    "range_start" TIMESTAMP(3) NOT NULL,
    "range_end" TIMESTAMP(3) NOT NULL,
    "status" "PartitionStatus" NOT NULL DEFAULT 'PLANNED',
    "row_estimate" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sealed_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "partition_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "scope" "SettingScope" NOT NULL DEFAULT 'GLOBAL',
    "scope_ref_id" TEXT,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "approval_requests_request_no_key" ON "approval_requests"("request_no");

-- CreateIndex
CREATE INDEX "approval_requests_entity_type_entity_id_idx" ON "approval_requests"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "approval_requests_status_requested_at_idx" ON "approval_requests"("status", "requested_at");

-- CreateIndex
CREATE INDEX "approval_requests_requested_by_id_status_idx" ON "approval_requests"("requested_by_id", "status");

-- CreateIndex
CREATE INDEX "approval_requests_entity_type_status_requested_at_idx" ON "approval_requests"("entity_type", "status", "requested_at");

-- CreateIndex
CREATE INDEX "approval_requests_final_decision_at_idx" ON "approval_requests"("final_decision_at");

-- CreateIndex
CREATE INDEX "approval_requests_created_at_idx" ON "approval_requests"("created_at");

-- CreateIndex
CREATE INDEX "approval_steps_role_status_idx" ON "approval_steps"("role", "status");

-- CreateIndex
CREATE INDEX "approval_steps_approver_user_id_status_idx" ON "approval_steps"("approver_user_id", "status");

-- CreateIndex
CREATE INDEX "approval_steps_decided_at_idx" ON "approval_steps"("decided_at");

-- CreateIndex
CREATE INDEX "approval_steps_status_created_at_idx" ON "approval_steps"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "approval_steps_approval_request_id_level_approver_user_id_key" ON "approval_steps"("approval_request_id", "level", "approver_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_attachments_attachment_no_key" ON "document_attachments"("attachment_no");

-- CreateIndex
CREATE INDEX "document_attachments_entity_type_entity_id_idx" ON "document_attachments"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "document_attachments_status_expiry_date_idx" ON "document_attachments"("status", "expiry_date");

-- CreateIndex
CREATE INDEX "document_attachments_uploaded_by_id_uploaded_at_idx" ON "document_attachments"("uploaded_by_id", "uploaded_at");

-- CreateIndex
CREATE INDEX "document_attachments_document_type_status_idx" ON "document_attachments"("document_type", "status");

-- CreateIndex
CREATE INDEX "document_attachments_entity_type_entity_id_document_type_idx" ON "document_attachments"("entity_type", "entity_id", "document_type");

-- CreateIndex
CREATE INDEX "document_attachments_entity_type_entity_id_status_idx" ON "document_attachments"("entity_type", "entity_id", "status");

-- CreateIndex
CREATE INDEX "document_attachments_uploaded_at_idx" ON "document_attachments"("uploaded_at");

-- CreateIndex
CREATE INDEX "document_attachments_verified_at_idx" ON "document_attachments"("verified_at");

-- CreateIndex
CREATE INDEX "document_checklist_items_status_due_date_idx" ON "document_checklist_items"("status", "due_date");

-- CreateIndex
CREATE INDEX "document_checklist_items_responsible_role_status_idx" ON "document_checklist_items"("responsible_role", "status");

-- CreateIndex
CREATE INDEX "document_checklist_items_entity_type_entity_id_status_idx" ON "document_checklist_items"("entity_type", "entity_id", "status");

-- CreateIndex
CREATE INDEX "document_checklist_items_is_mandatory_status_idx" ON "document_checklist_items"("is_mandatory", "status");

-- CreateIndex
CREATE UNIQUE INDEX "document_checklist_items_entity_type_entity_id_document_typ_key" ON "document_checklist_items"("entity_type", "entity_id", "document_type");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_notification_no_key" ON "notifications"("notification_no");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_status_idx" ON "notifications"("recipient_user_id", "status");

-- CreateIndex
CREATE INDEX "notifications_recipient_role_status_idx" ON "notifications"("recipient_role", "status");

-- CreateIndex
CREATE INDEX "notifications_type_status_idx" ON "notifications"("type", "status");

-- CreateIndex
CREATE INDEX "notifications_entity_type_entity_id_idx" ON "notifications"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notifications_scheduled_at_status_idx" ON "notifications"("scheduled_at", "status");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_status_created_at_idx" ON "notifications"("recipient_user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "notifications_recipient_user_id_status_created_at_id_idx" ON "notifications"("recipient_user_id", "status", "created_at", "id");

-- CreateIndex
CREATE INDEX "notifications_recipient_role_status_created_at_idx" ON "notifications"("recipient_role", "status", "created_at");

-- CreateIndex
CREATE INDEX "notifications_recipient_role_status_created_at_id_idx" ON "notifications"("recipient_role", "status", "created_at", "id");

-- CreateIndex
CREATE INDEX "notifications_channel_status_scheduled_at_idx" ON "notifications"("channel", "status", "scheduled_at");

-- CreateIndex
CREATE INDEX "notifications_operation_batch_id_created_at_idx" ON "notifications"("operation_batch_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_id_idx" ON "notifications"("created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "cost_entries_cost_no_key" ON "cost_entries"("cost_no");

-- CreateIndex
CREATE INDEX "cost_entries_cost_type_status_idx" ON "cost_entries"("cost_type", "status");

-- CreateIndex
CREATE INDEX "cost_entries_entity_type_entity_id_idx" ON "cost_entries"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "cost_entries_vessel_call_id_idx" ON "cost_entries"("vessel_call_id");

-- CreateIndex
CREATE INDEX "cost_entries_lighter_trip_id_idx" ON "cost_entries"("lighter_trip_id");

-- CreateIndex
CREATE INDEX "cost_entries_truck_load_id_idx" ON "cost_entries"("truck_load_id");

-- CreateIndex
CREATE INDEX "cost_entries_vendor_org_id_idx" ON "cost_entries"("vendor_org_id");

-- CreateIndex
CREATE INDEX "cost_entries_product_id_idx" ON "cost_entries"("product_id");

-- CreateIndex
CREATE INDEX "cost_entries_invoice_date_status_idx" ON "cost_entries"("invoice_date", "status");

-- CreateIndex
CREATE INDEX "cost_entries_status_created_at_idx" ON "cost_entries"("status", "created_at");

-- CreateIndex
CREATE INDEX "cost_entries_cost_type_status_created_at_idx" ON "cost_entries"("cost_type", "status", "created_at");

-- CreateIndex
CREATE INDEX "cost_entries_vessel_call_id_cost_type_status_idx" ON "cost_entries"("vessel_call_id", "cost_type", "status");

-- CreateIndex
CREATE INDEX "cost_entries_product_id_cost_type_created_at_idx" ON "cost_entries"("product_id", "cost_type", "created_at");

-- CreateIndex
CREATE INDEX "cost_entries_approved_at_idx" ON "cost_entries"("approved_at");

-- CreateIndex
CREATE INDEX "cost_entries_paid_at_idx" ON "cost_entries"("paid_at");

-- CreateIndex
CREATE UNIQUE INDEX "quality_inspections_inspection_no_key" ON "quality_inspections"("inspection_no");

-- CreateIndex
CREATE INDEX "quality_inspections_entity_type_entity_id_idx" ON "quality_inspections"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "quality_inspections_product_id_status_idx" ON "quality_inspections"("product_id", "status");

-- CreateIndex
CREATE INDEX "quality_inspections_vessel_call_id_idx" ON "quality_inspections"("vessel_call_id");

-- CreateIndex
CREATE INDEX "quality_inspections_lighter_trip_id_idx" ON "quality_inspections"("lighter_trip_id");

-- CreateIndex
CREATE INDEX "quality_inspections_truck_load_id_idx" ON "quality_inspections"("truck_load_id");

-- CreateIndex
CREATE INDEX "quality_inspections_sample_taken_at_idx" ON "quality_inspections"("sample_taken_at");

-- CreateIndex
CREATE INDEX "quality_inspections_status_sample_taken_at_idx" ON "quality_inspections"("status", "sample_taken_at");

-- CreateIndex
CREATE INDEX "quality_inspections_vessel_call_id_status_sample_taken_at_idx" ON "quality_inspections"("vessel_call_id", "status", "sample_taken_at");

-- CreateIndex
CREATE INDEX "quality_inspections_product_id_sample_taken_at_idx" ON "quality_inspections"("product_id", "sample_taken_at");

-- CreateIndex
CREATE INDEX "quality_inspections_lab_report_date_idx" ON "quality_inspections"("lab_report_date");

-- CreateIndex
CREATE INDEX "quality_parameter_results_inspection_id_idx" ON "quality_parameter_results"("inspection_id");

-- CreateIndex
CREATE INDEX "quality_parameter_results_parameter_name_idx" ON "quality_parameter_results"("parameter_name");

-- CreateIndex
CREATE INDEX "quality_parameter_results_inspection_id_parameter_name_idx" ON "quality_parameter_results"("inspection_id", "parameter_name");

-- CreateIndex
CREATE INDEX "quality_parameter_results_parameter_name_passed_idx" ON "quality_parameter_results"("parameter_name", "passed");

-- CreateIndex
CREATE UNIQUE INDEX "claims_claim_no_key" ON "claims"("claim_no");

-- CreateIndex
CREATE INDEX "claims_claim_type_status_idx" ON "claims"("claim_type", "status");

-- CreateIndex
CREATE INDEX "claims_entity_type_entity_id_idx" ON "claims"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "claims_against_org_id_status_idx" ON "claims"("against_org_id", "status");

-- CreateIndex
CREATE INDEX "claims_raised_by_org_id_status_idx" ON "claims"("raised_by_org_id", "status");

-- CreateIndex
CREATE INDEX "claims_vessel_call_id_idx" ON "claims"("vessel_call_id");

-- CreateIndex
CREATE INDEX "claims_lighter_trip_id_idx" ON "claims"("lighter_trip_id");

-- CreateIndex
CREATE INDEX "claims_truck_load_id_idx" ON "claims"("truck_load_id");

-- CreateIndex
CREATE INDEX "claims_submitted_at_idx" ON "claims"("submitted_at");

-- CreateIndex
CREATE INDEX "claims_status_submitted_at_idx" ON "claims"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "claims_vessel_call_id_claim_type_status_idx" ON "claims"("vessel_call_id", "claim_type", "status");

-- CreateIndex
CREATE INDEX "claims_product_id_claim_type_status_idx" ON "claims"("product_id", "claim_type", "status");

-- CreateIndex
CREATE INDEX "claims_settled_at_idx" ON "claims"("settled_at");

-- CreateIndex
CREATE INDEX "claims_created_at_idx" ON "claims"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sales_allocations_allocation_no_key" ON "sales_allocations"("allocation_no");

-- CreateIndex
CREATE INDEX "sales_allocations_customer_org_id_status_idx" ON "sales_allocations"("customer_org_id", "status");

-- CreateIndex
CREATE INDEX "sales_allocations_product_id_status_idx" ON "sales_allocations"("product_id", "status");

-- CreateIndex
CREATE INDEX "sales_allocations_vessel_call_id_idx" ON "sales_allocations"("vessel_call_id");

-- CreateIndex
CREATE INDEX "sales_allocations_lc_release_id_idx" ON "sales_allocations"("lc_release_id");

-- CreateIndex
CREATE INDEX "sales_allocations_delivery_location_id_idx" ON "sales_allocations"("delivery_location_id");

-- CreateIndex
CREATE INDEX "sales_allocations_delivery_deadline_status_idx" ON "sales_allocations"("delivery_deadline", "status");

-- CreateIndex
CREATE INDEX "sales_allocations_status_created_at_idx" ON "sales_allocations"("status", "created_at");

-- CreateIndex
CREATE INDEX "sales_allocations_vessel_call_id_status_idx" ON "sales_allocations"("vessel_call_id", "status");

-- CreateIndex
CREATE INDEX "sales_allocations_product_id_vessel_call_id_status_idx" ON "sales_allocations"("product_id", "vessel_call_id", "status");

-- CreateIndex
CREATE INDEX "sales_allocations_customer_org_id_product_id_status_idx" ON "sales_allocations"("customer_org_id", "product_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "gate_passes_gate_pass_no_key" ON "gate_passes"("gate_pass_no");

-- CreateIndex
CREATE INDEX "gate_passes_type_status_idx" ON "gate_passes"("type", "status");

-- CreateIndex
CREATE INDEX "gate_passes_location_id_status_idx" ON "gate_passes"("location_id", "status");

-- CreateIndex
CREATE INDEX "gate_passes_truck_load_id_idx" ON "gate_passes"("truck_load_id");

-- CreateIndex
CREATE INDEX "gate_passes_lighter_trip_id_idx" ON "gate_passes"("lighter_trip_id");

-- CreateIndex
CREATE INDEX "gate_passes_issued_at_idx" ON "gate_passes"("issued_at");

-- CreateIndex
CREATE INDEX "gate_passes_status_issued_at_idx" ON "gate_passes"("status", "issued_at");

-- CreateIndex
CREATE INDEX "gate_passes_location_id_status_issued_at_idx" ON "gate_passes"("location_id", "status", "issued_at");

-- CreateIndex
CREATE INDEX "gate_passes_truck_no_issued_at_idx" ON "gate_passes"("truck_no", "issued_at");

-- CreateIndex
CREATE INDEX "gate_passes_valid_until_status_idx" ON "gate_passes"("valid_until", "status");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_name_entity_id_idx" ON "audit_logs"("entity_name", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_role_created_at_idx" ON "audit_logs"("actor_role", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_operation_batch_id_created_at_idx" ON "audit_logs"("operation_batch_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_id_idx" ON "audit_logs"("created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "period_closings_closing_no_key" ON "period_closings"("closing_no");

-- CreateIndex
CREATE INDEX "period_closings_status_period_end_idx" ON "period_closings"("status", "period_end");

-- CreateIndex
CREATE INDEX "period_closings_product_id_period_end_idx" ON "period_closings"("product_id", "period_end");

-- CreateIndex
CREATE INDEX "period_closings_location_type_location_ref_id_period_end_idx" ON "period_closings"("location_type", "location_ref_id", "period_end");

-- CreateIndex
CREATE INDEX "period_closings_period_start_period_end_status_idx" ON "period_closings"("period_start", "period_end", "status");

-- CreateIndex
CREATE INDEX "period_closings_closed_at_idx" ON "period_closings"("closed_at");

-- CreateIndex
CREATE UNIQUE INDEX "period_closings_period_start_period_end_product_id_location_key" ON "period_closings"("period_start", "period_end", "product_id", "location_type", "location_ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_policies_policy_no_key" ON "permission_policies"("policy_no");

-- CreateIndex
CREATE INDEX "permission_policies_role_resource_action_is_active_idx" ON "permission_policies"("role", "resource", "action", "is_active");

-- CreateIndex
CREATE INDEX "permission_policies_organization_id_role_is_active_idx" ON "permission_policies"("organization_id", "role", "is_active");

-- CreateIndex
CREATE INDEX "permission_policies_location_id_role_is_active_idx" ON "permission_policies"("location_id", "role", "is_active");

-- CreateIndex
CREATE INDEX "permission_policies_priority_idx" ON "permission_policies"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "permission_policies_role_resource_action_organization_id_lo_key" ON "permission_policies"("role", "resource", "action", "organization_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_rules_rule_code_key" ON "business_rules"("rule_code");

-- CreateIndex
CREATE INDEX "business_rules_category_status_idx" ON "business_rules"("category", "status");

-- CreateIndex
CREATE INDEX "business_rules_entity_type_trigger_event_status_idx" ON "business_rules"("entity_type", "trigger_event", "status");

-- CreateIndex
CREATE INDEX "business_rules_action_severity_status_idx" ON "business_rules"("action", "severity", "status");

-- CreateIndex
CREATE INDEX "business_rules_priority_idx" ON "business_rules"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "business_rule_violations_violation_no_key" ON "business_rule_violations"("violation_no");

-- CreateIndex
CREATE INDEX "business_rule_violations_entity_type_entity_id_idx" ON "business_rule_violations"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "business_rule_violations_rule_code_status_idx" ON "business_rule_violations"("rule_code", "status");

-- CreateIndex
CREATE INDEX "business_rule_violations_status_detected_at_idx" ON "business_rule_violations"("status", "detected_at");

-- CreateIndex
CREATE INDEX "business_rule_violations_severity_status_detected_at_idx" ON "business_rule_violations"("severity", "status", "detected_at");

-- CreateIndex
CREATE INDEX "business_rule_violations_action_status_idx" ON "business_rule_violations"("action", "status");

-- CreateIndex
CREATE INDEX "business_rule_violations_resolved_at_idx" ON "business_rule_violations"("resolved_at");

-- CreateIndex
CREATE UNIQUE INDEX "operational_locks_lock_no_key" ON "operational_locks"("lock_no");

-- CreateIndex
CREATE INDEX "operational_locks_entity_type_entity_id_status_idx" ON "operational_locks"("entity_type", "entity_id", "status");

-- CreateIndex
CREATE INDEX "operational_locks_status_locked_at_idx" ON "operational_locks"("status", "locked_at");

-- CreateIndex
CREATE INDEX "operational_locks_expires_at_status_idx" ON "operational_locks"("expires_at", "status");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_definitions_dashboard_no_key" ON "dashboard_definitions"("dashboard_no");

-- CreateIndex
CREATE INDEX "dashboard_definitions_dashboard_key_is_active_idx" ON "dashboard_definitions"("dashboard_key", "is_active");

-- CreateIndex
CREATE INDEX "dashboard_definitions_owner_user_id_is_active_idx" ON "dashboard_definitions"("owner_user_id", "is_active");

-- CreateIndex
CREATE INDEX "dashboard_definitions_role_is_active_idx" ON "dashboard_definitions"("role", "is_active");

-- CreateIndex
CREATE INDEX "dashboard_definitions_organization_id_is_active_idx" ON "dashboard_definitions"("organization_id", "is_active");

-- CreateIndex
CREATE INDEX "dashboard_widgets_dashboard_id_is_active_idx" ON "dashboard_widgets"("dashboard_id", "is_active");

-- CreateIndex
CREATE INDEX "dashboard_widgets_query_key_is_active_idx" ON "dashboard_widgets"("query_key", "is_active");

-- CreateIndex
CREATE INDEX "dashboard_widgets_type_is_active_idx" ON "dashboard_widgets"("type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_widgets_dashboard_id_widget_key_key" ON "dashboard_widgets"("dashboard_id", "widget_key");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_caches_cache_key_key" ON "dashboard_caches"("cache_key");

-- CreateIndex
CREATE INDEX "dashboard_caches_dashboard_key_expires_at_idx" ON "dashboard_caches"("dashboard_key", "expires_at");

-- CreateIndex
CREATE INDEX "dashboard_caches_widget_key_expires_at_idx" ON "dashboard_caches"("widget_key", "expires_at");

-- CreateIndex
CREATE INDEX "dashboard_caches_expires_at_idx" ON "dashboard_caches"("expires_at");

-- CreateIndex
CREATE INDEX "dashboard_caches_generated_at_idx" ON "dashboard_caches"("generated_at");

-- CreateIndex
CREATE INDEX "performance_metrics_metric_type_recorded_at_idx" ON "performance_metrics"("metric_type", "recorded_at");

-- CreateIndex
CREATE INDEX "performance_metrics_route_recorded_at_idx" ON "performance_metrics"("route", "recorded_at");

-- CreateIndex
CREATE INDEX "performance_metrics_query_key_recorded_at_idx" ON "performance_metrics"("query_key", "recorded_at");

-- CreateIndex
CREATE INDEX "performance_metrics_entity_type_entity_id_idx" ON "performance_metrics"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "performance_metrics_duration_ms_recorded_at_idx" ON "performance_metrics"("duration_ms", "recorded_at");

-- CreateIndex
CREATE INDEX "performance_metrics_success_recorded_at_idx" ON "performance_metrics"("success", "recorded_at");

-- CreateIndex
CREATE INDEX "performance_metrics_recorded_at_id_idx" ON "performance_metrics"("recorded_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "data_quality_checks_check_no_key" ON "data_quality_checks"("check_no");

-- CreateIndex
CREATE INDEX "data_quality_checks_entity_type_status_idx" ON "data_quality_checks"("entity_type", "status");

-- CreateIndex
CREATE INDEX "data_quality_checks_rule_code_status_idx" ON "data_quality_checks"("rule_code", "status");

-- CreateIndex
CREATE INDEX "data_quality_checks_status_created_at_idx" ON "data_quality_checks"("status", "created_at");

-- CreateIndex
CREATE INDEX "data_quality_checks_completed_at_idx" ON "data_quality_checks"("completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "data_quality_issues_issue_no_key" ON "data_quality_issues"("issue_no");

-- CreateIndex
CREATE INDEX "data_quality_issues_check_id_status_idx" ON "data_quality_issues"("check_id", "status");

-- CreateIndex
CREATE INDEX "data_quality_issues_entity_type_entity_id_idx" ON "data_quality_issues"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "data_quality_issues_severity_status_detected_at_idx" ON "data_quality_issues"("severity", "status", "detected_at");

-- CreateIndex
CREATE INDEX "data_quality_issues_status_detected_at_idx" ON "data_quality_issues"("status", "detected_at");

-- CreateIndex
CREATE INDEX "data_quality_issues_status_detected_at_id_idx" ON "data_quality_issues"("status", "detected_at", "id");

-- CreateIndex
CREATE INDEX "data_quality_issues_resolved_at_idx" ON "data_quality_issues"("resolved_at");

-- CreateIndex
CREATE UNIQUE INDEX "scale_table_policies_table_name_key" ON "scale_table_policies"("table_name");

-- CreateIndex
CREATE INDEX "scale_table_policies_table_role_is_active_idx" ON "scale_table_policies"("table_role", "is_active");

-- CreateIndex
CREATE INDEX "scale_table_policies_partition_granularity_is_active_idx" ON "scale_table_policies"("partition_granularity", "is_active");

-- CreateIndex
CREATE INDEX "scale_table_policies_is_append_only_is_active_idx" ON "scale_table_policies"("is_append_only", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_operation_batches_batch_no_key" ON "bulk_operation_batches"("batch_no");

-- CreateIndex
CREATE INDEX "bulk_operation_batches_batch_type_status_created_at_idx" ON "bulk_operation_batches"("batch_type", "status", "created_at");

-- CreateIndex
CREATE INDEX "bulk_operation_batches_entity_type_entity_id_idx" ON "bulk_operation_batches"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "bulk_operation_batches_import_export_job_id_idx" ON "bulk_operation_batches"("import_export_job_id");

-- CreateIndex
CREATE INDEX "bulk_operation_batches_background_job_id_idx" ON "bulk_operation_batches"("background_job_id");

-- CreateIndex
CREATE INDEX "bulk_operation_batches_status_locked_until_idx" ON "bulk_operation_batches"("status", "locked_until");

-- CreateIndex
CREATE INDEX "bulk_operation_batches_requested_by_id_created_at_idx" ON "bulk_operation_batches"("requested_by_id", "created_at");

-- CreateIndex
CREATE INDEX "bulk_operation_batch_items_batch_id_status_sequence_no_idx" ON "bulk_operation_batch_items"("batch_id", "status", "sequence_no");

-- CreateIndex
CREATE INDEX "bulk_operation_batch_items_entity_type_entity_id_idx" ON "bulk_operation_batch_items"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "bulk_operation_batch_items_status_processed_at_idx" ON "bulk_operation_batch_items"("status", "processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "bulk_operation_batch_items_batch_id_sequence_no_key" ON "bulk_operation_batch_items"("batch_id", "sequence_no");

-- CreateIndex
CREATE INDEX "entity_sequences_scope_idx" ON "entity_sequences"("scope");

-- CreateIndex
CREATE INDEX "entity_sequences_updated_at_idx" ON "entity_sequences"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "entity_sequences_scope_period_key_key" ON "entity_sequences"("scope", "period_key");

-- CreateIndex
CREATE UNIQUE INDEX "summary_refresh_states_summary_key_key" ON "summary_refresh_states"("summary_key");

-- CreateIndex
CREATE INDEX "summary_refresh_states_status_watermark_at_idx" ON "summary_refresh_states"("status", "watermark_at");

-- CreateIndex
CREATE INDEX "summary_refresh_states_entity_type_entity_id_idx" ON "summary_refresh_states"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "summary_refresh_states_source_table_status_idx" ON "summary_refresh_states"("source_table", "status");

-- CreateIndex
CREATE INDEX "summary_refresh_states_background_job_id_idx" ON "summary_refresh_states"("background_job_id");

-- CreateIndex
CREATE INDEX "table_health_snapshots_table_name_measured_at_idx" ON "table_health_snapshots"("table_name", "measured_at");

-- CreateIndex
CREATE INDEX "table_health_snapshots_scale_table_policy_id_measured_at_idx" ON "table_health_snapshots"("scale_table_policy_id", "measured_at");

-- CreateIndex
CREATE INDEX "table_health_snapshots_measured_at_idx" ON "table_health_snapshots"("measured_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_token_hash_key" ON "user_sessions"("session_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_hash_key" ON "user_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_status_idx" ON "user_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_sessions_status_expires_at_idx" ON "user_sessions"("status", "expires_at");

-- CreateIndex
CREATE INDEX "user_sessions_last_seen_at_idx" ON "user_sessions"("last_seen_at");

-- CreateIndex
CREATE INDEX "user_sessions_created_at_idx" ON "user_sessions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_no_key" ON "api_keys"("key_no");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_organization_id_status_idx" ON "api_keys"("organization_id", "status");

-- CreateIndex
CREATE INDEX "api_keys_user_id_status_idx" ON "api_keys"("user_id", "status");

-- CreateIndex
CREATE INDEX "api_keys_status_expires_at_idx" ON "api_keys"("status", "expires_at");

-- CreateIndex
CREATE INDEX "api_keys_last_used_at_idx" ON "api_keys"("last_used_at");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE INDEX "idempotency_keys_locked_until_idx" ON "idempotency_keys"("locked_until");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_scope_key_key" ON "idempotency_keys"("scope", "key");

-- CreateIndex
CREATE UNIQUE INDEX "background_jobs_job_no_key" ON "background_jobs"("job_no");

-- CreateIndex
CREATE INDEX "background_jobs_status_run_after_priority_idx" ON "background_jobs"("status", "run_after", "priority");

-- CreateIndex
CREATE INDEX "background_jobs_status_run_after_priority_id_idx" ON "background_jobs"("status", "run_after", "priority", "id");

-- CreateIndex
CREATE INDEX "background_jobs_type_status_run_after_idx" ON "background_jobs"("type", "status", "run_after");

-- CreateIndex
CREATE INDEX "background_jobs_entity_type_entity_id_idx" ON "background_jobs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "background_jobs_locked_until_idx" ON "background_jobs"("locked_until");

-- CreateIndex
CREATE INDEX "background_jobs_created_at_idx" ON "background_jobs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "import_export_jobs_job_no_key" ON "import_export_jobs"("job_no");

-- CreateIndex
CREATE INDEX "import_export_jobs_type_status_created_at_idx" ON "import_export_jobs"("type", "status", "created_at");

-- CreateIndex
CREATE INDEX "import_export_jobs_type_status_created_at_id_idx" ON "import_export_jobs"("type", "status", "created_at", "id");

-- CreateIndex
CREATE INDEX "import_export_jobs_entity_type_status_idx" ON "import_export_jobs"("entity_type", "status");

-- CreateIndex
CREATE INDEX "import_export_jobs_requested_by_id_created_at_idx" ON "import_export_jobs"("requested_by_id", "created_at");

-- CreateIndex
CREATE INDEX "import_export_jobs_expires_at_idx" ON "import_export_jobs"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_endpoints_endpoint_no_key" ON "webhook_endpoints"("endpoint_no");

-- CreateIndex
CREATE INDEX "webhook_endpoints_organization_id_status_idx" ON "webhook_endpoints"("organization_id", "status");

-- CreateIndex
CREATE INDEX "webhook_endpoints_status_created_at_idx" ON "webhook_endpoints"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_deliveries_delivery_no_key" ON "webhook_deliveries"("delivery_no");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpoint_id_status_next_attempt_at_idx" ON "webhook_deliveries"("endpoint_id", "status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpoint_id_status_next_attempt_at_id_idx" ON "webhook_deliveries"("endpoint_id", "status", "next_attempt_at", "id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_event_type_status_created_at_idx" ON "webhook_deliveries"("event_type", "status", "created_at");

-- CreateIndex
CREATE INDEX "webhook_deliveries_entity_type_entity_id_idx" ON "webhook_deliveries"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_operation_batch_id_created_at_idx" ON "webhook_deliveries"("operation_batch_id", "created_at");

-- CreateIndex
CREATE INDEX "webhook_deliveries_created_at_idx" ON "webhook_deliveries"("created_at");

-- CreateIndex
CREATE INDEX "webhook_deliveries_created_at_id_idx" ON "webhook_deliveries"("created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_outbox_event_no_key" ON "integration_outbox"("event_no");

-- CreateIndex
CREATE INDEX "integration_outbox_status_next_attempt_at_idx" ON "integration_outbox"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "integration_outbox_status_next_attempt_at_id_idx" ON "integration_outbox"("status", "next_attempt_at", "id");

-- CreateIndex
CREATE INDEX "integration_outbox_event_type_status_created_at_idx" ON "integration_outbox"("event_type", "status", "created_at");

-- CreateIndex
CREATE INDEX "integration_outbox_entity_type_entity_id_idx" ON "integration_outbox"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "integration_outbox_operation_batch_id_created_at_idx" ON "integration_outbox"("operation_batch_id", "created_at");

-- CreateIndex
CREATE INDEX "integration_outbox_created_at_idx" ON "integration_outbox"("created_at");

-- CreateIndex
CREATE INDEX "integration_outbox_created_at_id_idx" ON "integration_outbox"("created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_reports_report_no_key" ON "saved_reports"("report_no");

-- CreateIndex
CREATE INDEX "saved_reports_report_key_is_active_idx" ON "saved_reports"("report_key", "is_active");

-- CreateIndex
CREATE INDEX "saved_reports_owner_user_id_is_active_idx" ON "saved_reports"("owner_user_id", "is_active");

-- CreateIndex
CREATE INDEX "saved_reports_visibility_is_active_idx" ON "saved_reports"("visibility", "is_active");

-- CreateIndex
CREATE INDEX "saved_reports_organization_id_is_active_idx" ON "saved_reports"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "report_snapshots_snapshot_no_key" ON "report_snapshots"("snapshot_no");

-- CreateIndex
CREATE INDEX "report_snapshots_saved_report_id_generated_at_idx" ON "report_snapshots"("saved_report_id", "generated_at");

-- CreateIndex
CREATE INDEX "report_snapshots_report_key_generated_at_idx" ON "report_snapshots"("report_key", "generated_at");

-- CreateIndex
CREATE INDEX "report_snapshots_generated_by_id_generated_at_idx" ON "report_snapshots"("generated_by_id", "generated_at");

-- CreateIndex
CREATE INDEX "report_snapshots_expires_at_idx" ON "report_snapshots"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "data_retention_policies_policy_no_key" ON "data_retention_policies"("policy_no");

-- CreateIndex
CREATE INDEX "data_retention_policies_is_active_entity_name_idx" ON "data_retention_policies"("is_active", "entity_name");

-- CreateIndex
CREATE INDEX "data_retention_policies_scale_table_policy_id_is_active_idx" ON "data_retention_policies"("scale_table_policy_id", "is_active");

-- CreateIndex
CREATE INDEX "data_retention_policies_last_run_at_idx" ON "data_retention_policies"("last_run_at");

-- CreateIndex
CREATE UNIQUE INDEX "data_retention_policies_entity_name_action_key" ON "data_retention_policies"("entity_name", "action");

-- CreateIndex
CREATE UNIQUE INDEX "archive_runs_run_no_key" ON "archive_runs"("run_no");

-- CreateIndex
CREATE INDEX "archive_runs_entity_name_status_cutoff_date_idx" ON "archive_runs"("entity_name", "status", "cutoff_date");

-- CreateIndex
CREATE INDEX "archive_runs_operation_batch_id_status_idx" ON "archive_runs"("operation_batch_id", "status");

-- CreateIndex
CREATE INDEX "archive_runs_status_started_at_idx" ON "archive_runs"("status", "started_at");

-- CreateIndex
CREATE INDEX "archive_runs_completed_at_idx" ON "archive_runs"("completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "partition_maintenance_partition_name_key" ON "partition_maintenance"("partition_name");

-- CreateIndex
CREATE INDEX "partition_maintenance_table_name_status_idx" ON "partition_maintenance"("table_name", "status");

-- CreateIndex
CREATE INDEX "partition_maintenance_scale_table_policy_id_status_idx" ON "partition_maintenance"("scale_table_policy_id", "status");

-- CreateIndex
CREATE INDEX "partition_maintenance_range_start_range_end_idx" ON "partition_maintenance"("range_start", "range_end");

-- CreateIndex
CREATE UNIQUE INDEX "partition_maintenance_table_name_range_start_range_end_key" ON "partition_maintenance"("table_name", "range_start", "range_end");

-- CreateIndex
CREATE INDEX "system_settings_key_idx" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_scope_scope_ref_id_idx" ON "system_settings"("scope", "scope_ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_scope_scope_ref_id_key_key" ON "system_settings"("scope", "scope_ref_id", "key");

-- CreateIndex
CREATE INDEX "inventory_balances_balance_date_location_type_idx" ON "inventory_balances"("balance_date", "location_type");

-- CreateIndex
CREATE INDEX "inventory_balances_product_id_location_type_balance_date_idx" ON "inventory_balances"("product_id", "location_type", "balance_date");

-- CreateIndex
CREATE INDEX "inventory_balances_updated_at_idx" ON "inventory_balances"("updated_at");

-- CreateIndex
CREATE INDEX "lighter_trip_events_trip_id_event_time_id_idx" ON "lighter_trip_events"("trip_id", "event_time", "id");

-- CreateIndex
CREATE INDEX "lighter_trip_events_direction_event_time_idx" ON "lighter_trip_events"("direction", "event_time");

-- CreateIndex
CREATE INDEX "lighter_trip_events_trip_id_status_after_event_time_idx" ON "lighter_trip_events"("trip_id", "status_after", "event_time");

-- CreateIndex
CREATE INDEX "lighter_trip_events_operation_batch_id_event_time_idx" ON "lighter_trip_events"("operation_batch_id", "event_time");

-- CreateIndex
CREATE INDEX "lighter_trip_events_event_time_id_idx" ON "lighter_trip_events"("event_time", "id");

-- CreateIndex
CREATE INDEX "lighter_trips_payment_status_assigned_at_idx" ON "lighter_trips"("payment_status", "assigned_at");

-- CreateIndex
CREATE INDEX "lighter_trips_destination_type_status_assigned_at_idx" ON "lighter_trips"("destination_type", "status", "assigned_at");

-- CreateIndex
CREATE INDEX "lighter_trips_loading_started_at_status_idx" ON "lighter_trips"("loading_started_at", "status");

-- CreateIndex
CREATE INDEX "lighter_trips_loading_completed_at_status_idx" ON "lighter_trips"("loading_completed_at", "status");

-- CreateIndex
CREATE INDEX "lighter_trips_unload_completed_at_status_idx" ON "lighter_trips"("unload_completed_at", "status");

-- CreateIndex
CREATE INDEX "mother_vessel_daily_discharges_created_at_idx" ON "mother_vessel_daily_discharges"("created_at");

-- CreateIndex
CREATE INDEX "sof_events_statement_id_event_type_event_time_idx" ON "sof_events"("statement_id", "event_type", "event_time");

-- CreateIndex
CREATE INDEX "sof_events_statement_id_is_hold_event_time_idx" ON "sof_events"("statement_id", "is_hold", "event_time");

-- CreateIndex
CREATE INDEX "sof_events_created_by_created_at_idx" ON "sof_events"("created_by", "created_at");

-- CreateIndex
CREATE INDEX "sof_events_verified_by_verified_at_idx" ON "sof_events"("verified_by", "verified_at");

-- CreateIndex
CREATE INDEX "sof_events_operation_batch_id_event_time_idx" ON "sof_events"("operation_batch_id", "event_time");

-- CreateIndex
CREATE INDEX "sof_events_event_time_id_idx" ON "sof_events"("event_time", "id");

-- CreateIndex
CREATE INDEX "sof_events_statement_id_event_time_id_idx" ON "sof_events"("statement_id", "event_time", "id");

-- CreateIndex
CREATE INDEX "sof_hourly_statuses_statement_id_event_type_hour_start_at_idx" ON "sof_hourly_statuses"("statement_id", "event_type", "hour_start_at");

-- CreateIndex
CREATE INDEX "sof_hourly_statuses_created_by_id_created_at_idx" ON "sof_hourly_statuses"("created_by_id", "created_at");

-- CreateIndex
CREATE INDEX "sof_hourly_statuses_operation_batch_id_hour_start_at_idx" ON "sof_hourly_statuses"("operation_batch_id", "hour_start_at");

-- CreateIndex
CREATE INDEX "sof_hourly_statuses_hour_start_at_id_idx" ON "sof_hourly_statuses"("hour_start_at", "id");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_movement_at_id_idx" ON "stock_movements"("product_id", "movement_at", "id");

-- CreateIndex
CREATE INDEX "stock_movements_vessel_call_id_product_id_movement_at_idx" ON "stock_movements"("vessel_call_id", "product_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_lighter_trip_id_product_id_movement_at_idx" ON "stock_movements"("lighter_trip_id", "product_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_truck_load_id_product_id_movement_at_idx" ON "stock_movements"("truck_load_id", "product_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_from_location_type_from_location_id_product_idx" ON "stock_movements"("from_location_type", "from_location_id", "product_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_to_location_type_to_location_id_product_id__idx" ON "stock_movements"("to_location_type", "to_location_id", "product_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_weight_source_movement_at_idx" ON "stock_movements"("weight_source", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_operation_batch_id_movement_at_idx" ON "stock_movements"("operation_batch_id", "movement_at");

-- CreateIndex
CREATE INDEX "stock_movements_movement_at_id_idx" ON "stock_movements"("movement_at", "id");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "stock_movements_created_at_id_idx" ON "stock_movements"("created_at", "id");

-- CreateIndex
CREATE INDEX "truck_loads_status_dispatched_at_id_idx" ON "truck_loads"("status", "dispatched_at", "id");

-- CreateIndex
CREATE INDEX "truck_loads_delivery_status_delivered_at_idx" ON "truck_loads"("delivery_status", "delivered_at");

-- CreateIndex
CREATE INDEX "truck_loads_estimated_arrival_status_idx" ON "truck_loads"("estimated_arrival", "status");

-- CreateIndex
CREATE INDEX "truck_loads_weighbridge_slip_no_idx" ON "truck_loads"("weighbridge_slip_no");

-- CreateIndex
CREATE INDEX "truck_loads_source_type_status_dispatched_at_idx" ON "truck_loads"("source_type", "status", "dispatched_at");

-- CreateIndex
CREATE INDEX "truck_loads_unloading_id_status_dispatched_at_idx" ON "truck_loads"("unloading_id", "status", "dispatched_at");

-- CreateIndex
CREATE INDEX "truck_loads_silo_receipt_id_status_dispatched_at_idx" ON "truck_loads"("silo_receipt_id", "status", "dispatched_at");

-- CreateIndex
CREATE INDEX "truck_loads_operation_batch_id_dispatched_at_idx" ON "truck_loads"("operation_batch_id", "dispatched_at");

-- CreateIndex
CREATE INDEX "truck_loads_received_at_idx" ON "truck_loads"("received_at");

-- CreateIndex
CREATE INDEX "truck_loads_delivered_at_idx" ON "truck_loads"("delivered_at");

-- CreateIndex
CREATE INDEX "truck_loads_dispatched_at_id_idx" ON "truck_loads"("dispatched_at", "id");

-- CreateIndex
CREATE INDEX "vessel_cargo_summaries_summary_date_idx" ON "vessel_cargo_summaries"("summary_date");

-- CreateIndex
CREATE INDEX "vessel_cargo_summaries_vessel_call_id_last_activity_at_idx" ON "vessel_cargo_summaries"("vessel_call_id", "last_activity_at");

-- CreateIndex
CREATE INDEX "vessel_cargo_summaries_product_id_last_activity_at_idx" ON "vessel_cargo_summaries"("product_id", "last_activity_at");

-- AddForeignKey
ALTER TABLE "sof_events" ADD CONSTRAINT "sof_events_operation_batch_id_fkey" FOREIGN KEY ("operation_batch_id") REFERENCES "bulk_operation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sof_hourly_statuses" ADD CONSTRAINT "sof_hourly_statuses_operation_batch_id_fkey" FOREIGN KEY ("operation_batch_id") REFERENCES "bulk_operation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lighter_trip_events" ADD CONSTRAINT "lighter_trip_events_operation_batch_id_fkey" FOREIGN KEY ("operation_batch_id") REFERENCES "bulk_operation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "truck_loads" ADD CONSTRAINT "truck_loads_operation_batch_id_fkey" FOREIGN KEY ("operation_batch_id") REFERENCES "bulk_operation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_operation_batch_id_fkey" FOREIGN KEY ("operation_batch_id") REFERENCES "bulk_operation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_parameter_results" ADD CONSTRAINT "quality_parameter_results_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "quality_inspections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_operation_batch_id_fkey" FOREIGN KEY ("operation_batch_id") REFERENCES "bulk_operation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_rule_violations" ADD CONSTRAINT "business_rule_violations_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "business_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "dashboard_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_caches" ADD CONSTRAINT "dashboard_caches_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "dashboard_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_quality_issues" ADD CONSTRAINT "data_quality_issues_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "data_quality_checks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_operation_batches" ADD CONSTRAINT "bulk_operation_batches_import_export_job_id_fkey" FOREIGN KEY ("import_export_job_id") REFERENCES "import_export_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_operation_batches" ADD CONSTRAINT "bulk_operation_batches_background_job_id_fkey" FOREIGN KEY ("background_job_id") REFERENCES "background_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_operation_batch_items" ADD CONSTRAINT "bulk_operation_batch_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "bulk_operation_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summary_refresh_states" ADD CONSTRAINT "summary_refresh_states_background_job_id_fkey" FOREIGN KEY ("background_job_id") REFERENCES "background_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_health_snapshots" ADD CONSTRAINT "table_health_snapshots_scale_table_policy_id_fkey" FOREIGN KEY ("scale_table_policy_id") REFERENCES "scale_table_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "webhook_endpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_operation_batch_id_fkey" FOREIGN KEY ("operation_batch_id") REFERENCES "bulk_operation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_outbox" ADD CONSTRAINT "integration_outbox_operation_batch_id_fkey" FOREIGN KEY ("operation_batch_id") REFERENCES "bulk_operation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_saved_report_id_fkey" FOREIGN KEY ("saved_report_id") REFERENCES "saved_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_retention_policies" ADD CONSTRAINT "data_retention_policies_scale_table_policy_id_fkey" FOREIGN KEY ("scale_table_policy_id") REFERENCES "scale_table_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_runs" ADD CONSTRAINT "archive_runs_operation_batch_id_fkey" FOREIGN KEY ("operation_batch_id") REFERENCES "bulk_operation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partition_maintenance" ADD CONSTRAINT "partition_maintenance_scale_table_policy_id_fkey" FOREIGN KEY ("scale_table_policy_id") REFERENCES "scale_table_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_operation_batch_id_fkey" FOREIGN KEY ("operation_batch_id") REFERENCES "bulk_operation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
