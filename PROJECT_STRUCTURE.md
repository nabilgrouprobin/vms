# VMS project structure

Snapshot of the repository layout for documentation and onboarding. Generated and bulky folders are omitted so the tree stays readable.

**Omitted directory names:** `node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`, `__pycache__`, `.turbo`, `.cache`

## Refresh this file

Run from the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\write-project-structure.ps1
```

## Tree

```
VMS
+-- .github
|   `-- workflows
|       `-- ci.yml
+-- .idea
|   +-- .gitignore
|   +-- modules.xml
|   +-- VMS.iml
|   `-- workspace.xml
+-- backend
|   +-- prisma
|   |   +-- migrations
|   |   |   +-- 20260420044820_init
|   |   |   |   `-- migration.sql
|   |   |   +-- 20260428085542_scale_schema_update
|   |   |   |   `-- migration.sql
|   |   |   +-- 20260430105000_scale_runtime_controls
|   |   |   |   `-- migration.sql
|   |   |   +-- 20260502084107_laytime_and_lighter_commence
|   |   |   |   `-- migration.sql
|   |   |   +-- 20260503120000_vessel_call_laytime_time_zone
|   |   |   |   `-- migration.sql
|   |   |   +-- 20260503180000_sof_event_duration_minutes
|   |   |   |   `-- migration.sql
|   |   |   `-- migration_lock.toml
|   |   +-- schema.prisma
|   |   `-- seed.ts
|   +-- src
|   |   +-- auth
|   |   |   +-- decorators
|   |   |   |   +-- public.decorator.ts
|   |   |   |   `-- roles.decorator.ts
|   |   |   +-- dto
|   |   |   |   `-- login.dto.ts
|   |   |   +-- guards
|   |   |   |   +-- jwt-auth.guard.ts
|   |   |   |   `-- roles.guard.ts
|   |   |   +-- strategies
|   |   |   |   `-- jwt.strategy.ts
|   |   |   +-- auth.controller.ts
|   |   |   +-- auth.module.ts
|   |   |   +-- auth.service.ts
|   |   |   `-- constants.ts
|   |   +-- modules
|   |   |   +-- import-contracts
|   |   |   |   +-- dto
|   |   |   |   |   `-- update-import-contract.dto.ts
|   |   |   |   +-- import-contracts.controller.ts
|   |   |   |   +-- import-contracts.module.ts
|   |   |   |   `-- import-contracts.service.ts
|   |   |   +-- lighter-trips
|   |   |   |   +-- constants
|   |   |   |   |   `-- lighter-trip-roles.ts
|   |   |   |   +-- dto
|   |   |   |   |   +-- create-lighter-trip.dto.ts
|   |   |   |   |   +-- list-lighter-trips.query.dto.ts
|   |   |   |   |   `-- update-lighter-trip.dto.ts
|   |   |   |   +-- lighter-trip-assignment-sync.ts
|   |   |   |   +-- lighter-trip-board-metrics.ts
|   |   |   |   +-- lighter-trips.controller.ts
|   |   |   |   +-- lighter-trips.module.ts
|   |   |   |   +-- lighter-trips.service.spec.ts
|   |   |   |   `-- lighter-trips.service.ts
|   |   |   +-- sof
|   |   |   |   +-- constants
|   |   |   |   |   +-- sof.constants.ts
|   |   |   |   |   `-- sof-roles.ts
|   |   |   |   +-- dto
|   |   |   |   |   +-- create-lighter-vessel-sof.dto.ts
|   |   |   |   |   +-- create-mother-vessel-daily-discharge.dto.ts
|   |   |   |   |   +-- create-mother-vessel-sof.dto.ts
|   |   |   |   |   +-- create-sof-event.dto.ts
|   |   |   |   |   +-- list-lighter-vessel-sofs.query.dto.ts
|   |   |   |   |   +-- list-mother-vessel-sofs.query.dto.ts
|   |   |   |   |   +-- update-lighter-vessel-sof.dto.ts
|   |   |   |   |   +-- update-mother-vessel-daily-discharge.dto.ts
|   |   |   |   |   +-- update-mother-vessel-sof.dto.ts
|   |   |   |   |   `-- update-sof-event.dto.ts
|   |   |   |   +-- laytime
|   |   |   |   |   +-- laytime-calculation.service.ts
|   |   |   |   |   +-- laytime-calendar-count.spec.ts
|   |   |   |   |   +-- laytime-calendar-count.ts
|   |   |   |   |   +-- laytime-event-accumulation.spec.ts
|   |   |   |   |   +-- laytime-event-accumulation.ts
|   |   |   |   |   +-- laytime-mother-daily-ledger.spec.ts
|   |   |   |   |   `-- laytime-mother-daily-ledger.ts
|   |   |   |   +-- types
|   |   |   |   |   `-- sof.types.ts
|   |   |   |   +-- validators
|   |   |   |   |   +-- sof.validator.spec.ts
|   |   |   |   |   `-- sof.validator.ts
|   |   |   |   +-- sof.controller.ts
|   |   |   |   +-- sof.module.ts
|   |   |   |   +-- sof.repository.ts
|   |   |   |   `-- sof.service.ts
|   |   |   `-- vessel-calls
|   |   |       +-- dto
|   |   |       |   +-- list-vessel-calls.query.dto.ts
|   |   |       |   `-- patch-vessel-call.dto.ts
|   |   |       +-- vessel-calls.controller.ts
|   |   |       +-- vessel-calls.module.ts
|   |   |       `-- vessel-calls.service.ts
|   |   +-- prisma
|   |   |   +-- prisma.module.ts
|   |   |   `-- prisma.service.ts
|   |   +-- app.controller.ts
|   |   +-- app.module.ts
|   |   `-- main.ts
|   +-- .env
|   +-- .env.example
|   +-- nest-cli.json
|   +-- package.json
|   +-- prisma.config.ts
|   +-- tsconfig.build.json
|   `-- tsconfig.json
+-- frontend
|   +-- public
|   |   +-- file.svg
|   |   +-- globe.svg
|   |   +-- next.svg
|   |   +-- vercel.svg
|   |   `-- window.svg
|   +-- src
|   |   +-- app
|   |   |   +-- import-contracts
|   |   |   |   `-- [id]
|   |   |   |       `-- page.tsx
|   |   |   +-- lighter-sof
|   |   |   |   +-- [id]
|   |   |   |   |   +-- loading.tsx
|   |   |   |   |   `-- page.tsx
|   |   |   |   +-- new
|   |   |   |   |   `-- page.tsx
|   |   |   |   `-- page.tsx
|   |   |   +-- login
|   |   |   |   +-- login-form.tsx
|   |   |   |   `-- page.tsx
|   |   |   +-- mother-sof
|   |   |   |   +-- [id]
|   |   |   |   |   +-- loading.tsx
|   |   |   |   |   `-- page.tsx
|   |   |   |   +-- new
|   |   |   |   |   `-- page.tsx
|   |   |   |   `-- page.tsx
|   |   |   +-- mother-vessel-reports
|   |   |   |   `-- page.tsx
|   |   |   +-- reports
|   |   |   |   `-- page.tsx
|   |   |   +-- trips
|   |   |   |   `-- page.tsx
|   |   |   +-- vessel-sof
|   |   |   |   +-- discharge
|   |   |   |   |   `-- page.tsx
|   |   |   |   +-- events
|   |   |   |   |   `-- page.tsx
|   |   |   |   +-- laytime
|   |   |   |   |   `-- page.tsx
|   |   |   |   +-- overview
|   |   |   |   |   `-- page.tsx
|   |   |   |   `-- page.tsx
|   |   |   +-- favicon.ico
|   |   |   +-- globals.css
|   |   |   +-- layout.tsx
|   |   |   `-- page.tsx
|   |   +-- components
|   |   |   +-- auth
|   |   |   |   `-- auth-gate.tsx
|   |   |   +-- providers
|   |   |   |   +-- query-provider.tsx
|   |   |   |   `-- theme-provider.tsx
|   |   |   +-- reports
|   |   |   |   +-- lighter-sof-reports-table.tsx
|   |   |   |   +-- mother-discharge-reports-table.tsx
|   |   |   |   `-- reports-workspace.tsx
|   |   |   +-- sof
|   |   |   |   +-- detail
|   |   |   |   |   +-- index.ts
|   |   |   |   |   +-- lighter-sof-detail-view.tsx
|   |   |   |   |   +-- mother-sof-detail-view.tsx
|   |   |   |   |   +-- sof-add-event-sheet.tsx
|   |   |   |   |   +-- sof-detail-events-tab.tsx
|   |   |   |   |   +-- sof-detail-header.tsx
|   |   |   |   |   +-- sof-detail-laytime-sheets-strip.tsx
|   |   |   |   |   +-- sof-detail-tab-strip.tsx
|   |   |   |   |   `-- types.ts
|   |   |   |   +-- import-contract-laytime-form.tsx
|   |   |   |   +-- laytime-snapshot-toolbar.tsx
|   |   |   |   +-- lighter-sof-discharge-section.tsx
|   |   |   |   +-- lighter-sof-panels.tsx
|   |   |   |   +-- mother-call-discharge-section.tsx
|   |   |   |   +-- mother-laytime-timesheet-table.tsx
|   |   |   |   +-- mother-vessel-panels.tsx
|   |   |   |   +-- mother-vessel-reports-panel.tsx
|   |   |   |   +-- new-vessel-sof-page.tsx
|   |   |   |   +-- sof-detail-grid.tsx
|   |   |   |   +-- sof-detail-page-skeleton.tsx
|   |   |   |   +-- sof-directory-list.tsx
|   |   |   |   +-- sof-events-table.tsx
|   |   |   |   +-- sof-status-badge.tsx
|   |   |   |   +-- vessel-sof-workspace-scaffold.tsx
|   |   |   |   `-- virtual-option-picker.tsx
|   |   |   +-- trips
|   |   |   |   +-- trips-assign-lighter-sheet.tsx
|   |   |   |   +-- trips-trip-activity-sheet.tsx
|   |   |   |   +-- trips-trip-edit-sheet.tsx
|   |   |   |   `-- trips-workspace.tsx
|   |   |   +-- ui
|   |   |   |   +-- badge.tsx
|   |   |   |   +-- button.tsx
|   |   |   |   +-- card.tsx
|   |   |   |   +-- collapsible.tsx
|   |   |   |   +-- dropdown-menu.tsx
|   |   |   |   +-- input.tsx
|   |   |   |   +-- label.tsx
|   |   |   |   +-- sheet.tsx
|   |   |   |   +-- skeleton.tsx
|   |   |   |   `-- tabs.tsx
|   |   |   +-- workspace
|   |   |   |   `-- mother-lighter-picker.tsx
|   |   |   `-- app-shell.tsx
|   |   +-- hooks
|   |   |   `-- use-sof-options.ts
|   |   +-- lib
|   |   |   +-- api.ts
|   |   |   +-- auth-api.ts
|   |   |   +-- auth-storage.ts
|   |   |   +-- format.ts
|   |   |   +-- import-contracts-api.ts
|   |   |   +-- laytime-hours-format.ts
|   |   |   +-- lighter-trips-api.ts
|   |   |   +-- parse-api-error.ts
|   |   |   +-- reports-discharge-table-utils.ts
|   |   |   +-- sof-api.ts
|   |   |   +-- sof-display-utils.ts
|   |   |   +-- sof-event-display.spec.ts
|   |   |   +-- sof-event-display.ts
|   |   |   +-- timezone-gmt.spec.ts
|   |   |   +-- timezone-gmt.ts
|   |   |   +-- trips-permissions.ts
|   |   |   +-- utils.ts
|   |   |   +-- vessel-calls-api.ts
|   |   |   `-- workspace-paths.ts
|   |   `-- types
|   |       `-- vms.ts
|   +-- .env
|   +-- .env.example
|   +-- .gitignore
|   +-- eslint.config.mjs
|   +-- next.config.ts
|   +-- next-env.d.ts
|   +-- package.json
|   +-- postcss.config.mjs
|   +-- README.md
|   +-- tsconfig.json
|   +-- tsconfig.tsbuildinfo
|   `-- vitest.config.ts
+-- rules
|   +-- convention.md
|   +-- features & requirement.md
|   +-- flow.md
|   `-- structure.md
+-- scripts
|   +-- fix-prisma-client-default.cjs
|   +-- gen-project-tree.ps1
|   `-- write-project-structure.ps1
+-- .gitignore
+-- .prettierignore
+-- .prettierrc
+-- package.json
+-- package-lock.json
`-- README.md
```
