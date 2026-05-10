import { Prisma } from "@prisma/client";

/**
 * Canonical Prisma.Decimal <-> JSON helpers, shared by every module.
 *
 * - `decString` serialises a Decimal column for the API response (string,
 *   never a number, to keep precision).
 * - `toDecimalOrNull` accepts a JSON number/null/undefined from a DTO and
 *   returns the `Decimal | null | undefined` shape Prisma's update inputs
 *   need (undefined means "leave unchanged", null means "set to NULL").
 */

export function decString(v: Prisma.Decimal | null | undefined): string | null {
  if (v === null || v === undefined) {
    return null;
  }
  return v.toString();
}

export function toDecimalOrNull(
  v: number | string | null | undefined
): Prisma.Decimal | null | undefined {
  if (v === undefined) {
    return undefined;
  }
  if (v === null || v === "") {
    return null;
  }
  return new Prisma.Decimal(v);
}

/** Required-Decimal variant: throws if a present-but-empty value is passed. */
export function toRequiredDecimal(v: number | string): Prisma.Decimal {
  if (v === null || v === undefined || v === "") {
    throw new Error("Required Decimal value was missing");
  }
  return new Prisma.Decimal(v);
}
