/**
 * Grant SUPER_ADMIN and SYSTEM_ADMIN to a user by phone (exact DB match or +880 / 880 variants).
 *
 *   ALLOW_GRANT_USER_ROLES=true USER_PHONE=01330626349 npx tsx scripts/grant-user-admin-roles.ts
 *
 * Clears sessions for that user so they must sign in again (JWT embeds roles).
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { AppRole, PrismaClient } from "@prisma/client";

import { bdPhoneLoginVariants } from "../src/lib/bd-phone-variants";

const ALLOW = process.env.ALLOW_GRANT_USER_ROLES === "true";
const rawPhone = process.env.USER_PHONE?.trim();
const connectionString = process.env.DATABASE_URL;

async function main(): Promise<void> {
  if (!ALLOW) {
    console.error("Refusing: set ALLOW_GRANT_USER_ROLES=true");
    process.exit(1);
  }
  if (!rawPhone) {
    console.error("Set USER_PHONE (e.g. 01330626349)");
    process.exit(1);
  }
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const variants = bdPhoneLoginVariants(rawPhone);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString })
  });

  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        phone: { in: variants }
      },
      select: { id: true, phone: true, fullName: true }
    });

    if (users.length === 0) {
      console.error(`No user found for phone variants: ${variants.join(", ")}`);
      process.exit(1);
    }

    for (const user of users) {
      for (const role of [AppRole.SUPER_ADMIN, AppRole.SYSTEM_ADMIN] as const) {
        const exists = await prisma.userRoleAssignment.findFirst({
          where: { userId: user.id, role, locationId: null }
        });
        if (!exists) {
          await prisma.userRoleAssignment.create({
            data: { userId: user.id, role, locationId: null }
          });
        }
      }

      await prisma.userSession.deleteMany({ where: { userId: user.id } });

      const roles = await prisma.userRoleAssignment.findMany({
        where: { userId: user.id },
        select: { role: true }
      });

      console.log(`User: ${user.fullName} · ${user.phone} (${user.id})`);
      console.log(`Roles now: ${[...new Set(roles.map((r) => r.role))].sort().join(", ")}`);
    }

    console.log("Sessions cleared for matched user(s) — sign in again to refresh the token.");
  } finally {
    await prisma.$disconnect();
  }
}

void main();
