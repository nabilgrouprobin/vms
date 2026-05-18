import { Prisma } from "@prisma/client";

import type { PrismaService } from "../../../prisma/prisma.service";

export type SofLaytimeSummaryFields = {
  laytimeMinimumAllowedHours: string | null;
  laytimeGraceHours: string | null;
};

function decimalToApiString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

/** Read/write summary params via SQL until Prisma client includes the columns. */
export async function loadSofLaytimeSummaryFields(
  prisma: PrismaService,
  statementId: string
): Promise<SofLaytimeSummaryFields> {
  const rows = await prisma.$queryRaw<
    Array<{
      laytime_minimum_allowed_hours: unknown;
      laytime_grace_hours: unknown;
    }>
  >(
    Prisma.sql`
      SELECT laytime_minimum_allowed_hours, laytime_grace_hours
      FROM statements_of_fact
      WHERE id = ${statementId}
      LIMIT 1
    `
  );
  const row = rows[0];
  return {
    laytimeMinimumAllowedHours: decimalToApiString(row?.laytime_minimum_allowed_hours),
    laytimeGraceHours: decimalToApiString(row?.laytime_grace_hours)
  };
}

export async function persistSofLaytimeSummaryFields(
  prisma: PrismaService,
  statementId: string,
  fields: {
    laytimeMinimumAllowedHours?: string | number | null | { toString(): string };
    laytimeGraceHours?: string | number | null | { toString(): string };
  }
): Promise<void> {
  if (
    fields.laytimeMinimumAllowedHours === undefined &&
    fields.laytimeGraceHours === undefined
  ) {
    return;
  }

  const current = await loadSofLaytimeSummaryFields(prisma, statementId);
  const minimum =
    fields.laytimeMinimumAllowedHours !== undefined
      ? fields.laytimeMinimumAllowedHours
      : current.laytimeMinimumAllowedHours;
  const grace =
    fields.laytimeGraceHours !== undefined
      ? fields.laytimeGraceHours
      : current.laytimeGraceHours;

  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE statements_of_fact
      SET
        laytime_minimum_allowed_hours = ${minimum}::numeric,
        laytime_grace_hours = ${grace}::numeric,
        updated_at = NOW()
      WHERE id = ${statementId}
    `
  );
}
