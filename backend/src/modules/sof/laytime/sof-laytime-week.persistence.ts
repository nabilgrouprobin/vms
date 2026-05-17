import { Prisma } from "@prisma/client";

import type { PrismaService } from "../../../prisma/prisma.service";

export type SofLaytimeWeekFields = {
  laytimeExcludedTimePeriod: string | null;
  laytimeExcludedDays: string[];
};

/**
 * Read/write SOF working-week columns via SQL until `prisma generate` includes them
 * on StatementOfFacts (client can lag schema after migrations).
 */
export async function loadSofLaytimeWeekFields(
  prisma: PrismaService,
  statementId: string
): Promise<SofLaytimeWeekFields> {
  const rows = await prisma.$queryRaw<
    Array<{
      laytime_excluded_time_period: string | null;
      laytime_excluded_days: string[] | null;
    }>
  >(
    Prisma.sql`
      SELECT laytime_excluded_time_period, laytime_excluded_days
      FROM statements_of_fact
      WHERE id = ${statementId}
      LIMIT 1
    `
  );
  const row = rows[0];
  return {
    laytimeExcludedTimePeriod: row?.laytime_excluded_time_period ?? null,
    laytimeExcludedDays: row?.laytime_excluded_days ?? []
  };
}

export async function persistSofLaytimeWeekFields(
  prisma: PrismaService,
  statementId: string,
  fields: {
    laytimeExcludedTimePeriod?: string | null;
    laytimeExcludedDays?: string[];
  }
): Promise<void> {
  if (
    fields.laytimeExcludedTimePeriod === undefined &&
    fields.laytimeExcludedDays === undefined
  ) {
    return;
  }

  const current = await loadSofLaytimeWeekFields(prisma, statementId);
  const period =
    fields.laytimeExcludedTimePeriod !== undefined
      ? fields.laytimeExcludedTimePeriod
      : current.laytimeExcludedTimePeriod;
  const days =
    fields.laytimeExcludedDays !== undefined
      ? fields.laytimeExcludedDays
      : current.laytimeExcludedDays;

  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE statements_of_fact
      SET
        laytime_excluded_time_period = ${period},
        laytime_excluded_days = ${days}::text[],
        updated_at = NOW()
      WHERE id = ${statementId}
    `
  );
}
