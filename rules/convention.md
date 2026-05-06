# VMS Complete Naming and Coding Conventions

This document defines the final file, folder, code, and database naming
conventions for the completed Vessel Management System project. It replaces
generic boilerplate rules with standards that match this project:

- Backend: NestJS 11
- ORM: Prisma 7 with `@prisma/adapter-pg`
- Database: PostgreSQL
- Package manager: npm
- Main schema: `backend/prisma/schema.prisma`
- Main workflow docs: `flow.md` and `features & requirement.md`

Use this file as the naming source of truth when adding new modules, files,
Prisma models, database objects, tests, scripts, and docs.

## 1. Project Principles

- Keep commercial, vessel, lighter, inventory, costing, quality, audit, reporting,
  integration, and scale behavior aligned with the Prisma schema.
- Treat `schema.prisma`, `flow.md`, `features & requirement.md`, `structure.md`, and
  this file as a connected set of documentation.
- Add backend modules gradually, but keep module boundaries close to the business
  domains already defined in the schema.
- Prefer clear domain names over generic names. Use names such as `vessel-call`,
  `lighter-trip`, `lc-release`, `stock-movement`, and `bulk-operation-batch`.
- Large-data behavior is part of the design, not an afterthought.

## 2. Completed Project Naming Conventions

These naming rules apply to the full completed project: NestJS backend, Next.js
frontend, Prisma schema, PostgreSQL database, tests, workers, scripts, and docs.

### Naming Matrix

| Area | Folder naming | File naming | Code symbol naming |
| --- | --- | --- | --- |
| Root folders | lowercase | n/a | n/a |
| Backend modules | kebab-case | kebab-case with suffix | PascalCase classes |
| Backend DTOs | `dto/` | kebab-case plus `.dto.ts` | PascalCase DTO classes |
| Backend query DTOs | `dto/` | kebab-case plus `.query.dto.ts` | PascalCase query DTO classes |
| Backend services | module folder | kebab-case plus `.service.ts` | PascalCase service classes |
| Backend repositories | module folder | kebab-case plus `.repository.ts` | PascalCase repository classes |
| Backend workers | `workers/` | kebab-case plus `.worker.ts` | PascalCase worker classes |
| Frontend routes | kebab-case | Next.js reserved names | PascalCase page helpers when needed |
| Frontend features | kebab-case | kebab-case by domain or PascalCase for components | PascalCase components, camelCase functions |
| Frontend hooks | `hooks/` | `use` plus PascalCase | camelCase hook functions starting with `use` |
| Prisma models | n/a | `schema.prisma` | PascalCase models |
| Prisma fields | n/a | `schema.prisma` | camelCase fields |
| Prisma enums | n/a | `schema.prisma` | PascalCase enums, UPPER_SNAKE_CASE values |
| PostgreSQL tables | n/a | migrations or mapped schema | snake_case plural tables |
| PostgreSQL columns | n/a | migrations or mapped schema | snake_case columns |
| Tests | feature or module folders | kebab-case plus `.spec.ts` or `.e2e-spec.ts` | PascalCase describe names where useful |
| Scripts | kebab-case folders | kebab-case `.ps1`, `.sh`, or `.sql` | camelCase functions inside scripts |
| Docs | kebab-case folders | kebab-case `.md` except existing root docs | n/a |

Default rule: use lowercase kebab-case for folders and normal files. Use
PascalCase only for React component files and TypeScript class names. Keep the
current root doc names for compatibility: `convention.md`, `structure.md`,
`flow.md`, and `features & requirement.md`.

### Root Folders

Use lowercase folder names at the root.

```text
backend/
frontend/
database/
docker/
docs/
scripts/
```

Do not use:

```text
BackEnd/
front_end/
DB/
my scripts/
```

### Backend Folder Names

Backend folders use kebab-case.

```text
access-control/
approval-documents-alerts/
cost-quality-claim-sales/
gate-period-audit/
ghat-silo-truck/
lighter-operations/
master-data/
platform-scale/
shipping-documents/
vessel-operations/
```

### Backend File Names

NestJS source files use kebab-case plus a purpose suffix.

```text
vessel-call.controller.ts
vessel-call.service.ts
vessel-call.repository.ts
vessel-operations.module.ts
create-vessel-call.dto.ts
update-vessel-call.dto.ts
list-vessel-calls.query.dto.ts
vessel-call.validator.ts
vessel-operations.constants.ts
vessel-operations.types.ts
```

Use these suffixes consistently:

```text
*.module.ts
*.controller.ts
*.service.ts
*.repository.ts
*.dto.ts
*.query.dto.ts
*.validator.ts
*.constants.ts
*.types.ts
*.guard.ts
*.decorator.ts
*.filter.ts
*.interceptor.ts
*.pipe.ts
*.worker.ts
*.util.ts
*.config.ts
*.seed.ts
*.spec.ts
*.e2e-spec.ts
```

### Backend Class Names

Classes use PascalCase and match the file purpose.

```ts
export class VesselCallController {}
export class VesselCallService {}
export class VesselCallRepository {}
export class VesselOperationsModule {}
export class CreateVesselCallDto {}
export class ListVesselCallsQueryDto {}
```

### Backend Method and Variable Names

Use camelCase for functions, methods, parameters, and variables.

```ts
const vesselCallId = '...';
const releasedQtyTon = 1000;

async function createVesselCall() {}
async function approveLcRelease() {}
async function rebuildInventoryBalance() {}
```

Constants use UPPER_SNAKE_CASE.

```ts
const DEFAULT_PAGE_SIZE = 50;
const MAX_EXPORT_ROWS = 100000;
const STOCK_MOVEMENT_CURSOR_FIELDS = ['movementAt', 'id'];
```

### Worker Names

Workers use kebab-case and end with `.worker.ts`.

```text
background-job.worker.ts
notification.worker.ts
webhook.worker.ts
integration-outbox.worker.ts
import-export.worker.ts
archive.worker.ts
partition-maintenance.worker.ts
summary-refresh.worker.ts
data-quality.worker.ts
```

Worker classes use PascalCase.

```ts
export class BackgroundJobWorker {}
export class IntegrationOutboxWorker {}
export class SummaryRefreshWorker {}
```

### Frontend Folder Names

Next.js route folders and feature folders use kebab-case.

```text
frontend/src/app/(dashboard)/vessel-operations/
frontend/src/app/(dashboard)/lighter-operations/
frontend/src/features/vessel-operations/
frontend/src/features/platform-scale/
```

### Frontend File Names

Next.js App Router files use the framework names exactly.

```text
page.tsx
layout.tsx
loading.tsx
error.tsx
not-found.tsx
route.ts
middleware.ts
```

Feature files use these patterns:

```text
vessel-operations.api.ts
vessel-operations.schema.ts
vessel-operations.types.ts
vessel-operations.utils.ts
create-vessel-call.action.ts
update-vessel-call.action.ts
delete-vessel-call.action.ts
```

React component files use PascalCase.

```text
VesselCallTable.tsx
VesselCallForm.tsx
VesselCallDetails.tsx
InventoryBalanceCard.tsx
DashboardShell.tsx
```

React hooks use `use` plus PascalCase.

```text
useVesselCall.ts
useVesselCallList.ts
useInventoryBalance.ts
useDebounce.ts
```

### Frontend Symbol Names

Components use PascalCase.

```tsx
export function VesselCallTable() {}
export function InventoryBalanceCard() {}
```

Props types use `ComponentNameProps`.

```ts
type VesselCallTableProps = {
  vesselCallId: string;
};
```

Actions use camelCase plus `Action`.

```ts
export async function createVesselCallAction() {}
export async function updateLcReleaseAction() {}
```

### Prisma Naming

Prisma models use PascalCase.

```prisma
model VesselCall {}
model LighterTrip {}
model StockMovement {}
model BulkOperationBatch {}
```

Prisma fields use camelCase.

```prisma
callNo
vesselCallId
releasedQtyTon
operationBatchId
createdAt
updatedAt
```

Prisma enums use PascalCase and enum values use UPPER_SNAKE_CASE.

```prisma
enum MotherVesselStatus {
  EXPECTED
  ARRIVED
  DISCHARGING
  COMPLETED
}
```

Database tables use snake_case plural names through `@@map`.

```prisma
@@map("vessel_calls")
@@map("lighter_trips")
@@map("stock_movements")
@@map("bulk_operation_batches")
```

Database columns use snake_case through `@map`.

```prisma
callNo           String   @map("call_no")
vesselCallId     String   @map("vessel_call_id")
operationBatchId String?  @map("operation_batch_id")
createdAt        DateTime @map("created_at")
```

### PostgreSQL Naming

Use snake_case for all PostgreSQL objects.

```text
vessel_calls
stock_movements
operation_batch_id
idx_stock_movements_product_movement_at
```

Indexes created by Prisma may use Prisma's generated names. Manual SQL indexes should
use this pattern:

```text
idx_<table>_<main_columns>
```

Examples:

```text
idx_stock_movements_product_movement_at
idx_audit_logs_entity_created_at
idx_webhook_deliveries_status_next_attempt
```

### Migration Names

Migration folders use Prisma timestamp plus snake_case description.

```text
20260420044820_init/
20260428085542_scale_schema_update/
20260430105000_scale_runtime_controls/
```

Manual SQL files use kebab-case or snake_case.

```text
create-partitions.sql
refresh-summary-tables.sql
vacuum-analyze.sql
```

### Seed File Names

Seed files use kebab-case and end with `.seed.ts`.

```text
app-roles.seed.ts
business-rules.seed.ts
document-checklists.seed.ts
master-data.seed.ts
permission-policies.seed.ts
scale-table-policies.seed.ts
system-settings.seed.ts
```

### Test File Names

Unit tests:

```text
vessel-call.service.spec.ts
vessel-call.repository.spec.ts
inventory.service.spec.ts
```

E2E tests:

```text
vessel-operations.e2e-spec.ts
lighter-operations.e2e-spec.ts
inventory.e2e-spec.ts
```

Fixtures:

```text
organizations.fixture.ts
products.fixture.ts
users.fixture.ts
vessel-calls.fixture.ts
```

### Script Names

PowerShell scripts use kebab-case.

```text
migrate.ps1
seed.ps1
reset-dev-db.ps1
start-backend.ps1
start-frontend.ps1
start-full-stack.ps1
rebuild-inventory-balance.ps1
rebuild-vessel-summary.ps1
```

SQL scripts use kebab-case.

```text
create-extensions.sql
create-partitions.sql
refresh-summary-tables.sql
vacuum-analyze.sql
```

### Documentation File Names

Root project docs can keep their current names:

```text
README.md
convention.md
features & requirement.md
flow.md
structure.md
```

Docs inside `docs/` use kebab-case.

```text
local-development.md
production.md
schema-notes.md
background-jobs.md
webhook-retry.md
```

## 3. Module Boundaries

Backend modules should be grouped by business capability, not by database table alone.

Recommended module groups:

- `master-data`: organizations, locations, products, vessels, carriers, lighters, trucks
- `access-control`: users, roles, sessions, API keys, permission policies
- `procurement`: procurement requests, broker engagements, supplier offers
- `contracts`: import contracts and contract lines
- `lc`: PI, LC, LC amendments, LC releases, permits, clearances, bank credit limits
- `shipping-documents`: BL, invoices, packing list, certificates, bill of exchange
- `vessel-operations`: vessel calls, NOR, vessel shifts, cargo lines
- `lighter-operations`: lighter assignments, lighter trips, scouts, trip events
- `sof`: statement of facts, SOF events, hourly statuses, daily discharge
- `survey`: draft surveys and survey reconciliation
- `ghat-silo-truck`: ghat unloading, silo receipts, truck loads, unloading operations
- `inventory`: stock movements, inventory balances, vessel cargo summaries
- `approval-documents-alerts`: approvals, attachments, checklists, notifications
- `cost-quality-claim-sales`: costs, inspections, claims, sales allocations
- `gate-period-audit`: gate passes, period closing, audit logs, operational locks
- `platform-scale`: background jobs, imports/exports, webhooks, outbox, reports,
  retention, partitions, scale policies, batches, table health, data quality

Small modules can start together, but the folder names should still reflect these
boundaries so the project can grow without becoming tangled.

## 4. Backend Module Layout

Every business module should use this shape:

```text
src/modules/<module-name>/
  <module-name>.module.ts
  <module-name>.controller.ts
  <module-name>.service.ts
  <module-name>.repository.ts
  dto/
    create-<entity>.dto.ts
    update-<entity>.dto.ts
    list-<entity>.query.dto.ts
  types/
    <module-name>.types.ts
  constants/
    <module-name>.constants.ts
```

Rules:

- Controllers handle HTTP only.
- Services handle business rules, transactions, status transitions, and orchestration.
- Repositories handle Prisma queries only.
- DTOs validate input and shape query parameters.
- Do not place Prisma calls directly in controllers.
- Do not put unrelated domain logic in generic helper files.

## 5. Prisma Query Rules

The VMS schema has high-volume tables. Query style matters.

High-volume tables include:

- `stock_movements`
- `audit_logs`
- `notifications`
- `sof_events`
- `sof_hourly_statuses`
- `truck_loads`
- `lighter_trip_events`
- `webhook_deliveries`
- `integration_outbox`
- `background_jobs`
- `bulk_operation_batch_items`
- `performance_metrics`
- `data_quality_issues`
- `report_snapshots`

Rules:

- Use pagination on every list endpoint.
- For high-volume tables, prefer seek pagination using indexed date/id pairs.
- Avoid large offset pagination.
- Filter by indexed fields such as status, date, product, vessel call, location,
  entity type/id, user, role, and batch id.
- Avoid deep `include` chains on ledgers, event tables, queues, and audit tables.
- Fetch heavy child collections through separate paginated endpoints.
- Use `select` for list endpoints.
- Use `include` only for small, bounded relations.
- Use transactions for status changes that also write audit, notification, stock,
  outbox, or summary records.

Good list query pattern:

```ts
await prisma.stockMovement.findMany({
  where: {
    productId,
    movementAt: {
      gte: fromDate,
      lt: toDate,
    },
  },
  orderBy: [{ movementAt: 'desc' }, { id: 'desc' }],
  take: limit,
  select: {
    id: true,
    movementNo: true,
    movementType: true,
    productId: true,
    quantityTon: true,
    movementAt: true,
  },
});
```

## 6. Large-Data and Scale Rules

The following models exist specifically for scale control:

- `ScaleTablePolicy`
- `BulkOperationBatch`
- `BulkOperationBatchItem`
- `EntitySequence`
- `SummaryRefreshState`
- `TableHealthSnapshot`
- `PartitionMaintenance`
- `DataRetentionPolicy`
- `ArchiveRun`

Rules:

- Create `ScaleTablePolicy` records for high-volume tables before production use.
- Use `BulkOperationBatch` for imports, exports, archive runs, correction runs,
  summary rebuilds, webhook replays, and integration replays.
- Attach `operationBatchId` when large operations create stock movements, audit logs,
  notifications, SOF events, lighter trip events, truck loads, webhook deliveries,
  outbox rows, or archive runs.
- Use `BulkOperationBatchItem` to track row-level failures.
- Use `EntitySequence` for business numbers. Do not scan or count large tables to
  generate the next number.
- Use `SummaryRefreshState` for incremental rebuild watermarks.
- Use `TableHealthSnapshot` after database maintenance or slow-query reviews.
- Actual PostgreSQL partitions should be created by migrations or database scripts,
  then tracked in `PartitionMaintenance`.

## 7. Quantity, Money, and Counter Rules

- Product and cargo quantities should use `Decimal` with three decimal places.
- Money amounts should use `Decimal(18, 2)`.
- Rates should use `Decimal(18, 4)` or `Decimal(18, 6)` when exchange precision is needed.
- Percentages should use `Decimal(5, 2)` unless higher precision is required.
- Large row counters should use `BigInt`.
- Never use JavaScript floating point numbers for persisted money or quantity math.
- Keep all persisted weight units explicit in field names, for example `quantityMt`
  or `quantityTon`.

## 8. Workflow and Status Rules

- Enforce status transitions in services, not controllers.
- Sensitive changes should create audit logs.
- Approval-required actions should use `ApprovalRequest` and `ApprovalStep`.
- Business-rule failures should use `BusinessRuleViolation`.
- Closed or protected records should use `OperationalLock` where normal edits must stop.
- Stock corrections must be separate `StockMovement` rows, not silent edits to old rows.
- Closed periods must block normal stock changes.
- LC releases must not exceed available LC quantity.
- Lighter, truck, ghat, silo, and stock quantities must remain reconcilable.

## 9. Error Handling and Logging

- Use NestJS exceptions such as `NotFoundException`, `ConflictException`,
  `BadRequestException`, and `ForbiddenException`.
- Do not return `null` as a successful response for required records.
- Do not use `console.log` in application code.
- Log business identifiers where useful: `lcNo`, `callNo`, `tripNo`, `movementNo`,
  `batchNo`, `entityType`, and `entityId`.
- Do not log passwords, tokens, API keys, full document URLs with secrets, or raw files.

## 10. Environment and Configuration

Current required environment variable:

```text
DATABASE_URL
```

Rules:

- Keep `.env` local.
- Commit an `.env.example` when environment setup grows.
- Read environment variables through NestJS config services.
- Validate required environment variables before application startup.
- Keep `DATABASE_URL` compatible with Prisma 7 and PostgreSQL.

## 11. Migrations

Commands:

```powershell
cd D:\SOF\VMS\backend
npm run prisma:validate
npm run prisma:migrate
npm run prisma:generate
npm run build
```

Rules:

- Never edit a migration that has already been applied to shared or production databases.
- In local development, a not-yet-shared failed migration can be fixed before retrying.
- Prefer additive migrations for production data safety.
- Review generated SQL before applying changes that alter required columns, enums, or
  high-volume tables.
- For production/staging, use `npm run prisma:deploy`.

## 12. Testing and Verification

Minimum checks after schema or backend changes:

```powershell
cd D:\SOF\VMS\backend
npm run prisma:validate
npm run prisma:generate
npm run build
```

Add tests as modules are created:

- Unit tests for services and business rules.
- Repository tests for complex query filters.
- Integration tests for status transitions and transaction boundaries.
- Data-quality tests for quantity reconciliation.
- Worker tests for batch processing and retry behavior.

## 13. Import Order and Formatting

Use this import order:

1. External libraries
2. NestJS and Prisma framework imports
3. Internal application modules
4. Relative module files
5. Type-only imports

Formatting rules:

- 2 spaces
- Single quotes
- Semicolons
- Keep functions small and named by business action
- Avoid `any` for service and repository boundaries
- Prefer explicit return types on public service methods

## 14. Commit Conventions

Use conventional commits:

```text
feat(vessel): add vessel call module
fix(prisma): correct scale migration dependency order
docs(structure): align backend layout with VMS domains
perf(inventory): add cursor pagination for stock movements
test(lc): cover release quantity validation
```

Allowed types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `perf`
- `test`
- `chore`

## 15. Documentation Rules

- Update `flow.md` when business process changes.
- Update `features & requirement.md` when feature scope changes.
- Update `structure.md` when folders, modules, or deployment layout changes.
- Update this file when coding, database, migration, or workflow conventions change.
- Keep examples close to the actual VMS domain.
