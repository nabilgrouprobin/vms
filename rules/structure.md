# VMS Complete Final File and Folder Structure

This is the intended final structure after the full VMS project is completed. It
is the target structure for the finished NestJS backend, Next.js frontend,
PostgreSQL database, Prisma schema, deployment files, scripts, and docs.

Stack:

- Backend: NestJS
- Frontend: Next.js
- Database: PostgreSQL
- ORM: Prisma

```text
VMS/
|-- backend/
|   |-- prisma/
|   |   |-- migrations/
|   |   |   |-- 20260420044820_init/
|   |   |   |   +-- migration.sql
|   |   |   |-- 20260428085542_scale_schema_update/
|   |   |   |   +-- migration.sql
|   |   |   |-- 20260430105000_scale_runtime_controls/
|   |   |   |   +-- migration.sql
|   |   |   +-- migration_lock.toml
|   |   |-- seeds/
|   |   |   |-- app-roles.seed.ts
|   |   |   |-- business-rules.seed.ts
|   |   |   |-- document-checklists.seed.ts
|   |   |   |-- master-data.seed.ts
|   |   |   |-- permission-policies.seed.ts
|   |   |   |-- scale-table-policies.seed.ts
|   |   |   +-- system-settings.seed.ts
|   |   |-- schema.prisma
|   |   +-- seed.ts
|   |-- src/
|   |   |-- common/
|   |   |   |-- constants/
|   |   |   |   |-- app.constants.ts
|   |   |   |   |-- pagination.constants.ts
|   |   |   |   +-- query.constants.ts
|   |   |   |-- decorators/
|   |   |   |   |-- current-user.decorator.ts
|   |   |   |   |-- permissions.decorator.ts
|   |   |   |   +-- public.decorator.ts
|   |   |   |-- filters/
|   |   |   |   +-- http-exception.filter.ts
|   |   |   |-- guards/
|   |   |   |   |-- jwt-auth.guard.ts
|   |   |   |   |-- permissions.guard.ts
|   |   |   |   +-- roles.guard.ts
|   |   |   |-- interceptors/
|   |   |   |   |-- audit.interceptor.ts
|   |   |   |   |-- performance-metric.interceptor.ts
|   |   |   |   +-- response.interceptor.ts
|   |   |   |-- pipes/
|   |   |   |   |-- parse-cuid.pipe.ts
|   |   |   |   +-- validation.pipe.ts
|   |   |   |-- types/
|   |   |   |   |-- api-response.types.ts
|   |   |   |   |-- pagination.types.ts
|   |   |   |   +-- request-context.types.ts
|   |   |   +-- utils/
|   |   |       |-- date-range.util.ts
|   |   |       |-- decimal.util.ts
|   |   |       |-- pagination.util.ts
|   |   |       +-- prisma-error.util.ts
|   |   |-- config/
|   |   |   |-- app.config.ts
|   |   |   |-- database.config.ts
|   |   |   |-- env.validation.ts
|   |   |   |-- jwt.config.ts
|   |   |   +-- storage.config.ts
|   |   |-- prisma/
|   |   |   |-- prisma.module.ts
|   |   |   +-- prisma.service.ts
|   |   |-- modules/
|   |   |   |-- access-control/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-api-key.dto.ts
|   |   |   |   |   |-- create-user.dto.ts
|   |   |   |   |   |-- list-users.query.dto.ts
|   |   |   |   |   |-- update-user.dto.ts
|   |   |   |   |   +-- assign-role.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- access-control.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- access-control.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- access-control.validator.ts
|   |   |   |   |-- access-control.controller.ts
|   |   |   |   |-- access-control.module.ts
|   |   |   |   |-- access-control.repository.ts
|   |   |   |   +-- access-control.service.ts
|   |   |   |-- approval-documents-alerts/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-approval-request.dto.ts
|   |   |   |   |   |-- create-document-attachment.dto.ts
|   |   |   |   |   |-- create-notification.dto.ts
|   |   |   |   |   |-- update-checklist-item.dto.ts
|   |   |   |   |   +-- verify-document.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- approval-documents-alerts.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- approval-documents-alerts.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- approval-documents-alerts.validator.ts
|   |   |   |   |-- approval-documents-alerts.controller.ts
|   |   |   |   |-- approval-documents-alerts.module.ts
|   |   |   |   |-- approval-documents-alerts.repository.ts
|   |   |   |   +-- approval-documents-alerts.service.ts
|   |   |   |-- contracts/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- approve-contract.dto.ts
|   |   |   |   |   |-- create-import-contract.dto.ts
|   |   |   |   |   |-- list-contracts.query.dto.ts
|   |   |   |   |   +-- update-import-contract.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- contracts.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- contracts.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- contracts.validator.ts
|   |   |   |   |-- contracts.controller.ts
|   |   |   |   |-- contracts.module.ts
|   |   |   |   |-- contracts.repository.ts
|   |   |   |   +-- contracts.service.ts
|   |   |   |-- cost-quality-claim-sales/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-claim.dto.ts
|   |   |   |   |   |-- create-cost-entry.dto.ts
|   |   |   |   |   |-- create-quality-inspection.dto.ts
|   |   |   |   |   |-- create-sales-allocation.dto.ts
|   |   |   |   |   +-- update-claim-status.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- cost-quality-claim-sales.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- cost-quality-claim-sales.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- cost-quality-claim-sales.validator.ts
|   |   |   |   |-- cost-quality-claim-sales.controller.ts
|   |   |   |   |-- cost-quality-claim-sales.module.ts
|   |   |   |   |-- cost-quality-claim-sales.repository.ts
|   |   |   |   +-- cost-quality-claim-sales.service.ts
|   |   |   |-- gate-period-audit/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-gate-pass.dto.ts
|   |   |   |   |   |-- create-operational-lock.dto.ts
|   |   |   |   |   |-- create-period-closing.dto.ts
|   |   |   |   |   +-- list-audit-logs.query.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- gate-period-audit.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- gate-period-audit.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- gate-period-audit.validator.ts
|   |   |   |   |-- gate-period-audit.controller.ts
|   |   |   |   |-- gate-period-audit.module.ts
|   |   |   |   |-- gate-period-audit.repository.ts
|   |   |   |   +-- gate-period-audit.service.ts
|   |   |   |-- ghat-silo-truck/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-ghat-unloading.dto.ts
|   |   |   |   |   |-- create-silo-receipt.dto.ts
|   |   |   |   |   |-- create-truck-load.dto.ts
|   |   |   |   |   +-- update-truck-delivery.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- ghat-silo-truck.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- ghat-silo-truck.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- ghat-silo-truck.validator.ts
|   |   |   |   |-- ghat-silo-truck.controller.ts
|   |   |   |   |-- ghat-silo-truck.module.ts
|   |   |   |   |-- ghat-silo-truck.repository.ts
|   |   |   |   +-- ghat-silo-truck.service.ts
|   |   |   |-- inventory/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-stock-correction.dto.ts
|   |   |   |   |   |-- list-inventory-balances.query.dto.ts
|   |   |   |   |   |-- list-stock-movements.query.dto.ts
|   |   |   |   |   +-- rebuild-inventory-balance.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- inventory.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- inventory.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- inventory.validator.ts
|   |   |   |   |-- inventory.controller.ts
|   |   |   |   |-- inventory.module.ts
|   |   |   |   |-- inventory.repository.ts
|   |   |   |   +-- inventory.service.ts
|   |   |   |-- lc/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-lc-application.dto.ts
|   |   |   |   |   |-- create-lc-release.dto.ts
|   |   |   |   |   |-- create-letter-of-credit.dto.ts
|   |   |   |   |   |-- create-proforma-invoice.dto.ts
|   |   |   |   |   +-- update-lc-status.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- lc.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- lc.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- lc.validator.ts
|   |   |   |   |-- lc.controller.ts
|   |   |   |   |-- lc.module.ts
|   |   |   |   |-- lc.repository.ts
|   |   |   |   +-- lc.service.ts
|   |   |   |-- lighter-operations/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- assign-lighter.dto.ts
|   |   |   |   |   |-- create-lighter-trip.dto.ts
|   |   |   |   |   |-- create-lighter-trip-event.dto.ts
|   |   |   |   |   +-- update-lighter-trip-status.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- lighter-operations.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- lighter-operations.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- lighter-operations.validator.ts
|   |   |   |   |-- lighter-operations.controller.ts
|   |   |   |   |-- lighter-operations.module.ts
|   |   |   |   |-- lighter-operations.repository.ts
|   |   |   |   +-- lighter-operations.service.ts
|   |   |   |-- master-data/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-location.dto.ts
|   |   |   |   |   |-- create-organization.dto.ts
|   |   |   |   |   |-- create-product.dto.ts
|   |   |   |   |   |-- create-vessel.dto.ts
|   |   |   |   |   +-- update-master-record.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- master-data.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- master-data.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- master-data.validator.ts
|   |   |   |   |-- master-data.controller.ts
|   |   |   |   |-- master-data.module.ts
|   |   |   |   |-- master-data.repository.ts
|   |   |   |   +-- master-data.service.ts
|   |   |   |-- platform-scale/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-background-job.dto.ts
|   |   |   |   |   |-- create-bulk-operation-batch.dto.ts
|   |   |   |   |   |-- create-scale-table-policy.dto.ts
|   |   |   |   |   +-- list-performance-metrics.query.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- platform-scale.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- platform-scale.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- platform-scale.validator.ts
|   |   |   |   |-- platform-scale.controller.ts
|   |   |   |   |-- platform-scale.module.ts
|   |   |   |   |-- platform-scale.repository.ts
|   |   |   |   +-- platform-scale.service.ts
|   |   |   |-- procurement/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-broker-engagement.dto.ts
|   |   |   |   |   |-- create-procurement-request.dto.ts
|   |   |   |   |   |-- create-supplier-offer.dto.ts
|   |   |   |   |   +-- update-procurement-status.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- procurement.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- procurement.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- procurement.validator.ts
|   |   |   |   |-- procurement.controller.ts
|   |   |   |   |-- procurement.module.ts
|   |   |   |   |-- procurement.repository.ts
|   |   |   |   +-- procurement.service.ts
|   |   |   |-- reporting/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-dashboard.dto.ts
|   |   |   |   |   |-- create-saved-report.dto.ts
|   |   |   |   |   |-- export-report.dto.ts
|   |   |   |   |   +-- list-report-snapshots.query.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- reporting.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- reporting.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- reporting.validator.ts
|   |   |   |   |-- reporting.controller.ts
|   |   |   |   |-- reporting.module.ts
|   |   |   |   |-- reporting.repository.ts
|   |   |   |   +-- reporting.service.ts
|   |   |   |-- shipping-documents/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-bill-of-lading.dto.ts
|   |   |   |   |   |-- create-commercial-invoice.dto.ts
|   |   |   |   |   |-- create-packing-list.dto.ts
|   |   |   |   |   +-- verify-shipping-document.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- shipping-documents.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- shipping-documents.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- shipping-documents.validator.ts
|   |   |   |   |-- shipping-documents.controller.ts
|   |   |   |   |-- shipping-documents.module.ts
|   |   |   |   |-- shipping-documents.repository.ts
|   |   |   |   +-- shipping-documents.service.ts
|   |   |   |-- sof/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-sof-event.dto.ts
|   |   |   |   |   |-- create-sof-hourly-status.dto.ts
|   |   |   |   |   |-- create-statement-of-facts.dto.ts
|   |   |   |   |   +-- verify-sof.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- sof.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- sof.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- sof.validator.ts
|   |   |   |   |-- sof.controller.ts
|   |   |   |   |-- sof.module.ts
|   |   |   |   |-- sof.repository.ts
|   |   |   |   +-- sof.service.ts
|   |   |   |-- survey/
|   |   |   |   |-- dto/
|   |   |   |   |   |-- create-draft-survey.dto.ts
|   |   |   |   |   |-- dispute-draft-survey.dto.ts
|   |   |   |   |   |-- list-draft-surveys.query.dto.ts
|   |   |   |   |   +-- verify-draft-survey.dto.ts
|   |   |   |   |-- constants/
|   |   |   |   |   +-- survey.constants.ts
|   |   |   |   |-- types/
|   |   |   |   |   +-- survey.types.ts
|   |   |   |   |-- validators/
|   |   |   |   |   +-- survey.validator.ts
|   |   |   |   |-- survey.controller.ts
|   |   |   |   |-- survey.module.ts
|   |   |   |   |-- survey.repository.ts
|   |   |   |   +-- survey.service.ts
|   |   |   +-- vessel-operations/
|   |   |       |-- dto/
|   |   |       |   |-- create-vessel-call.dto.ts
|   |   |       |   |-- list-vessel-calls.query.dto.ts
|   |   |       |   |-- tender-nor.dto.ts
|   |   |       |   +-- update-vessel-call.dto.ts
|   |   |       |-- constants/
|   |   |       |   +-- vessel-operations.constants.ts
|   |   |       |-- types/
|   |   |       |   +-- vessel-operations.types.ts
|   |   |       |-- validators/
|   |   |       |   +-- vessel-operations.validator.ts
|   |   |       |-- nor.service.ts
|   |   |       |-- vessel-call.controller.ts
|   |   |       |-- vessel-call.repository.ts
|   |   |       |-- vessel-call.service.ts
|   |   |       |-- vessel-operations.module.ts
|   |   |       +-- vessel-shift.service.ts
|   |   |-- workers/
|   |   |   |-- archive.worker.ts
|   |   |   |-- background-job.worker.ts
|   |   |   |-- data-quality.worker.ts
|   |   |   |-- import-export.worker.ts
|   |   |   |-- integration-outbox.worker.ts
|   |   |   |-- notification.worker.ts
|   |   |   |-- partition-maintenance.worker.ts
|   |   |   |-- summary-refresh.worker.ts
|   |   |   +-- webhook.worker.ts
|   |   |-- app.controller.ts
|   |   |-- app.module.ts
|   |   +-- main.ts
|   |-- test/
|   |   |-- e2e/
|   |   |   |-- access-control.e2e-spec.ts
|   |   |   |-- inventory.e2e-spec.ts
|   |   |   |-- lc.e2e-spec.ts
|   |   |   |-- lighter-operations.e2e-spec.ts
|   |   |   +-- vessel-operations.e2e-spec.ts
|   |   |-- fixtures/
|   |   |   |-- organizations.fixture.ts
|   |   |   |-- products.fixture.ts
|   |   |   |-- users.fixture.ts
|   |   |   +-- vessel-calls.fixture.ts
|   |   +-- unit/
|   |       |-- access-control/
|   |       |-- inventory/
|   |       |-- lc/
|   |       |-- platform-scale/
|   |       +-- vessel-operations/
|   |-- .env
|   |-- .env.example
|   |-- Dockerfile
|   |-- nest-cli.json
|   |-- package-lock.json
|   |-- package.json
|   |-- prisma.config.ts
|   |-- tsconfig.build.json
|   +-- tsconfig.json
|-- frontend/
|   |-- public/
|   |   |-- icons/
|   |   |-- images/
|   |   +-- logos/
|   |-- src/
|   |   |-- app/
|   |   |   |-- (auth)/
|   |   |   |   |-- login/
|   |   |   |   |   +-- page.tsx
|   |   |   |   +-- reset-password/
|   |   |   |       +-- page.tsx
|   |   |   |-- (dashboard)/
|   |   |   |   |-- access-control/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- approval-documents-alerts/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- contracts/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- cost-quality-claim-sales/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- dashboard/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- gate-period-audit/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- ghat-silo-truck/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- inventory/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- lc/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- lighter-operations/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- master-data/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- platform-scale/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- procurement/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- reporting/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- shipping-documents/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- sof/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- survey/
|   |   |   |   |   +-- page.tsx
|   |   |   |   |-- vessel-operations/
|   |   |   |   |   +-- page.tsx
|   |   |   |   +-- layout.tsx
|   |   |   |-- api/
|   |   |   |   +-- health/
|   |   |   |       +-- route.ts
|   |   |   |-- globals.css
|   |   |   |-- layout.tsx
|   |   |   |-- loading.tsx
|   |   |   |-- not-found.tsx
|   |   |   +-- page.tsx
|   |   |-- components/
|   |   |   |-- charts/
|   |   |   |-- data-table/
|   |   |   |-- forms/
|   |   |   |-- layout/
|   |   |   |   |-- AppHeader.tsx
|   |   |   |   |-- AppSidebar.tsx
|   |   |   |   +-- DashboardShell.tsx
|   |   |   |-- modals/
|   |   |   +-- ui/
|   |   |-- features/
|   |   |   |-- access-control/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- approval-documents-alerts/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- contracts/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- cost-quality-claim-sales/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- gate-period-audit/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- ghat-silo-truck/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- inventory/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- lc/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- lighter-operations/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- master-data/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- platform-scale/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- procurement/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- reporting/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- shipping-documents/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- sof/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   |-- survey/
|   |   |   |   |-- actions/
|   |   |   |   |-- api/
|   |   |   |   |-- components/
|   |   |   |   |-- hooks/
|   |   |   |   |-- schemas/
|   |   |   |   |-- types/
|   |   |   |   +-- utils/
|   |   |   +-- vessel-operations/
|   |   |       |-- actions/
|   |   |       |   |-- create-vessel-call.action.ts
|   |   |       |   +-- update-vessel-call.action.ts
|   |   |       |-- api/
|   |   |       |   +-- vessel-operations.api.ts
|   |   |       |-- components/
|   |   |       |   |-- VesselCallDetails.tsx
|   |   |       |   |-- VesselCallForm.tsx
|   |   |       |   +-- VesselCallTable.tsx
|   |   |       |-- hooks/
|   |   |       |   |-- useVesselCall.ts
|   |   |       |   +-- useVesselCallList.ts
|   |   |       |-- schemas/
|   |   |       |   +-- vessel-operations.schema.ts
|   |   |       |-- types/
|   |   |       |   +-- vessel-operations.types.ts
|   |   |       +-- utils/
|   |   |           +-- vessel-operations.utils.ts
|   |   |-- hooks/
|   |   |   |-- useAuth.ts
|   |   |   |-- useDebounce.ts
|   |   |   +-- usePagination.ts
|   |   |-- lib/
|   |   |   |-- api/
|   |   |   |   |-- api-client.ts
|   |   |   |   |-- endpoints.ts
|   |   |   |   +-- query-keys.ts
|   |   |   |-- auth/
|   |   |   |-- constants/
|   |   |   |-- formatters/
|   |   |   |-- schemas/
|   |   |   +-- utils/
|   |   |-- stores/
|   |   |   |-- auth.store.ts
|   |   |   +-- ui.store.ts
|   |   |-- styles/
|   |   |   +-- globals.css
|   |   |-- types/
|   |   |   |-- api.types.ts
|   |   |   |-- auth.types.ts
|   |   |   +-- common.types.ts
|   |   +-- middleware.ts
|   |-- .env.example
|   |-- .env.local
|   |-- Dockerfile
|   |-- next.config.ts
|   |-- package-lock.json
|   |-- package.json
|   |-- postcss.config.js
|   |-- tailwind.config.ts
|   +-- tsconfig.json
|-- database/
|   |-- backups/
|   |   +-- .gitkeep
|   |-- init/
|   |   +-- 001-create-database.sql
|   |-- scripts/
|   |   |-- create-extensions.sql
|   |   |-- create-partitions.sql
|   |   |-- refresh-summary-tables.sql
|   |   +-- vacuum-analyze.sql
|   +-- README.md
|-- docker/
|   |-- backend/
|   |   +-- Dockerfile
|   |-- frontend/
|   |   +-- Dockerfile
|   |-- nginx/
|   |   +-- nginx.conf
|   +-- postgres/
|       |-- init.sql
|       +-- postgresql.conf
|-- docs/
|   |-- api/
|   |   +-- openapi.md
|   |-- database/
|   |   |-- partitioning.md
|   |   |-- retention.md
|   |   +-- schema-notes.md
|   |-- deployment/
|   |   |-- local-development.md
|   |   |-- production.md
|   |   +-- staging.md
|   |-- operations/
|   |   |-- archive-run.md
|   |   |-- background-jobs.md
|   |   |-- data-quality.md
|   |   +-- webhook-retry.md
|   +-- user-guides/
|       |-- inventory.md
|       |-- lc.md
|       |-- lighter-trip.md
|       +-- vessel-call.md
|-- scripts/
|   |-- db/
|   |   |-- migrate.ps1
|   |   |-- reset-dev-db.ps1
|   |   +-- seed.ps1
|   |-- dev/
|   |   |-- start-backend.ps1
|   |   |-- start-frontend.ps1
|   |   +-- start-full-stack.ps1
|   +-- maintenance/
|       |-- archive-old-data.ps1
|       |-- rebuild-inventory-balance.ps1
|       +-- rebuild-vessel-summary.ps1
|-- .env.example
|-- .gitignore
|-- docker-compose.yml
|-- package-lock.json
|-- package.json
|-- README.md
|-- convention.md
|-- features & requirement.md
|-- flow.md
|-- structure.md
```
