# VMS Features and Requirements

Current source: `backend/prisma/schema.prisma` and `flow.md`

Current schema size:

- 107 Prisma models
- 85 Prisma enums

## 1. Project Summary

The Vessel Management System is an end-to-end import cargo execution platform. It covers the full business cycle from procurement planning to supplier negotiation, contract approval, LC opening, vessel arrival, lighter discharge, draft survey, ghat or silo receipt, truck delivery, stock accounting, costing, quality control, claims, reporting, audit, and scalable platform operations.

The system is designed for large operational data volumes. High-volume workflows such as stock movement, truck movement, SOF events, notifications, audit logs, webhooks, imports, exports, and background processing are supported through indexed tables, cursor-friendly date/id indexes, summary tables, async jobs, operation batches, archive controls, table scale policies, and partition tracking metadata.

## 2. Main Business Features

### 2.1 Master Data Management

- Organization master
- User master
- Role assignment
- Location master
- Anchorage master
- Ghat master
- Warehouse master
- Silo master
- Product master
- Vessel master
- Carrier master
- Lighter master
- Truck master

Supported organization types:

- Own company
- Supplier
- Customer
- Shipping agent
- Stevedore
- Carrier
- CNF
- Indentor
- Insurer
- Bank
- Transporter
- Warehouse
- Labour
- Surveyor
- Other

Supported location types:

- Anchorage
- Sea point
- Checkpoint
- Port
- Ghat
- Party port
- Silo
- Warehouse
- Office
- Other

### 2.2 User, Role, and Access Management

- User accounts with email and phone uniqueness
- Password hash support
- User active/inactive status
- Organization-level user mapping
- Role assignment by user
- Optional location-level role assignment
- Role grantor tracking
- Role expiry support
- User session tracking
- API key access for integrations
- Audit logging for sensitive actions

Main roles include:

- Super admin
- System admin
- Head office LC
- Commercial admin
- Finance approver
- Document controller
- Approval admin
- Integration admin
- Operations manager
- Mother vessel admin
- Shipping agent user
- CNF agent
- Stevedore coordinator
- Lighter assignment officer
- Carrier coordinator
- Port admin
- Ghat operator
- Quality controller
- Weighment officer
- Truck dispatch officer
- Security gate
- Warehouse operator
- Warehouse receiver
- Inventory controller
- Cost accountant
- Sales coordinator
- Management viewer
- Auditor
- Report viewer
- Surveyor

### 2.3 Procurement and Sourcing

- Procurement request creation
- Buyer organization mapping
- Product and required quantity definition
- Target price, currency, shipment date, and arrival date
- Procurement approval tracking
- Broker or indentor engagement
- Supplier offer tracking
- Supplier negotiation result tracking

Main records:

- `ProcurementRequest`
- `BrokerEngagement`
- `SupplierOffer`

Typical procurement status:

`DRAFT -> UNDER_REVIEW -> APPROVED -> SOURCING -> CLOSED/CANCELLED`

### 2.4 Supplier Contract Management

- Import contract creation
- Supplier and buyer mapping
- Contract lines by product
- Contract quantity, price, currency, and tolerance
- Shipment date range
- LC establishment deadline
- Safe ports and safe anchorages
- Discharge port and discharge rate
- Excluded days and holidays
- Supplier submission, internal approval, buyer sending, and supplier acknowledgement
- Soft-delete support

Main records:

- `ImportContract`
- `ImportContractLine`

Typical contract status:

`DRAFT -> ACTIVE -> CLOSED/CANCELLED`

### 2.5 Proforma Invoice Management

- PI creation and approval
- Seller and buyer details
- Consignee and vessel terms
- Loading, discharge, origin, destination, and delivery terms
- Payment terms
- Quantity, tolerance, product description, HS code, packing, and marks
- Product specification values
- Rate, FOB value, freight value, and total value
- Beneficiary bank information
- Shipment deadline
- PI line items
- LC linkage

Main records:

- `ProformaInvoice`
- `PiItem`

Typical PI status:

`DRAFT -> PENDING_APPROVAL -> APPROVED -> ACTIVE/CLOSED`

### 2.6 Permit, NOC, and Regulatory Compliance

- Import permit tracking
- Permit application, issue, expiry, and collection
- Regulatory clearance tracking
- NOC tracking
- Quarantine clearance
- Customs clearance
- Port clearance
- Other authority clearances
- Authority name, reference number, collector, status, and expiry tracking

Main records:

- `ImportPermit`
- `RegulatoryClearance`

Typical permit and clearance status:

`DRAFT -> APPLIED -> PENDING -> ISSUED -> COLLECTED`

Possible alternatives:

`REJECTED`, `EXPIRED`, `CANCELLED`

### 2.7 Bank Credit Limit, LC Application, and LC Management

- Bank credit facility tracking
- Sanctioned amount, utilized amount, available amount
- LC application tracking
- PI, permit, bank credit limit, and insurance cover note linkage
- Bank submission and response dates
- Bank query and sanction workflow
- Letter of Credit creation
- LC applicant, beneficiary, issuing bank, drawee
- LC amount, quantity, price, incoterm, shipment date, expiry date
- LC shipping and document clauses
- LC utilization tracking
- LC item lines
- LC amendment tracking
- LC release against vessel call

Main records:

- `BankCreditLimit`
- `LcApplication`
- `LetterOfCredit`
- `LcItem`
- `LcAmendment`
- `LcRelease`

Typical LC application status:

`DRAFT -> SUBMITTED -> BANK_QUERY -> SANCTIONED -> LC_OPENED/CANCELLED`

Typical LC status:

`DRAFT -> PENDING_APPROVAL -> APPROVED -> ACTIVE -> PARTIAL_USED -> FULLY_USED/CLOSED`

### 2.8 Shipping and LC Document Management

- Bill of lading
- BL item lines
- Packing list
- Commercial invoice
- Origin certificate
- Phytosanitary certificate
- Fumigation certificate
- Non-radiation certificate
- Health certificate
- Certificate of weight and quality
- Hold cleaning certificate
- Beneficiary certificate
- Bill of exchange
- Insurance advice
- Attachment upload and verification
- Document checklist tracking
- Document expiry tracking

Main records:

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
- `DocumentAttachment`
- `DocumentChecklistItem`

### 2.9 Vessel Nomination and Vessel Call Management

- Mother vessel registration
- Vessel call creation
- Contract linkage
- Arrival location
- Shipping agent assignment
- Stevedore assignment
- CNF assignment
- ETA, ETD, ATA, ATD
- Anchor drop, NOR tender, NOR accept, NOR reject
- Customs, quarantine, and port authority clearance dates
- Ready to discharge tracking
- Discharge start and completion tracking
- Cargo name and approximate total weight snapshot
- Vessel status tracking
- Current anchorage and alongside status
- Discharge stage tracking
- Total discharge tracking

Main records:

- `Vessel`
- `VesselCall`
- `VesselCargoLine`
- `NoticeOfReadiness`
- `VesselShift`

Typical vessel call status:

`EXPECTED -> ARRIVED -> ANCHORED -> LC_HOLD -> READY_TO_DISCHARGE -> DISCHARGING -> PARTIAL_DISCHARGED -> COMPLETED -> CLOSED`

### 2.10 Notice of Readiness

- NOR number
- Vessel call linkage
- Sender organization
- Receiver user
- Tender time
- Acceptance time
- Rejection time
- Laytime commencement time
- Rejection reason
- Status and remarks

Main record:

- `NoticeOfReadiness`

Typical NOR status:

`TENDERED -> ACCEPTED`

Possible alternatives:

`REJECTED`, `CANCELLED`

### 2.11 LC Release and Cargo Allocation

- LC quantity release by vessel call
- Released quantity
- Used quantity
- Release expiry
- Release approval
- Link release to lighter assignment, lighter cargo, and stock movement

Main records:

- `LcRelease`
- `VesselCargoLine`
- `LighterAssignment`
- `LighterTripCargo`

### 2.12 Carrier and Lighter Assignment

- Carrier master
- Lighter vessel master
- Carrier credit/rating fields
- Lighter assignment number
- LC and LC release mapping
- Vessel call mapping
- Destination ghat
- Cost bearing scope
- Freight rate and total freight
- Estimated quantity
- Surveyor loaded quantity
- Actual discharged quantity
- Weight difference and percentage
- Assignment lifecycle timestamps
- Discharge stage and stage freight rate
- Assigned by user

Main records:

- `Carrier`
- `Lighter`
- `LighterAssignment`

Typical lighter assignment status:

`ASSIGNED -> READY_FOR_DEPARTURE -> EN_ROUTE_TO_MV -> WAITING_ALONGSIDE -> ALONGSIDE_MV -> LOADING -> LOADING_COMPLETE -> RETURNING_TO_GHAT -> WAITING_AT_GHAT -> UNLOADING_AT_GHAT -> UNLOADING_COMPLETE -> COMPLETED`

### 2.13 Lighter Trip Execution

- Lighter trip number
- Vessel call mapping
- Lighter assignment mapping
- Lighter vessel mapping
- Assigned user
- Return location
- Destination type
- Master, assistant, and crew information
- Surveyor scout and importer scout tracking
- Movement timestamps from ghat to MV and back
- Alongside, loading, draft survey, return, arrival, and unloading timestamps
- Draft survey weight and status
- Payment status
- Hold reason
- Trip cargo lines
- Trip event timeline
- Scout records

Main records:

- `LighterTrip`
- `LighterTripCargo`
- `LighterTripEvent`
- `LighterScout`

Typical lighter trip status:

`PLANNED -> ASSIGNED -> READY_TO_SAIL -> OUTBOUND_AT_SEA -> ALONGSIDE -> PREPARING_TO_LOAD -> LOADING -> LOADED -> DRAFT_SURVEY_IN_PROGRESS -> DRAFT_SURVEY_COMPLETED -> RETURNING_AT_SEA -> ARRIVED_GHAT -> WAITING_UNLOAD -> UNLOADING -> UNLOADED -> CLOSED`

### 2.14 Mother Vessel Discharge Control

- Daily discharge capture
- 24-hour quantity
- Cumulative quantity
- Remaining quantity
- User who entered discharge
- Vessel shifting between anchorages
- Shift reason
- Stage before and after shifting
- Discharged quantity before and after shifting
- Discharge stage tracking

Main records:

- `MotherVesselDailyDischarge`
- `VesselShift`
- `StatementOfFacts`
- `SofEvent`
- `SofHourlyStatus`

### 2.15 Statement of Facts and Laytime

- Mother vessel SOF
- Lighter vessel SOF
- SOF number
- Scope
- Start and completion time
- Verification and approval
- Laytime allowed, used, excluded, and balance hours
- Demurrage amount
- Dispatch amount
- Net amount
- SOF event timeline
- Hourly status timeline
- Hold and delay responsibility
- Supporting documents

Main records:

- `StatementOfFacts`
- `SofEvent`
- `SofHourlyStatus`

Typical SOF status:

`DRAFT -> PENDING_VERIFICATION -> VERIFIED -> APPROVED -> CLOSED`

Possible alternative:

`DISPUTED`

### 2.16 Draft Survey

- Survey number
- Lighter trip mapping
- Lighter assignment mapping
- Survey organization
- Surveyor user
- Survey location
- Pre-load draft readings
- Post-load draft readings
- Displacement values
- Ballast, fresh water, fuel, diesel, lube oil, crew/stores, constants
- Total deductions
- Calculated cargo weight
- Boat note capacity
- Surveyor loaded quantity
- Weight difference and percentage
- Difference reason
- Tolerance percentage
- Trim, density, and list correction flags
- Surveyor remarks
- Master and scout witness signatures
- Survey dispute tracking
- Survey lifecycle timestamps

Main record:

- `DraftSurvey`

### 2.17 Ghat Operations

- Ghat unloading record
- Lighter assignment mapping
- Queue number
- Unloading method
- Start and completion time
- Weighing method
- Total weighed quantity
- Number of trucks
- Number of bags
- Sample taken flag
- Sample quality
- Difference percentage
- Customer warehouse mapping
- Transport cost
- Unloading rate
- Hold reason

Main record:

- `GhatUnloading`

Supported unloading methods:

- Truck direct
- Warehouse sack unloading
- Silo automated unloading
- Bag packing
- Mixed

### 2.18 Truck Dispatch and Delivery

- Truck master
- Truck load record
- Source type
- Silo receipt linkage
- Truck linkage
- Driver information
- Gross, tare, and net weight
- Weighbridge slip
- Product and destination
- Dispatch time
- Estimated arrival
- Delivered time
- Warehouse receipt
- Quantity received
- Delivery status
- Delivery remarks
- Stock movement linkage

Main records:

- `Truck`
- `TruckLoad`

Typical truck load status:

`LOADED -> IN_TRANSIT -> ARRIVED_DESTINATION -> DELIVERED`

Possible alternatives:

`PARTIAL_DELIVERED`, `REJECTED`, `CANCELLED`, `ON_HOLD`

### 2.19 Silo Operations

- Silo master
- Silo capacity
- Current fill
- Unloading system type
- Machine unloading capacity
- Weight calculation method
- Silo receipt from lighter trip
- Product mapping
- Exact received quantity
- Quality grade
- Receipt time and receiver
- Truck load from silo
- Stock movement linkage

Main records:

- `Silo`
- `SiloReceipt`

### 2.20 Unloading Operation Details

- Trip-level unloading operation
- Method
- Start and end time
- Exact total quantity
- Exact weight source
- Unloading rate
- Hold reason
- Product-level unloading lines

Main records:

- `UnloadingOperation`
- `UnloadingLine`

### 2.21 Inventory and Stock Traceability

- Stock movement ledger
- Inventory balance snapshots
- Vessel cargo summary
- Movement number
- Movement type
- Product
- Vessel call
- LC release
- Lighter assignment
- Lighter trip
- Ghat unloading
- Silo receipt
- Truck load
- From/to location type
- From/to location
- From vessel
- To lighter
- Ghat, silo, and warehouse mapping
- Quantity
- Weight source
- Movement time
- Reference number

Main records:

- `StockMovement`
- `InventoryBalance`
- `VesselCargoSummary`

Supported stock movement types:

- Mother vessel opening
- LC release
- Lighter loaded
- Lighter returning
- Ghat received
- Silo received
- Silo issued
- Warehouse received
- Truck loaded
- Truck delivered
- Sale delivered
- Difference adjustment
- Correction

### 2.22 Approval Workflow

- Generic approval request for major business records
- Multi-step approval
- Level-based approval
- Role-based approver
- User-specific approver
- Comments
- Final decision tracking
- Rejection reason
- Approval history

Main records:

- `ApprovalRequest`
- `ApprovalStep`

Typical approval status:

`REQUESTED -> PENDING -> APPROVED`

Possible alternatives:

`REJECTED`, `REVOKED`, `EXPIRED`

### 2.23 Attachment and Document Checklist

- Generic attachment model
- Entity type and entity ID mapping
- Document type and name
- File URL
- File metadata
- Version number
- Upload user
- Verify user
- Issue date
- Expiry date
- Rejection reason
- Required document checklist
- Mandatory/optional flag
- Due date
- Responsible role

Main records:

- `DocumentAttachment`
- `DocumentChecklistItem`

Typical attachment status:

`UPLOADED -> VERIFIED`

Possible alternatives:

`REJECTED`, `EXPIRED`, `ARCHIVED`

### 2.24 Notifications and Alerts

- In-app notification
- Email notification support
- SMS notification support
- WhatsApp notification support
- User recipient
- Role recipient
- Entity mapping
- Scheduled send
- Sent, read, failed, and cancelled state
- Alert types for approval, missing document, expiry, ETA change, lighter delay, truck overdue, stock mismatch, claim update, period closing, and general messages

Main record:

- `Notification`

### 2.25 Costing and Landed Cost

- Cost entry by cost type
- Estimated, accrued, invoiced, approved, paid, disputed, and cancelled statuses
- Link cost to vessel, lighter trip, truck load, product, vendor, or generic entity
- Quantity, rate, amount, currency, exchange rate, and local amount
- Invoice number and date
- Approval and payment timestamps

Main record:

- `CostEntry`

Supported cost types:

- LC bank charge
- Insurance
- CNF
- Shipping agent
- Stevedore
- Carrier freight
- Lighter freight
- Ghat unloading
- Labour
- Truck transport
- Survey
- Port charge
- Customs duty
- Demurrage
- Dispatch
- Warehouse
- Silo
- Claim settlement
- Other

Typical cost status:

`ESTIMATED -> ACCRUED -> INVOICED -> APPROVED -> PAID`

Possible alternatives:

`DISPUTED`, `CANCELLED`

### 2.26 Quality Control

- Quality inspection record
- Product, vessel, lighter, ghat unloading, and truck linkage
- Sample number
- Sample collection time and user
- Lab name
- Lab report number and date
- Overall result
- Quality parameter results
- Expected min/max
- Actual value or text value
- Pass/fail flag

Main records:

- `QualityInspection`
- `QualityParameterResult`

Typical quality status:

`DRAFT -> SAMPLE_COLLECTED -> SENT_TO_LAB -> PASSED/FAILED -> CLOSED`

Possible alternative:

`DISPUTED`

### 2.27 Claim and Dispute Management

- Shortage claims
- Quality claims
- Damage claims
- Demurrage claims
- Dispatch claims
- Insurance claims
- Supplier claims
- Carrier claims
- Survey claims
- Generic entity linkage
- Against organization and raised-by organization
- Vessel, lighter trip, truck load, and product linkage
- Claimed quantity and amount
- Settlement quantity and amount
- Settlement date

Main record:

- `Claim`

Typical claim status:

`DRAFT -> SUBMITTED -> UNDER_REVIEW -> ACCEPTED -> SETTLED -> CLOSED`

Possible alternatives:

`REJECTED`, `CANCELLED`

### 2.28 Sales Allocation

- Customer allocation
- Product allocation
- Vessel call linkage
- LC release linkage
- Allocation type
- Allocated quantity
- Delivered quantity
- Balance quantity
- Rate and currency
- Delivery location and address
- Delivery deadline
- Confirmation time

Main record:

- `SalesAllocation`

Typical sales allocation status:

`DRAFT -> CONFIRMED -> PARTIAL_DELIVERED -> DELIVERED`

Possible alternative:

`CANCELLED`

### 2.29 Gate Pass and Security

- Truck in/out gate pass
- Lighter in/out gate pass
- Warehouse receipt gate pass
- Visitor gate pass
- Location mapping
- Truck load mapping
- Truck number
- Lighter trip mapping
- Driver information
- Issued by user
- Valid until
- Check-in and check-out
- Checked by user

Main record:

- `GatePass`

Typical gate pass status:

`ISSUED -> CHECKED_IN -> CHECKED_OUT`

Possible alternatives:

`CANCELLED`, `EXPIRED`

### 2.30 Audit Logging

- Entity type
- Entity name
- Entity ID
- Action type
- Actor user
- Actor role
- Old values
- New values
- IP address
- User agent
- Reason
- Created timestamp

Main record:

- `AuditLog`

Supported audit actions:

- Create
- Update
- Delete
- Restore
- Approve
- Reject
- Status change
- Login
- Logout
- Export
- Import
- Correction

### 2.31 Period Closing

- Closing number
- Period start and end
- Product
- Location type and location reference
- Opening quantity
- Received quantity
- Issued quantity
- Adjustment quantity
- Closing quantity
- Review and close users
- Review and close timestamps

Main record:

- `PeriodClosing`

Typical period closing status:

`OPEN -> UNDER_REVIEW -> CLOSED -> LOCKED`

Possible alternative:

`REOPENED`

### 2.32 Business Rule Enforcement

- Configurable business rules by category, entity type, and trigger event
- Rule severity
- Rule action: allow, warn, require approval, or block
- Rule expression JSON for backend evaluation
- System and custom rule support
- Rule violation tracking
- Violation acknowledgement
- Approval-based override tracking
- Violation resolution tracking

Main records:

- `BusinessRule`
- `BusinessRuleViolation`

Critical rules should include:

- LC release cannot exceed available LC quantity.
- Lighter assignment cannot exceed released quantity.
- Truck delivery cannot exceed loaded or received quantity without approval.
- Draft survey difference above tolerance requires reason or approval.
- Expired LC, permit, clearance, or mandatory document blocks configured operations.
- Closed vessel call blocks new discharge activity.
- Closed stock period blocks normal stock edits.
- Stock correction requires approval and audit log.
- Manual weighbridge override requires approval.

Typical rule violation status:

`OPEN -> ACKNOWLEDGED -> RESOLVED`

Possible alternatives:

`OVERRIDDEN`, `CANCELLED`

### 2.33 Fine-Grained Permissions and Operational Locks

- Role/resource/action permission policies
- Allow and deny effects
- Organization-specific policy
- Location-specific policy
- Conditional policy JSON
- Priority-based permission evaluation
- Operational lock by entity
- Lock reason
- Lock expiry
- Lock release tracking

Main records:

- `PermissionPolicy`
- `OperationalLock`

Typical operational lock status:

`ACTIVE -> RELEASED`

Possible alternative:

`EXPIRED`

## 3. Platform and Modern System Features

### 3.1 User Sessions

- Session token hash
- Refresh token hash
- Session status
- IP address
- User agent
- Device name
- Last seen time
- Expiry time
- Revocation time

Main record:

- `UserSession`

### 3.2 API Keys

- API key number
- Name
- Key hash
- Status
- Organization mapping
- User mapping
- Scopes
- Allowed IPs
- Last used time
- Expiry and revocation
- Created by user

Main record:

- `ApiKey`

### 3.3 Idempotency Control

- Scope and key uniqueness
- Request hash
- Response code
- Response body
- Lock expiry
- Expiry time
- Prevents duplicate create/update requests during retries

Main record:

- `IdempotencyKey`

### 3.4 Background Jobs

- Async job queue
- Job type
- Job status
- Priority
- Entity mapping
- Payload and result
- Attempts and max attempts
- Run-after timestamp
- Start and completion timestamps
- Lock owner and lock expiry
- Failure reason

Main record:

- `BackgroundJob`

Typical background job status:

`QUEUED -> RUNNING -> SUCCEEDED`

Possible alternatives:

`FAILED`, `RETRYING`, `CANCELLED`

### 3.5 Import and Export Jobs

- Import and export tracking
- CSV, XLSX, JSON, and PDF formats
- Source file URL
- Result file URL
- Total, success, and failed row counts
- Error summary
- Filter JSON
- Start and completion timestamps
- Expiry time

Main record:

- `ImportExportJob`

Typical import/export status:

`QUEUED -> PROCESSING -> COMPLETED`

Possible alternatives:

`PARTIAL_COMPLETED`, `FAILED`, `CANCELLED`

### 3.6 Webhooks and Integration Outbox

- Webhook endpoint registration
- Endpoint event types
- Endpoint status
- Organization mapping
- Secret hash
- Timeout and max attempts
- Webhook delivery tracking
- Delivery attempts
- Response code and response body
- Outbox event tracking
- Publish status
- Retry timestamps

Main records:

- `WebhookEndpoint`
- `WebhookDelivery`
- `IntegrationOutbox`

Typical webhook delivery status:

`PENDING -> DELIVERED`

Possible alternatives:

`FAILED`, `RETRYING`, `CANCELLED`

Typical integration outbox status:

`PENDING -> PROCESSING -> PUBLISHED`

Possible alternatives:

`FAILED`, `CANCELLED`

### 3.7 Saved Reports and Report Snapshots

- Saved report name
- Report key
- Visibility
- Owner user
- Role
- Organization
- Filter JSON
- Column JSON
- Schedule cron
- Last run time
- Report snapshot
- Snapshot file URL
- Snapshot format
- Row count
- Generated user
- Expiry time

Main records:

- `SavedReport`
- `ReportSnapshot`

### 3.8 Dashboard Cache, Performance Metrics, and Data Quality

- Dashboard definitions
- Dashboard widgets
- Role, organization, and owner visibility
- Widget query keys
- Widget configuration and position JSON
- Cached dashboard payloads
- Cache expiry
- API, query, dashboard, report, job, webhook, and import/export performance metrics
- Duration, row count, success flag, and metadata
- Data-quality check runs
- Data-quality issues by entity
- Issue severity and resolution

Main records:

- `DashboardDefinition`
- `DashboardWidget`
- `DashboardCache`
- `PerformanceMetric`
- `DataQualityCheck`
- `DataQualityIssue`

Typical data-quality check status:

`QUEUED -> RUNNING -> PASSED`

Possible alternatives:

`FAILED`, `CANCELLED`

### 3.9 Data Retention, Archive, and Partition Maintenance

- Retention policy by entity
- Retention action
- Retention days
- Archive location
- Archive run tracking
- Rows scanned, archived, and deleted
- Archive file URL
- Partition metadata tracking
- Table name
- Partition name
- Partition key
- Range start and end
- Partition status
- Row estimate

Main records:

- `DataRetentionPolicy`
- `ArchiveRun`
- `PartitionMaintenance`
- `ScaleTablePolicy`

Typical archive run status:

`PLANNED -> RUNNING -> COMPLETED`

Possible alternatives:

`FAILED`, `CANCELLED`

Large-data tables that should be considered for PostgreSQL partitioning:

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

### 3.10 Scale Runtime Controls

- Table scale policy by physical table name
- Table role such as ledger, event, queue, audit, snapshot, or cache
- Partition key and granularity
- Hot data window, retention days, and archive-after days
- Cursor column and tie-breaker for seek pagination
- Maximum online row target
- Append-only flag for immutable ledgers and event tables
- Batch header for imports, exports, corrections, rebuilds, webhooks, and archive work
- Batch item tracking with row number, entity reference, item status, and error message
- Business sequence counters for safe high-concurrency document numbers
- Summary refresh watermark and last successful refresh tracking
- Table health snapshots for row estimates, table bytes, index bytes, dead tuples, scan counts, and slow-query counts
- BigInt row counters for imports, archives, reports, dashboards, metrics, and data-quality checks

Main records:

- `ScaleTablePolicy`
- `BulkOperationBatch`
- `BulkOperationBatchItem`
- `EntitySequence`
- `SummaryRefreshState`
- `TableHealthSnapshot`

Typical batch status:

`QUEUED -> RUNNING -> SUCCEEDED`

Possible alternatives:

`FAILED`, `RETRYING`, `CANCELLED`

Typical batch item status:

`PENDING -> PROCESSING -> SUCCEEDED`

Possible alternatives:

`FAILED`, `SKIPPED`

### 3.11 System Settings

- Global setting
- Company setting
- Organization setting
- Location setting
- User setting
- JSON value
- Encrypted flag
- Updated by user

Main record:

- `SystemSetting`

## 4. Reporting Requirements

The system should support reporting for:

- Procurement request status
- Broker engagement
- Supplier offer comparison
- Contract status and quantity
- PI approval and usage
- Permit and clearance expiry
- Bank credit limit utilization
- LC application status
- LC utilization
- LC amendment history
- LC release balance
- Missing document checklist
- Document expiry
- Vessel ETA and arrival
- Vessel discharge progress
- NOR and laytime
- SOF timeline
- Hold and delay responsibility
- Daily mother vessel discharge
- Vessel shifting history
- Lighter assignment status
- Lighter trip timeline
- Lighter performance
- Draft survey difference
- Ghat queue and unloading
- Silo receipt and issue
- Truck dispatch and delivery
- Truck overdue
- Weighbridge slip
- Warehouse receipt
- Inventory balance
- Stock movement ledger
- Vessel cargo summary
- Cost and landed cost
- Demurrage and dispatch
- Quality inspection
- Claim and settlement
- Sales allocation delivery balance
- Gate pass security log
- Audit log
- Approval queue
- Notification delivery
- Import/export job status
- Webhook delivery status
- Archive run status
- Period closing status
- Business rule violation status
- Data-quality issue status
- Slow API and query performance
- Dashboard cache freshness

Dashboards should use summary tables and precomputed records where possible, especially:

- `InventoryBalance`
- `VesselCargoSummary`
- `DashboardCache`
- Background-generated report snapshots

## 5. Functional Requirements

### 5.1 Commercial Control Requirements

- A procurement request must exist before structured sourcing.
- Supplier offers should be traceable to procurement requests.
- Import contracts should define supplier, buyer, product, quantity, tolerance, shipment, LC deadline, and discharge terms.
- PI should be checked against contract terms before approval.
- LC application should reference PI, permit, insurance cover note, and bank credit availability where applicable.
- LC release should not exceed available LC quantity.
- LC release should be linked to vessel call before physical discharge allocation.
- LC amendment should be approved before changing LC terms.

### 5.2 Document Control Requirements

- Required documents should be tracked through checklist items.
- Uploaded files should be versioned.
- Expired documents should be detectable.
- Rejected documents should capture rejection reason.
- Important shipment documents should be linkable to LC, BL, vessel call, or generic entity.
- Missing document alerts should be generated.

### 5.3 Vessel and Lighter Operation Requirements

- Vessel call must track ETA, ATA, anchorage, NOR, clearances, readiness, discharge, and closure.
- Vessel can shift between anchorages or discharge stages.
- Daily vessel discharge must be captured.
- Lighter assignment should reference carrier, lighter, vessel call, destination ghat, estimated quantity, and assigned user.
- Lighter trip should track movement, loading, draft survey, return, ghat arrival, and unloading.
- Trip events should provide chronological operational history.
- Scouts should be tracked where required.

### 5.4 Survey and Quantity Control Requirements

- Draft survey should support pre-load and post-load readings.
- Draft survey should calculate cargo weight and difference.
- Difference above tolerance should require reason or dispute tracking.
- Ghat, silo, truck, and stock movements should preserve weight source.
- Commercial quantity and physical quantity should be reconcilable from LC release to final delivery.

### 5.5 Ghat, Silo, and Truck Requirements

- Ghat unloading should track queue, method, weight, trucks, bags, quality sample, and difference percentage.
- Silo receipt should track exact quantity and quality grade.
- Truck load should track gross, tare, net weight, weighbridge slip, dispatch, delivery, receipt, and delivery status.
- Delivery shortage, rejection, or difference should be recorded.
- Truck overdue alerts should be possible from estimated arrival and status.

### 5.6 Inventory Requirements

- Every major physical movement should produce stock movement records.
- Inventory balances should be maintained for product and location.
- Stock correction should be handled as correction movements, not silent overwrite.
- Period closing should lock approved stock periods.
- Reopening a closed period should require approval and audit log.

### 5.7 Cost, Quality, Claim, and Sales Requirements

- Operational costs should be linked to the relevant vessel, trip, truck, product, vendor, or generic entity.
- Landed cost should be derivable from cost entries.
- Quality inspection should support sample and lab result tracking.
- Claims should support shortage, quality, damage, demurrage, dispatch, insurance, supplier, carrier, and survey disputes.
- Sales allocation should track allocated, delivered, and balance quantities.

### 5.8 Approval and Audit Requirements

- Sensitive records should support approval workflow.
- Approval should capture steps, role/user, decision, comments, and final decision.
- Audit log should record create, update, delete, restore, approve, reject, status change, login, logout, import, export, and correction actions.
- Old and new values should be stored where needed.
- Business rule violations should be created when configured rules fail.
- Rule overrides should require approval when the rule action is `REQUIRE_APPROVAL`.
- Blocking rules should prevent persistence of invalid operations.
- Operational locks should prevent normal edits on closed or protected entities.

### 5.9 Integration and Platform Requirements

- API access should be controlled through hashed API keys.
- User sessions should be tracked and revocable.
- Duplicate retry requests should be prevented through idempotency keys.
- Long-running work should run through background jobs.
- Imports and exports should run asynchronously for large data.
- External integrations should publish through outbox and webhook delivery records.
- Failed webhooks and outbox events should be retryable.
- Reports should be savable and exportable.
- Dashboards should support cached payloads for large-data screens.
- Slow APIs, queries, jobs, reports, and integrations should write performance metrics.
- Data-quality checks should run after imports, stock corrections, and period closing.
- Fine-grained permission policies should be evaluated after basic role assignment.
- Old data should be archived through retention policies.
- Partition metadata should be maintained for high-volume tables.
- Scale table policies should define the hot data window, partition granularity, cursor column, and retention behavior for every high-volume table.
- Large imports, corrections, archive runs, and rebuilds should create `BulkOperationBatch` records and attach batch IDs to affected ledger, event, notification, webhook, and audit rows.
- Business numbers should be issued from `EntitySequence` so services never scan or count large tables to generate the next number.

## 6. Large Data and Performance Requirements

- All list screens must use pagination.
- High-volume list screens must use seek pagination with an indexed date/id pair such as `(movementAt, id)`, `(createdAt, id)`, `(eventTime, id)`, or `(dispatchedAt, id)`.
- Large exports must run as background jobs.
- Heavy reports must use summary tables, snapshots, or async jobs.
- Avoid deep nested Prisma includes on high-volume records.
- Filter by indexed fields such as status, date, product, vessel call, location, and entity references.
- Use date-range filters for large ledgers and event tables.
- Use `ScaleTablePolicy` to decide partition key, partition granularity, retention, archive windows, and expected online row limits.
- Use `BulkOperationBatch` and `BulkOperationBatchItem` for high-volume imports, exports, archive runs, correction runs, summary rebuilds, and integration replays.
- Use `InventoryBalance` for stock dashboards instead of recalculating from all movements every time.
- Use `VesselCargoSummary` for vessel progress dashboards.
- Use `DashboardCache` for expensive dashboards and repeated management screens.
- Use `SummaryRefreshState` to store watermarks for incremental dashboard, inventory, and vessel summary rebuilds.
- Record `PerformanceMetric` for slow APIs, reports, database queries, jobs, and integrations.
- Capture `TableHealthSnapshot` records after scheduled database maintenance so row growth, table size, index size, dead tuples, and scan patterns are visible.
- Use `DataQualityCheck` to detect reconciliation issues before they become report errors.
- Use archive and retention rules for old closed data.
- Consider PostgreSQL monthly or yearly partitioning for high-volume tables.
- Use BigInt counters for row counts in import/export jobs, archive runs, report snapshots, dashboard cache metadata, performance metrics, and data-quality checks.
- Monitor slow queries after real data is loaded.
- Keep write-heavy indexes targeted; do not add indexes for every field.
- Use background jobs for notification dispatch, webhook dispatch, report generation, archive runs, document expiry scans, overdue truck scans, inventory rebuilds, and summary rebuilds.

## 7. Data Integrity Requirements

- Unique business numbers should remain unique.
- Quantity fields should use decimal precision.
- Money fields should use decimal precision.
- Soft-deleted records should not appear in normal active lists.
- Status transitions should be enforced in backend services.
- Business rules should enforce critical commercial and operational limits before writes.
- Permission policies should enforce role, organization, and location-specific access.
- Operational locks should protect closed vessel calls, closed stock periods, and approved final records.
- Polymorphic references using `entityType` and `entityId` must be validated by application code.
- Approval and audit history should not be silently removed.
- Stock movements should be append-style; corrections should be separate movements.
- Closed periods should prevent normal edits.
- Expired LC, permit, clearance, or document should trigger alerts or operational blocks where business rules require it.

## 8. Technical Requirements

- Backend framework: NestJS
- ORM: Prisma
- Database: PostgreSQL
- Prisma client generation must pass.
- Prisma validation must pass.
- Migrations should be used for schema deployment.
- PostgreSQL partitioning, if used, should be implemented through migrations or database scripts.
- Database scripts should create actual partitions based on `ScaleTablePolicy` and record them in `PartitionMaintenance`.
- File storage should support uploaded document URLs.
- Background workers should process queued jobs.
- Notification workers should process scheduled notifications.
- Webhook workers should retry failed deliveries.
- Reporting workers should generate large exports and report snapshots.
- Archive workers should process retention policies safely.
- Batch workers should update `BulkOperationBatch`, `BulkOperationBatchItem`, and `SummaryRefreshState` as they process large datasets.
- Number generation should update `EntitySequence` inside a transaction.
- Rule evaluation should run in service-layer transactions before writes are committed.
- Performance metrics should be sampled or retained according to retention policy so observability data does not grow forever.
- Dashboard cache should be invalidated by stock movement, vessel summary, truck delivery, cost, claim, and period closing updates.

## 9. Current Core Model List

Master and access:

- `Organization`
- `User`
- `UserRoleAssignment`
- `Location`
- `Anchorage`
- `Ghat`
- `Warehouse`
- `Silo`
- `Product`
- `Vessel`
- `Carrier`
- `Lighter`
- `Truck`

Commercial and banking:

- `ProcurementRequest`
- `BrokerEngagement`
- `SupplierOffer`
- `ImportContract`
- `ImportContractLine`
- `ProformaInvoice`
- `PiItem`
- `LetterOfCredit`
- `LcItem`
- `LcAmendment`
- `LcRelease`
- `ImportPermit`
- `RegulatoryClearance`
- `BankCreditLimit`
- `LcApplication`

Shipping documents:

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

Vessel, lighter, survey, and discharge:

- `VesselCall`
- `NoticeOfReadiness`
- `VesselShift`
- `VesselCargoLine`
- `LighterAssignment`
- `StatementOfFacts`
- `SofEvent`
- `MotherVesselDailyDischarge`
- `SofHourlyStatus`
- `LighterTrip`
- `LighterTripCargo`
- `LighterTripEvent`
- `LighterScout`
- `DraftSurvey`

Ghat, silo, truck, and unloading:

- `GhatUnloading`
- `TruckLoad`
- `SiloReceipt`
- `UnloadingOperation`
- `UnloadingLine`

Control, quality, cost, sales, and audit:

- `ApprovalRequest`
- `ApprovalStep`
- `DocumentAttachment`
- `DocumentChecklistItem`
- `Notification`
- `CostEntry`
- `QualityInspection`
- `QualityParameterResult`
- `Claim`
- `SalesAllocation`
- `GatePass`
- `AuditLog`
- `PeriodClosing`
- `PermissionPolicy`
- `BusinessRule`
- `BusinessRuleViolation`
- `OperationalLock`
- `DashboardDefinition`
- `DashboardWidget`
- `DashboardCache`
- `PerformanceMetric`
- `DataQualityCheck`
- `DataQualityIssue`

Platform and scale:

- `ScaleTablePolicy`
- `BulkOperationBatch`
- `BulkOperationBatchItem`
- `EntitySequence`
- `SummaryRefreshState`
- `TableHealthSnapshot`
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

Inventory and summary:

- `StockMovement`
- `InventoryBalance`
- `VesselCargoSummary`

## 10. Current Project Conclusion

At this moment, the project requirements describe a full commercial, maritime operations, logistics, inventory, costing, quality, sales, audit, reporting, integration, and large-data platform for import cargo and vessel management.

The current schema is suitable as a strong production foundation. The next implementation focus should be backend modules, services, validation rules, seed data, background workers, API endpoints, partition scripts, and report/query design that respects the large-data requirements above.
