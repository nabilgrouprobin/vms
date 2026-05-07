import { Prisma } from "@prisma/client";
export declare function decString(v: Prisma.Decimal | null | undefined): string | null;
export declare function toDecimalOrNull(v: number | null | undefined): Prisma.Decimal | null | undefined;
