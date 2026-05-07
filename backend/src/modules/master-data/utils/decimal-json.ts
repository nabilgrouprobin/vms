import { Prisma } from "@prisma/client";

export function decString(v: Prisma.Decimal | null | undefined): string | null {
  if (v === null || v === undefined) {
    return null;
  }
  return v.toString();
}

export function toDecimalOrNull(
  v: number | null | undefined
): Prisma.Decimal | null | undefined {
  if (v === undefined) {
    return undefined;
  }
  if (v === null) {
    return null;
  }
  return new Prisma.Decimal(v);
}
