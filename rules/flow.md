# VMS Business Workflow Overview

This document explains the end-to-end business workflow covered by the Vessel Management System so a reader can understand the operational design without reading the full Prisma schema.

The system is built around one full import-discharge-delivery cycle:

1. Pre-procurement and sourcing
2. Supplier agreement and contract approval
3. Proforma invoice and LC opening
4. Permit, NOC, and bank compliance
5. LC document collection
6. Vessel nomination and mother vessel arrival
7. Lighter assignment and discharge from mother vessel
8. Draft survey, ghat or silo receipt, and truck dispatch
9. Final delivery to warehouse, factory, or party destination
10. Stock and audit trail reporting
11. Approval, document, notification, costing, quality, claim, and period closing controls

## 1. Master Data Foundation

Before any operation starts, the following master data should exist:

- Organizations
  Supplier, buyer, shipping agent, stevedore, CNF, carrier, surveyor, bank, insurer, transporter, warehouse owner, customer
- Users and roles
  Commercial, finance, operations, port, survey, inventory, ghat, truck dispatch, warehouse, audit
- Locations
  Anchorage, port, ghat, silo, warehouse, office, party destination
- Products
  Commodity definitions with HS code and default unit
- Marine and transport assets
  Mother vessel, lighter vessel, truck
- Control setup
  Approval levels, document checklist templates, notification recipients, cost heads, quality parameters, gate pass locations, and reporting periods

This master data supports all downstream commercial, operational, and reporting activities.

## 2. Pre-Procurement and Sourcing

The workflow begins when the buyer side identifies a product requirement.

### Main process

1. Create a procurement request.
2. Define product, quantity, target shipment period, target arrival period, and expected price.
3. Send the requirement for internal review.
4. Approve the procurement request.
5. Start sourcing through a broker, indentor, or directly with suppliers.

### Main records

- `ProcurementRequest`
- `BrokerEngagement`
- `SupplierOffer`

### Business meaning

- `ProcurementRequest` is the internal demand record.
- `BrokerEngagement` tracks broker or indentor involvement.
- `SupplierOffer` stores supplier quotation and negotiation results.

### Typical statuses

- Procurement Request
  `DRAFT -> UNDER_REVIEW -> APPROVED -> SOURCING -> CLOSED/CANCELLED`
- Broker Engagement / Supplier Offer
  `DRAFT -> ACTIVE -> AGREED/REJECTED/EXPIRED/CANCELLED`

## 3. Supplier Agreement and Contract Approval

After negotiation is complete and both sides agree commercially, the supplier sends a contract draft.

### Main process

1. Supplier sends contract.
2. Buyer reviews contract terms.
3. Internal approval is completed.
4. Buyer sends approved contract back to supplier.
5. Supplier acknowledges and contract becomes operational.

### Main record

- `ImportContract`
- `ImportContractLine`

### What the contract should control

- Supplier and buyer
- Product lines
- Quantity and tolerance
- Shipment period
- LC establishment deadline
- Safe ports and safe anchorages
- Discharge port
- Discharge rate
- Excluded days and working terms

### Typical status

- `DRAFT -> ACTIVE -> CLOSED/CANCELLED`

## 4. Proforma Invoice and LC Preparation

Once the contract is accepted, the supplier sends the proforma invoice.

### Main process

1. Supplier submits PI.
2. Buyer checks PI against contract terms.
3. PI is approved internally.
4. PI becomes the basis for LC opening.

### Main records

- `ProformaInvoice`
- `PiItem`

### PI should contain

- Seller and buyer details
- Commodity description
- Product specs
- Quantity
- Rate and total value
- shipment deadline
- banking and beneficiary details
- packing, marks, origin, discharge destination

### Typical status

- `DRAFT -> PENDING_APPROVAL -> APPROVED -> ACTIVE/USED/CLOSED`

## 5. Import Permit, NOC, and Compliance Collection

Before or during LC preparation, regulatory and commercial compliance must be completed.

### Main process

1. Apply for import permit.
2. Track permit review, issuance, and collection.
3. Collect NOC and other authority clearances as required.
4. Track clearance expiry and status.

### Main records

- `ImportPermit`
- `RegulatoryClearance`

### Regulatory documents may include

- Import permit
- NOC
- quarantine clearance
- customs clearance
- port clearance
- other regulator-specific approvals

### Typical status

- `DRAFT -> APPLIED -> PENDING -> ISSUED -> COLLECTED`
- possible exit states:
  `REJECTED`, `EXPIRED`, `CANCELLED`

## 6. Insurance Cover and Bank Credit Limit

LC opening depends not only on PI but also on insurance and bank credit availability.

### Main process

1. Collect insurance cover note.
2. Check sanctioned bank credit limit.
3. Prepare LC application package.
4. Submit to bank.
5. Resolve bank query if raised.
6. Receive bank sanction and open LC.

### Main records

- `BankCreditLimit`
- `LcApplication`
- `LetterOfCredit`
- `InsuranceAdvice`

### Business meaning

- `BankCreditLimit` stores the sanctioned credit facility and utilization.
- `LcApplication` tracks the application submitted to bank.
- `LetterOfCredit` stores the actual LC after it is opened.
- `InsuranceAdvice` stores insurance-related supporting advice linked to LC or BL.

### Typical status

- LC Application
  `DRAFT -> SUBMITTED -> BANK_QUERY -> SANCTIONED -> LC_OPENED`
- Letter of Credit
  `DRAFT -> PENDING_APPROVAL -> APPROVED -> ACTIVE -> PARTIAL_USED -> FULLY_USED/CLOSED`

## 7. LC Amendment Workflow

If shipment dates, quantities, values, or policy terms must change, LC amendment is used.

### Main process

1. Amendment request is raised.
2. Amendment is reviewed.
3. Approved amendment updates commercial banking terms.

### Main record

- `LcAmendment`

### Typical status

- `DRAFT -> PENDING_APPROVAL -> APPROVED`
- alternative end states:
  `REJECTED`, `REVOKED`, `EXPIRED`

## 8. LC Document Collection from Supplier

After shipment, the supplier sends the document package required under the LC.

### Main process

1. Shipment is completed by supplier.
2. Supplier prepares all shipping and compliance documents.
3. Buyer collects, verifies, and stores the document set.
4. Documents are matched against LC, PI, BL, and vessel call.

### Core document package

- Bill of lading
- Packing list
- Commercial invoice
- Origin certificate
- Phytosanitary certificate
- Fumigation certificate
- Radiation / non-radiation certificate
- Quality and quantity certificate
- Hold cleaning certificate
- Beneficiary certificate
- Bill of exchange
- Health certificate

### Main records

- `BillOfLading`
- `BlItem`
- `PackingList`
- `CommercialInvoice`
- `OriginCertificate`
- `PhytosanitaryCertificate`
- `FumigationCertificate`
- `NonRadiationCertificate`
- `HealthCertificate`
- `CertificateOfWeightQuality`
- `HoldCleaningCertificate`
- `BeneficiaryCertificate`
- `BillOfExchange`
- `InsuranceAdvice`

### Business meaning

`BillOfLading` is the central shipping document. Most supporting shipment certificates are linked to BL and, in some cases, to LC as well.

## 9. Vessel Nomination and Pre-Arrival Coordination

After shipment is confirmed, the supplier nominates a vessel and the importer prepares arrival operations.

### Main process

1. Register or confirm the mother vessel.
2. Create a vessel call for that voyage.
3. Assign shipping agent.
4. Assign CNF.
5. If applicable, assign stevedore.
6. Capture ETA, port information, and expected cargo summary.

### Main records

- `Vessel`
- `VesselCall`
- `VesselCargoLine`
- `NoticeOfReadiness`

### Related organizations

- Supplier
- Shipping agent
- CNF
- Stevedore
- Surveyor
- Carrier

## 10. Mother Vessel Arrival and NOR

When the mother vessel reaches the operational area, the shipping agent sends NOR.

### Main process

1. Mother vessel arrives.
2. Anchor is dropped.
3. Shipping agent tenders NOR.
4. NOR is accepted or rejected.
5. Customs, quarantine, and port clearances are completed.
6. Vessel becomes ready to discharge.

### Main records

- `VesselCall`
- `NoticeOfReadiness`
- `RegulatoryClearance`
- `StatementOfFacts`
- `SofEvent`

### Typical vessel call status

`EXPECTED -> ARRIVED -> ANCHORED -> LC_HOLD -> READY_TO_DISCHARGE -> DISCHARGING -> PARTIAL_DISCHARGED -> COMPLETED -> CLOSED`

### Typical NOR status

`TENDERED -> ACCEPTED`

Possible alternatives:

- `REJECTED`
- `CANCELLED`

## 11. LC Release and Cargo Allocation

Before discharge to lighter begins, quantity must be released against LC for the vessel call.

### Main process

1. Create LC release for the vessel call.
2. Define releasable quantity.
3. Allocate released quantity to lighter assignments and trip cargo.
4. Track used quantity against released quantity.

### Main records

- `LcRelease`
- `VesselCargoLine`
- `LighterAssignment`
- `LighterTripCargo`

### Business meaning

This is the main control point between commercial quantity and physical discharge quantity.

## 12. Carrier Coordination and Lighter Assignment

After vessel readiness, the importer coordinates with carrier for lighter assignment.

### Main process

1. Select carrier.
2. Select lighter vessel.
3. Set destination ghat.
4. Define estimated quantity.
5. Confirm readiness with lighter master.
6. Assign two scouts before loading:
   one from importer side and one from surveyor side
7. If required, stevedore joins the first lighter and returns with the last lighter.

### Main records

- `Carrier`
- `Lighter`
- `LighterAssignment`
- `LighterScout`

### Typical lighter assignment status

`ASSIGNED -> READY_FOR_DEPARTURE -> EN_ROUTE_TO_MV -> WAITING_ALONGSIDE -> ALONGSIDE_MV -> LOADING -> LOADING_COMPLETE -> RETURNING_TO_GHAT -> WAITING_AT_GHAT -> UNLOADING_AT_GHAT -> UNLOADING_COMPLETE -> COMPLETED`

## 13. Lighter Trip Execution

Each physical lighter movement is executed as a trip.

### Main process

1. Create lighter trip from the assignment.
2. Track departure toward mother vessel.
3. Track alongside timing.
4. Track loading start and loading completion.
5. Track departure from MV.
6. Move to draft survey location.
7. Move toward ghat or destination.
8. Track arrival and unloading.

### Main records

- `LighterTrip`
- `LighterTripCargo`
- `LighterTripEvent`
- `LighterScout`

### Typical lighter trip status

`PLANNED -> ASSIGNED -> NOT_READY/READY_TO_SAIL -> OUTBOUND_AT_SEA -> AT_CHECKPOINT -> ALONGSIDE -> PREPARING_TO_LOAD -> LOADING -> LOADED -> DRAFT_SURVEY_STAGING -> DRAFT_SURVEY_IN_PROGRESS -> DRAFT_SURVEY_COMPLETED -> RETURNING_AT_SEA -> ARRIVED_GHAT -> WAITING_UNLOAD -> UNLOADING -> PARTIAL_UNLOADED/UNLOADED -> CLOSED`

## 14. Mother Vessel Discharge Control

The mother vessel can discharge in multiple stages and even shift positions after partial discharge.

### Main process

1. Start discharge at one anchorage or operating position.
2. Record daily vessel discharge quantity.
3. Record holds, delays, and responsibility through SOF events.
4. If vessel draft reduces enough, shift the vessel closer.
5. Continue discharge from a new position.
6. Repeat until all cargo is completed.

### Main records

- `MotherVesselDailyDischarge`
- `StatementOfFacts`
- `SofEvent`
- `SofHourlyStatus`
- `VesselShift`

### Important business rules

- Daily discharge must be captured even if multiple companies or multiple lighters are working.
- Holds may happen for weather, port restriction, operational delay, stevedore issue, labor issue, clearance issue, or other causes.
- SOF must support both operational history and laytime responsibility.
- Vessel shifting is a normal event in this business and must be captured separately.

## 15. SOF for Mother Vessel and Lighter

The system supports two parallel SOF scopes:

- Mother vessel SOF
- Lighter vessel SOF

### Main process

1. Create statement of facts.
2. Capture important events in chronological order.
3. Capture hourly status when detailed operational timeline is required.
4. Mark holds and laytime impact.
5. Verify and approve the SOF.

### Main records

- `StatementOfFacts`
- `SofEvent`
- `SofHourlyStatus`

### Typical SOF status

`DRAFT -> PENDING_VERIFICATION -> VERIFIED -> APPROVED -> CLOSED`

Possible issue status:

- `DISPUTED`

## 16. Draft Survey after Loading

After lighter loading is complete, the lighter goes to the draft survey point for weight verification.

### Main process

1. Conduct pre-load survey readings.
2. Conduct post-load survey readings.
3. Calculate actual loaded cargo weight.
4. Compare draft survey quantity with operational or declared quantity.
5. Record difference and reason if any.

### Main record

- `DraftSurvey`

### Business meaning

Draft survey is the strongest physical quantity confirmation between mother vessel loading and destination receipt.

## 17. Arrival at Ghat and Queue Management

After draft survey, the lighter proceeds to the destination ghat.

### Main process

1. Lighter arrives at ghat.
2. If serial or queue is available, it waits in queue.
3. If no queue problem, unloading preparation starts.
4. Determine unloading method:
   manual bagging and truck loading, direct ghat unloading, or silo-based unloading

### Main records

- `GhatUnloading`
- `UnloadingOperation`
- `UnloadingLine`

## 18. Unloading Method 1: Manual Sack and Truck Loading

In this flow, cargo is manually handled by labor.

### Main process

1. Cargo is unloaded from lighter manually.
2. Cargo is entered into sacks if required.
3. Labor loads sacks or loose cargo onto trucks.
4. Truck is sent to weighbridge.
5. Actual truck weight is captured.
6. Truck departs for warehouse, factory, or party destination.

### Main records

- `GhatUnloading`
- `TruckLoad`

### Typical truck load status

`LOADED -> IN_TRANSIT -> ARRIVED_DESTINATION -> DELIVERED`

Possible alternatives:

- `PARTIAL_DELIVERED`
- `REJECTED`
- `CANCELLED`
- `ON_HOLD`

## 19. Unloading Method 2: Silo-Based Unloading

In this flow, cargo goes from lighter into silo through machine unloading.

### Main process

1. Lighter unloads into silo.
2. Silo receipt is created with exact quantity and quality information.
3. At a later stage, product can be loaded from silo into truck manually or by plant process.
4. Truck is weighed and delivered to final destination.

### Main records

- `SiloReceipt`
- `TruckLoad`
- `GhatUnloading`

## 20. Truck Dispatch and Final Delivery

Truck dispatch completes the last physical movement of the cargo.

### Main process

1. Truck receives cargo from ghat unloading or silo.
2. Gross and tare weights are measured.
3. Net actual delivery quantity is confirmed.
4. Truck leaves for warehouse, factory, party warehouse, or other destination.
5. Receiving party confirms receipt.
6. Final quantity received is recorded.

### Main records

- `Truck`
- `TruckLoad`
- `Warehouse`
- destination `Location`

### Delivery receipt outcomes

- `FULL`
- `PARTIAL`
- `SHORT_RECEIVED`
- `REJECTED`
- `DIFFERENCE_RECEIVED`

## 21. Inventory and Audit Trail

Every major movement should be reflected in the inventory and traceability layer.

### Main process

1. Record stock movement when quantity is commercially released.
2. Record movement from mother vessel to lighter.
3. Record receipt at ghat or silo.
4. Record truck loading.
5. Record truck delivery.
6. Maintain balance snapshots for reporting.
7. Maintain vessel-level cargo progress summaries.

### Main records

- `StockMovement`
- `InventoryBalance`
- `VesselCargoSummary`
- `AuditLog`

### Typical stock movement types

- `MOTHER_VESSEL_OPENING`
- `LC_RELEASE`
- `LIGHTER_LOADED`
- `LIGHTER_RETURNING`
- `GHAT_RECEIVED`
- `SILO_RECEIVED`
- `SILO_ISSUED`
- `WAREHOUSE_RECEIVED`
- `TRUCK_LOADED`
- `TRUCK_DELIVERED`
- `SALE_DELIVERED`
- `DIFFERENCE_ADJUSTMENT`
- `CORRECTION`

## 22. Approval Workflow, Documents, and Notifications

Important business actions should not depend only on a status field. The system should maintain approval history, required document checklists, uploaded files, and operational alerts.

### Main process

1. Create approval request for sensitive records.
2. Route approval to the configured role or user level.
3. Capture approval, rejection, comments, and final decision.
4. Maintain document checklist by business record.
5. Upload scanned files or digital documents against the record.
6. Verify, reject, expire, or archive attachments.
7. Send alerts for pending approvals, missing documents, expiry dates, delays, and mismatches.
8. Evaluate configured business rules before saving sensitive operations.
9. Create rule violations when an operation must be warned, approved, or blocked.
10. Apply operational locks to closed or protected records.

### Main records

- `ApprovalRequest`
- `ApprovalStep`
- `DocumentChecklistItem`
- `DocumentAttachment`
- `Notification`
- `BusinessRule`
- `BusinessRuleViolation`
- `OperationalLock`

### Approval should cover

- Procurement request
- Import contract
- Proforma invoice
- LC application
- Letter of credit
- LC amendment
- LC release
- Permit and regulatory clearance
- Vessel call exception
- Lighter assignment exception
- Draft survey dispute
- Stock correction
- Claim settlement
- Period closing

### Critical business rules should cover

- LC release cannot exceed available LC quantity.
- Lighter assignment cannot exceed released LC quantity.
- Truck delivery cannot exceed received or loaded quantity without approval.
- Expired LC, permit, clearance, or required document can block operation.
- Draft survey difference above tolerance requires reason or approval.
- Closed vessel call blocks new lighter trip, discharge, or stock movement.
- Closed or locked stock period blocks normal inventory edits.
- Stock correction requires approval and audit trail.
- Manual weighbridge override requires approval.
- Claim settlement above configured limit requires approval.

### Document controls should cover

- LC and bank documents
- PI and contract documents
- Permit, NOC, quarantine, customs, and port clearances
- BL and shipping certificates
- NOR and SOF documents
- Draft survey report
- Weighbridge slip
- Truck delivery receipt
- Quality report
- Claim support documents

### Typical approval status

`REQUESTED -> PENDING -> APPROVED`

Possible alternatives:

`REJECTED`, `REVOKED`, `EXPIRED`

### Typical rule violation status

`OPEN -> ACKNOWLEDGED -> RESOLVED`

Possible alternatives:

`OVERRIDDEN`, `CANCELLED`

## 23. Costing and Landed Cost Control

The project should track estimated, accrued, invoiced, approved, disputed, and paid costs so management can calculate landed cost by vessel, product, shipment, trip, or truck delivery.

### Main process

1. Record expected cost when contract, LC, vessel, lighter, ghat, or truck operation is planned.
2. Accrue cost during operation.
3. Match vendor invoice against operational records.
4. Approve payable cost.
5. Mark payment status.
6. Use cost records for landed cost and profitability reporting.

### Main record

- `CostEntry`

### Cost types may include

- LC and bank charge
- Insurance
- CNF
- Shipping agent
- Stevedore
- Carrier and lighter freight
- Ghat unloading
- Labour
- Truck transport
- Survey
- Port charge
- Customs duty
- Demurrage
- Dispatch earning
- Warehouse and silo cost
- Claim settlement

### Typical cost status

`ESTIMATED -> ACCRUED -> INVOICED -> APPROVED -> PAID`

Possible alternatives:

`DISPUTED`, `CANCELLED`

## 24. Quality Control and Claim Management

Quality and shortage problems should be handled as formal operational records, not only remarks.

### Main process

1. Take sample from vessel, lighter, ghat, silo, truck, or warehouse receipt.
2. Record sample number, collector, date, and location.
3. Send sample to lab if required.
4. Record quality parameter results.
5. Compare actual result against expected range.
6. If shortage, damage, or quality issue exists, raise a claim.
7. Attach supporting documents.
8. Track review, settlement, or rejection.

### Main records

- `QualityInspection`
- `QualityParameterResult`
- `Claim`
- `DocumentAttachment`

### Quality parameters may include

- Moisture
- Broken percentage
- Foreign matter
- Damage percentage
- Grade
- Weight condition
- Contamination
- Any product-specific lab value

### Claim types may include

- Shortage
- Quality
- Damage
- Demurrage
- Dispatch
- Insurance
- Supplier
- Carrier
- Survey dispute

### Typical quality status

`DRAFT -> SAMPLE_COLLECTED -> SENT_TO_LAB -> PASSED/FAILED -> CLOSED`

Possible alternative:

`DISPUTED`

### Typical claim status

`DRAFT -> SUBMITTED -> UNDER_REVIEW -> ACCEPTED -> SETTLED -> CLOSED`

Possible alternatives:

`REJECTED`, `CANCELLED`

## 25. Sales Allocation, Gate Pass, and Security Control

After cargo is commercially available, management may allocate quantity to internal locations or customers. Physical movement should be protected by gate-pass controls.

### Main process

1. Allocate vessel or LC release quantity to internal warehouse, own port, party port, or party warehouse.
2. Track allocated, delivered, and balance quantity.
3. Issue gate pass for truck or lighter entry and exit.
4. Capture check-in, check-out, driver, vehicle, location, and security verification.
5. Match truck delivery to sales allocation where applicable.

### Main records

- `SalesAllocation`
- `GatePass`
- `TruckLoad`
- `StockMovement`

### Typical sales allocation status

`DRAFT -> CONFIRMED -> PARTIAL_DELIVERED -> DELIVERED`

Possible alternative:

`CANCELLED`

### Typical gate pass status

`ISSUED -> CHECKED_IN -> CHECKED_OUT`

Possible alternatives:

`CANCELLED`, `EXPIRED`

## 26. Period Closing, Locking, and Audit Control

The system should support month-end or vessel-end closing so approved stock and financial numbers cannot be changed casually.

### Main process

1. Prepare closing for product, location, or period.
2. Summarize opening, receipt, issue, adjustment, and closing quantity.
3. Review stock movement and inventory balance.
4. Resolve mismatches before closing.
5. Close and lock period.
6. Allow reopening only with approval and audit log.

### Main records

- `PeriodClosing`
- `InventoryBalance`
- `StockMovement`
- `AuditLog`
- `ApprovalRequest`

### Typical period closing status

`OPEN -> UNDER_REVIEW -> CLOSED -> LOCKED`

Possible alternative:

`REOPENED`

## 27. Platform, Integration, and Scale Control

Large production data should be handled through background processing, reliable integration queues, controlled imports and exports, saved reports, retention rules, and partition maintenance.

### Main process

1. Track user sessions and API keys for secure access.
2. Use idempotency keys for retry-safe create/update requests.
3. Queue heavy work instead of blocking user screens.
4. Process imports and exports asynchronously.
5. Publish integration events through an outbox.
6. Deliver webhooks with retry tracking.
7. Save reusable reports and generated report snapshots.
8. Apply retention and archive rules to old high-volume data.
9. Track PostgreSQL partition ranges for very large operational tables.
10. Store global, company, organization, location, or user settings centrally.
11. Enforce fine-grained role permission policies.
12. Serve dashboards from cached or summarized data where possible.
13. Record performance metrics for APIs, queries, dashboards, reports, jobs, and integrations.
14. Run data-quality checks to find broken quantities, missing references, stale statuses, and reconciliation mismatches.
15. Define `ScaleTablePolicy` records for every high-volume table.
16. Track large imports, corrections, rebuilds, exports, archive runs, and integration replays through `BulkOperationBatch`.
17. Track failed or skipped batch rows through `BulkOperationBatchItem`.
18. Generate business numbers from `EntitySequence` instead of counting rows.
19. Maintain `SummaryRefreshState` watermarks for incremental summary rebuilds.
20. Capture `TableHealthSnapshot` records after database maintenance and slow-query reviews.

### Main records

- `UserSession`
- `ApiKey`
- `IdempotencyKey`
- `BackgroundJob`
- `ImportExportJob`
- `WebhookEndpoint`
- `WebhookDelivery`
- `IntegrationOutbox`
- `SavedReport`
- `ReportSnapshot`
- `DataRetentionPolicy`
- `ArchiveRun`
- `PartitionMaintenance`
- `SystemSetting`
- `PermissionPolicy`
- `DashboardDefinition`
- `DashboardWidget`
- `DashboardCache`
- `PerformanceMetric`
- `DataQualityCheck`
- `DataQualityIssue`
- `ScaleTablePolicy`
- `BulkOperationBatch`
- `BulkOperationBatchItem`
- `EntitySequence`
- `SummaryRefreshState`
- `TableHealthSnapshot`

### Large-data tables that should be considered for partitioning

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

### Operational rules

- Dashboards should use summaries, not deep raw-table joins.
- Long exports should run as `ImportExportJob`.
- Notifications, webhooks, archive runs, and summary rebuilds should run as `BackgroundJob`.
- External event publishing should use `IntegrationOutbox` so failed integrations can retry safely.
- Duplicate user submissions should be protected by `IdempotencyKey`.
- Old closed data should move through `DataRetentionPolicy` and `ArchiveRun`.
- Partition metadata should be maintained in `PartitionMaintenance`, while actual PostgreSQL partition creation is handled by migrations or database scripts.
- Permission decisions should use `PermissionPolicy` in addition to user role assignments.
- Dashboard screens should read from `DashboardCache`, `InventoryBalance`, `VesselCargoSummary`, or generated report snapshots when the source data is large.
- Slow APIs and report queries should write `PerformanceMetric` records so indexing and query tuning can be based on real usage.
- Data-quality checks should run after imports, corrections, period closing, and large operational batches.
- Large list screens should use seek pagination on indexed date/id pairs, not offset pagination against large tables.
- Large write operations should carry an `operationBatchId` on stock movements, audit logs, notifications, SOF events, lighter trip events, truck loads, webhooks, and outbox rows.
- `ScaleTablePolicy` should define each large table's hot window, partition granularity, cursor column, retention days, and archive behavior.
- `EntitySequence` should issue business numbers under transaction control so number generation does not scan operational tables.
- `SummaryRefreshState` should hold rebuild watermarks so dashboard and report summaries can update incrementally.
- `TableHealthSnapshot` should record row estimates, table size, index size, dead tuples, scan counts, and slow-query counts for maintenance planning.
- Row counters for imports, exports, reports, archive runs, dashboards, metrics, and data-quality checks should use BigInt-sized fields.

### Typical background job status

`QUEUED -> RUNNING -> SUCCEEDED`

Possible alternatives:

`FAILED`, `RETRYING`, `CANCELLED`

### Typical import/export status

`QUEUED -> PROCESSING -> COMPLETED`

Possible alternatives:

`PARTIAL_COMPLETED`, `FAILED`, `CANCELLED`

### Typical webhook delivery status

`PENDING -> DELIVERED`

Possible alternatives:

`FAILED`, `RETRYING`, `CANCELLED`

### Typical data-quality check status

`QUEUED -> RUNNING -> PASSED`

Possible alternatives:

`FAILED`, `CANCELLED`

## 28. High-Level End-to-End Sequence

This is the shortest summary of the whole business:

1. Buyer raises procurement need.
2. Broker or direct supplier negotiation happens.
3. Supplier sends contract.
4. Buyer approves contract.
5. Supplier sends proforma invoice.
6. Buyer approves PI.
7. Buyer applies for permit and collects NOC or related clearances.
8. Insurance cover note and bank credit availability are confirmed.
9. LC application is submitted and LC is opened.
10. If required, LC amendment is issued.
11. Supplier ships cargo and sends full document set.
12. Vessel is nominated and vessel call is prepared.
13. Shipping agent, CNF, and stevedore are assigned as needed.
14. Mother vessel arrives and NOR is processed.
15. LC quantity is released for vessel call.
16. Carrier and lighter are assigned.
17. Scouts board lighter and loading preparation starts.
18. Mother vessel discharges to lighter.
19. MV SOF, daily discharge, and hold records are maintained.
20. Vessel may shift position and continue discharge.
21. Lighter completes loading and goes to draft survey.
22. Lighter moves to ghat.
23. Cargo unloads manually or through silo.
24. Truck is loaded and weighed.
25. Truck delivers to warehouse, factory, or party location.
26. Receipt and stock movement are finalized.
27. Quality, cost, claim, and delivery exceptions are reviewed.
28. Reports, audit log, and period closing finalize the operational truth.
29. Background jobs, operation batches, outbox events, webhooks, archive runs, summary watermarks, table health snapshots, and partition maintenance keep the platform scalable.

## 29. Main Status Progressions

### Procurement Request

`DRAFT -> UNDER_REVIEW -> APPROVED -> SOURCING -> CLOSED/CANCELLED`

### Import Contract

`DRAFT -> ACTIVE -> CLOSED/CANCELLED`

### Proforma Invoice

`DRAFT -> PENDING_APPROVAL -> APPROVED -> ACTIVE/CLOSED`

### LC Application

`DRAFT -> SUBMITTED -> BANK_QUERY -> SANCTIONED -> LC_OPENED/CANCELLED`

### Letter of Credit

`DRAFT -> PENDING_APPROVAL -> APPROVED -> ACTIVE -> PARTIAL_USED -> FULLY_USED/CLOSED`

### Import Permit / Regulatory Clearance

`DRAFT -> APPLIED -> PENDING -> ISSUED -> COLLECTED`

### Vessel Call

`EXPECTED -> ARRIVED -> ANCHORED -> LC_HOLD -> READY_TO_DISCHARGE -> DISCHARGING -> PARTIAL_DISCHARGED -> COMPLETED -> CLOSED`

### Notice of Readiness

`TENDERED -> ACCEPTED`

Alternative:

`REJECTED`, `CANCELLED`

### Lighter Assignment

`ASSIGNED -> READY_FOR_DEPARTURE -> EN_ROUTE_TO_MV -> WAITING_ALONGSIDE -> ALONGSIDE_MV -> LOADING -> LOADING_COMPLETE -> RETURNING_TO_GHAT -> WAITING_AT_GHAT -> UNLOADING_AT_GHAT -> UNLOADING_COMPLETE -> COMPLETED`

### Lighter Trip

`PLANNED -> ASSIGNED -> READY_TO_SAIL -> OUTBOUND_AT_SEA -> ALONGSIDE -> PREPARING_TO_LOAD -> LOADING -> LOADED -> DRAFT_SURVEY_IN_PROGRESS -> DRAFT_SURVEY_COMPLETED -> RETURNING_AT_SEA -> ARRIVED_GHAT -> WAITING_UNLOAD -> UNLOADING -> UNLOADED -> CLOSED`

### SOF

`DRAFT -> PENDING_VERIFICATION -> VERIFIED -> APPROVED -> CLOSED`

### Truck Load

`LOADED -> IN_TRANSIT -> ARRIVED_DESTINATION -> DELIVERED`

Possible alternatives:

`PARTIAL_DELIVERED`, `REJECTED`, `CANCELLED`, `ON_HOLD`

### Approval Request

`REQUESTED -> PENDING -> APPROVED`

Possible alternatives:

`REJECTED`, `REVOKED`, `EXPIRED`

### Document Attachment

`UPLOADED -> VERIFIED`

Possible alternatives:

`REJECTED`, `EXPIRED`, `ARCHIVED`

### Cost Entry

`ESTIMATED -> ACCRUED -> INVOICED -> APPROVED -> PAID`

Possible alternatives:

`DISPUTED`, `CANCELLED`

### Quality Inspection

`DRAFT -> SAMPLE_COLLECTED -> SENT_TO_LAB -> PASSED/FAILED -> CLOSED`

Possible alternative:

`DISPUTED`

### Claim

`DRAFT -> SUBMITTED -> UNDER_REVIEW -> ACCEPTED -> SETTLED -> CLOSED`

Possible alternatives:

`REJECTED`, `CANCELLED`

### Sales Allocation

`DRAFT -> CONFIRMED -> PARTIAL_DELIVERED -> DELIVERED`

Possible alternative:

`CANCELLED`

### Gate Pass

`ISSUED -> CHECKED_IN -> CHECKED_OUT`

Possible alternatives:

`CANCELLED`, `EXPIRED`

### Period Closing

`OPEN -> UNDER_REVIEW -> CLOSED -> LOCKED`

Possible alternative:

`REOPENED`

### Business Rule Violation

`OPEN -> ACKNOWLEDGED -> RESOLVED`

Possible alternatives:

`OVERRIDDEN`, `CANCELLED`

### Operational Lock

`ACTIVE -> RELEASED`

Possible alternative:

`EXPIRED`

### Background Job

`QUEUED -> RUNNING -> SUCCEEDED`

Possible alternatives:

`FAILED`, `RETRYING`, `CANCELLED`

### Bulk Operation Batch

`QUEUED -> RUNNING -> SUCCEEDED`

Possible alternatives:

`FAILED`, `RETRYING`, `CANCELLED`

### Bulk Operation Batch Item

`PENDING -> PROCESSING -> SUCCEEDED`

Possible alternatives:

`FAILED`, `SKIPPED`

### Import Export Job

`QUEUED -> PROCESSING -> COMPLETED`

Possible alternatives:

`PARTIAL_COMPLETED`, `FAILED`, `CANCELLED`

### Webhook Delivery

`PENDING -> DELIVERED`

Possible alternatives:

`FAILED`, `RETRYING`, `CANCELLED`

### Integration Outbox

`PENDING -> PROCESSING -> PUBLISHED`

Possible alternatives:

`FAILED`, `CANCELLED`

### Archive Run

`PLANNED -> RUNNING -> COMPLETED`

Possible alternatives:

`FAILED`, `CANCELLED`

### Data Quality Check

`QUEUED -> RUNNING -> PASSED`

Possible alternatives:

`FAILED`, `CANCELLED`

### Summary Refresh State

`QUEUED -> RUNNING -> SUCCEEDED`

Possible alternatives:

`FAILED`, `RETRYING`, `CANCELLED`

## 30. Final Note

The schema is not just a document system. It is a combined commercial, maritime operations, discharge control, logistics, and stock-traceability system.

In simple words:

- Commercial flow controls what can be shipped and paid.
- Vessel flow controls what arrives.
- Lighter flow controls how cargo leaves mother vessel.
- Survey and SOF control operational truth and accountability.
- Ghat, silo, and truck flow control physical delivery.
- Stock movement controls audit and reporting truth.
- Approval, documents, alerts, costing, quality, claims, gate pass, and period closing make the system production-ready.
- Background jobs, operation batches, import/export, outbox, webhooks, saved reports, retention, archive, and partition maintenance make the system scalable for large data.
- Business rules, fine-grained permissions, operational locks, dashboard caching, summary refresh watermarks, table health snapshots, performance metrics, and data-quality checks keep large operations controlled, fast, and trustworthy.
