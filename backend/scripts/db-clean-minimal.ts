/**
 * Destructive: truncates ALL public tables except `_prisma_migrations`, then inserts one demo row
 * per core entity — NO users (signup/login will fail until someone registers).
 *
 * Run from backend/: ALLOW_DB_WIPE_MINIMAL=I_UNDERSTAND_THIS_DESTROYS_ALL_DATA npx tsx scripts/db-clean-minimal.ts
 *
 * Notes:
 * - `sof_events` requires `created_by` → User; this seed inserts NO SofEvents (empty table).
 * - Lookup enums reference counts vary by screen; this keeps one representative row where FK-safe.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  LocationType,
  MotherVesselStatus,
  PrismaClient,
  ProductType,
  SOFScope,
  SOFStatus,
  SofEventTypeCategory,
  SofEventTypeScope
} from "@prisma/client";
import pg from "pg";

const ALLOW =
  process.env.ALLOW_DB_WIPE_MINIMAL === "I_UNDERSTAND_THIS_DESTROYS_ALL_DATA";

const connectionString = process.env.DATABASE_URL;

function qi(ident: string): string {
  return `"${ident.replace(/"/g, '""')}"`;
}

async function truncateAllPublic(pool: pg.Pool): Promise<number> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables
       WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
       ORDER BY tablename`
    );
    if (rows.length === 0) return 0;
    const list = rows.map((r) => `public.${qi(r.tablename)}`).join(", ");
    await client.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
    return rows.length;
  } finally {
    client.release();
  }
}

async function seedMinimal(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.organizationTypeDefinition.create({
      data: {
        id: "minimal_orgtyp_other",
        code: "OTHER",
        name: "Other"
      }
    });

    await tx.organization.create({
      data: {
        id: "minimal_org",
        code: "ORG-MIN",
        name: "Minimal placeholder organization",
        organizationTypeId: "minimal_orgtyp_other"
      }
    });

    await tx.location.create({
      data: {
        id: "minimal_loc",
        code: "LOC-MIN",
        name: "Minimal location",
        type: LocationType.PORT,
        country: "Bangladesh"
      }
    });

    await tx.product.create({
      data: {
        id: "minimal_prod",
        code: "PROD-MIN",
        name: "Minimal product",
        type: ProductType.OTHER
      }
    });

    await tx.vessel.create({
      data: {
        id: "minimal_mother_vessel",
        name: "Minimal Mother Vessel",
        isMotherVessel: true,
        isLighter: false,
        isActive: true,
        hullDisplayCode: 1
      } as any
    });

    /**
     * Call/SOF numbers follow the unified format `YY-MM-DD-{hull}-{seq}`
     * (3-digit padded). Hull `001` is the mother vessel above; this is the
     * first call of the seed date.
     */
    const seedCallNo = "26-05-09-001-001";
    await tx.vesselCall.create({
      data: {
        id: "minimal_vessel_call",
        callNo: seedCallNo,
        vesselId: "minimal_mother_vessel",
        arrivalLocationId: "minimal_loc",
        shippingAgentId: "minimal_org",
        status: MotherVesselStatus.EXPECTED,
        cargoNameSnapshot: "Demo cargo"
      }
    });

    await tx.sofEventTypeDefinition.create({
      data: {
        id: "minimal_sof_evt_type",
        code: "EVT-MINIMAL",
        name: "Minimal placeholder event type",
        scope: SofEventTypeScope.BOTH,
        category: SofEventTypeCategory.NORMAL
      }
    });

    /** SOF number mirrors the parent call number (1:1 by schema). */
    await tx.statementOfFacts.create({
      data: {
        id: "minimal_sof",
        sofNo: seedCallNo,
        scope: SOFScope.MOTHER_VESSEL,
        vesselCallId: "minimal_vessel_call",
        status: SOFStatus.DRAFT
      }
    });
  });
}

async function main(): Promise<void> {
  if (!ALLOW) {
    console.error(
      "Refusing to run: set ALLOW_DB_WIPE_MINIMAL=I_UNDERSTAND_THIS_DESTROYS_ALL_DATA"
    );
    process.exit(1);
  }
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new pg.Pool({ connectionString });
  try {
    const n = await truncateAllPublic(pool);
    console.log(`Truncated ${n} public tables (migrations preserved).`);
  } finally {
    await pool.end();
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString })
  });
  try {
    await seedMinimal(prisma);
    console.log("Inserted minimal seed (no users).");
    console.log(
      "Core counts: org types 1, orgs 1, locations 1, products 1, vessels 1, vessel_calls 1, SOF event defs 1, SOFs 1; users 0."
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
