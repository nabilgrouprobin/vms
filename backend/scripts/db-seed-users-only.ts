/**
 * Insert / upsert login users + role assignments only (does not truncate other tables).
 * Login uses **phone** + password (see AuthService.login).
 *
 * Requires at least one Organization row (e.g. minimal seed `ORG-MIN`).
 *
 *   ALLOW_DB_SEED_USERS=true npx tsx scripts/db-seed-users-only.ts
 *
 * Env:
 *   SEED_ADMIN_PHONE    default +8801700000001
 *   SEED_ADMIN_EMAIL    optional (nullable if unset)
 *   SEED_ADMIN_NAME     default "System Administrator"
 *   SEED_ADMIN_PASSWORD default ChangeMe!123  (always hashed on create; see below)
 *
 * If the admin user already exists:
 *   SEED_UPDATE_EXISTING_PASSWORD=true  — re-hash and set password from SEED_ADMIN_PASSWORD
 *
 * Clears `user_sessions` for the seeded phone(s) so old JWT cookies are invalidated.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { AppRole, PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const ALLOW = process.env.ALLOW_DB_SEED_USERS === "true";
const connectionString = process.env.DATABASE_URL;

async function main(): Promise<void> {
  if (!ALLOW) {
    console.error("Refusing: set ALLOW_DB_SEED_USERS=true");
    process.exit(1);
  }
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const phone = process.env.SEED_ADMIN_PHONE?.trim() || "+8801700000001";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!123";
  const fullName = process.env.SEED_ADMIN_NAME?.trim() || "System Administrator";
  const emailRaw = process.env.SEED_ADMIN_EMAIL?.trim();
  const email = emailRaw && emailRaw.length > 0 ? emailRaw : null;
  const updateExistingPw = process.env.SEED_UPDATE_EXISTING_PASSWORD === "true";

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString })
  });

  try {
    const org = await prisma.organization.findFirst({
      where: { deletedAt: null, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true }
    });
    if (!org) {
      throw new Error(
        "No active organization found. Create one first (e.g. run db:clean-minimal or master data)."
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, passwordHash: true }
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          phone,
          email,
          fullName,
          organizationId: org.id,
          passwordHash,
          isActive: true
        }
      });
    } else {
      const setPw = updateExistingPw || !existing.passwordHash;
      await prisma.user.update({
        where: { phone },
        data: {
          email,
          fullName,
          organizationId: org.id,
          isActive: true,
          deletedAt: null,
          ...(setPw ? { passwordHash } : {})
        }
      });
      if (setPw && !updateExistingPw && !existing.passwordHash) {
        console.log("Set password on existing user (had no password hash).");
      }
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { phone },
      select: { id: true, phone: true, fullName: true }
    });

    await prisma.userRoleAssignment.deleteMany({ where: { userId: user.id } });
    await prisma.userRoleAssignment.create({
      data: {
        userId: user.id,
        role: AppRole.SUPER_ADMIN
      }
    });

    await prisma.userSession.deleteMany({ where: { userId: user.id } });

    console.log(`Organization: ${org.code} — ${org.name}`);
    console.log(`User upserted: ${user.fullName} · phone ${user.phone} (login with phone)`);
    console.log(`Role: SUPER_ADMIN`);
    if (!existing) {
      console.log(`Default password (change immediately): ${password}`);
    } else if (!updateExistingPw && existing.passwordHash) {
      console.log(
        "Password unchanged. To reset: SEED_UPDATE_EXISTING_PASSWORD=true SEED_ADMIN_PASSWORD='...' ALLOW_DB_SEED_USERS=true npm run db:seed-users"
      );
    } else if (updateExistingPw) {
      console.log("Password updated from SEED_ADMIN_PASSWORD.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
