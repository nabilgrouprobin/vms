-- Organization types as master data (replaces Organization.type enum)

CREATE TABLE "organization_type_definitions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_type_definitions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_type_definitions_code_key" ON "organization_type_definitions"("code");
CREATE INDEX "organization_type_definitions_is_active_idx" ON "organization_type_definitions"("is_active");

INSERT INTO "organization_type_definitions" ("id", "code", "name", "is_active", "created_at", "updated_at") VALUES
('orgtyp_own_company', 'OWN_COMPANY', 'Own company', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_supplier', 'SUPPLIER', 'Supplier', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_customer', 'CUSTOMER', 'Customer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_shipping_agent', 'SHIPPING_AGENT', 'Shipping agent', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_stevedore', 'STEVEDORE', 'Stevedore', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_carrier', 'CARRIER', 'Carrier', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_cnf', 'CNF', 'CNF', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_indentor', 'INDENTOR', 'Indentor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_insurer', 'INSURER', 'Insurer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_bank', 'BANK', 'Bank', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_transporter', 'TRANSPORTER', 'Transporter', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_warehouse', 'WAREHOUSE', 'Warehouse', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_labour', 'LABOUR', 'Labour', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_surveyor', 'SURVEYOR', 'Surveyor', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('orgtyp_other', 'OTHER', 'Other', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "organizations" ADD COLUMN "organization_type_id" TEXT;

UPDATE "organizations" AS o
SET "organization_type_id" = d.id
FROM "organization_type_definitions" AS d
WHERE d.code = o."type"::text;

ALTER TABLE "organizations" ALTER COLUMN "organization_type_id" SET NOT NULL;

DROP INDEX IF EXISTS "organizations_type_idx";
DROP INDEX IF EXISTS "organizations_code_type_key";

ALTER TABLE "organizations" DROP COLUMN "type";

ALTER TABLE "organizations" ADD CONSTRAINT "organizations_organization_type_id_fkey"
    FOREIGN KEY ("organization_type_id") REFERENCES "organization_type_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "organizations_organization_type_id_idx" ON "organizations"("organization_type_id");

DROP TYPE "OrganizationType";
