-- Narrow default SOF event catalogs: mother-vessel ops vs lighter-vessel ops (shared types remain BOTH)

UPDATE "sof_event_type_definitions"
SET "scope" = 'MOTHER_VESSEL'
WHERE "code" IN (
    'EVT-LEGACY-ANCHOR-DROPPED',
    'EVT-LEGACY-NOR-TENDERED',
    'EVT-LEGACY-NOR-ACCEPTED',
    'EVT-LEGACY-LC-RELEASED',
    'EVT-LEGACY-DISCHARGE-STARTED',
    'EVT-LEGACY-DISCHARGE-STOPPED',
    'EVT-LEGACY-SHIFTING',
    'EVT-LEGACY-ANCHOR-UP'
);

UPDATE "sof_event_type_definitions"
SET "scope" = 'LIGHTER_VESSEL'
WHERE "code" IN (
    'EVT-LEGACY-HOLD',
    'EVT-LEGACY-BREAKDOWN',
    'EVT-LEGACY-OTHER'
);

INSERT INTO "sof_event_type_definitions" ("id", "code", "name", "scope", "is_active", "deleted_at", "created_at", "updated_at") VALUES
('sofetype_tpl_alongside_mv', 'EVT-TPL-ALONGSIDE-MV', 'Alongside mother vessel', 'LIGHTER_VESSEL', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_tpl_loading_started', 'EVT-TPL-LOADING-STARTED', 'Loading started', 'LIGHTER_VESSEL', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_tpl_loading_completed', 'EVT-TPL-LOADING-COMPLETED', 'Loading completed', 'LIGHTER_VESSEL', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_tpl_departed_mv', 'EVT-TPL-DEPARTED-MV', 'Departed mother vessel', 'LIGHTER_VESSEL', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_tpl_arrived_ghat', 'EVT-TPL-ARRIVED-GHAT', 'Arrived ghat', 'LIGHTER_VESSEL', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_tpl_unloading_started', 'EVT-TPL-UNLOADING-STARTED', 'Unloading started', 'LIGHTER_VESSEL', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sofetype_tpl_unloading_completed', 'EVT-TPL-UNLOADING-COMPLETED', 'Unloading completed', 'LIGHTER_VESSEL', true, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
