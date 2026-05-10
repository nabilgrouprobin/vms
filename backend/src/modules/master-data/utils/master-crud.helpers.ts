import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { parseLimit } from "../../../lib/parse-limit";
import { rethrowPrismaDeleteError } from "./rethrow-prisma-delete-error";

const DEFAULT_LIST_LIMIT = 30;

/**
 * Loose shape of a Prisma model delegate that the master-data CRUD helpers
 * use. We accept `any` for arg/result because Prisma's per-model delegate
 * types are mutually incompatible (e.g. `Prisma.ProductDelegate` vs
 * `Prisma.LocationDelegate`); unifying them generically would require
 * conditional types over a model-name string and isn't worth the complexity
 * for a 4-method helper. Call sites pass a concretely typed delegate
 * (e.g. `this.prisma.product`) and the helper return types are declared
 * explicitly, so the loss of inference is contained.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DelegateLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findFirst: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findMany: (args: any) => Promise<any[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update: (args: any) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: (args: any) => Promise<any>;
};

export type ListMasterPaginatedQuery = {
  search?: string;
  cursor?: string;
  limit?: string;
  includeInactive?: string;
};

export type ListMasterPaginatedArgs<TRow, TSelect, TWhere> = {
  /** Concrete Prisma model delegate, e.g. `this.prisma.product`. */
  delegate: DelegateLike;
  /** `?search` / `?cursor` / `?limit` / `?includeInactive`. */
  query: ListMasterPaginatedQuery;
  /** Field projection passed straight to Prisma. */
  select: TSelect;
  /** Extra `where` constraints (e.g. account scoping). */
  baseWhere?: TWhere;
  /** Set `true` for models with a `deletedAt` column. */
  softDeletable?: boolean;
  /** Fields searched case-insensitively. Defaults to `["code", "name"]`. */
  searchFields?: ReadonlyArray<string>;
  /** Override pagination size (default 30). */
  defaultLimit?: number;
  /** Override sort. Defaults to `[{ code: "asc" }, { id: "asc" }]`. */
  orderBy?: unknown;
  /** Optional row-shape mapper applied to every returned row. */
  mapRow?: (row: TRow) => TRow;
};

export async function listMasterPaginated<TRow, TSelect, TWhere>(
  args: ListMasterPaginatedArgs<TRow, TSelect, TWhere>
): Promise<{ data: TRow[]; nextCursor: string | null; limit: number }> {
  const {
    delegate,
    query,
    baseWhere,
    softDeletable = false,
    searchFields = ["code", "name"] as const,
    select,
    defaultLimit = DEFAULT_LIST_LIMIT,
    orderBy = [{ code: "asc" }, { id: "asc" }],
    mapRow
  } = args;

  const limit = parseLimit(query.limit, defaultLimit);
  const includeInactive = query.includeInactive === "true";
  const search = query.search?.trim();

  const where = {
    ...(softDeletable ? { deletedAt: null } : {}),
    ...(includeInactive ? {} : { isActive: true }),
    ...(baseWhere ?? {}),
    ...(search
      ? {
          OR: searchFields.map((field) => ({
            [field]: { contains: search, mode: "insensitive" as const }
          }))
        }
      : {})
  };

  const rows = (await delegate.findMany({
    where,
    orderBy,
    take: limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    select
  })) as Array<TRow & { id: string }>;

  const nextCursor = rows.length > limit ? rows[limit].id : null;
  const sliced = rows.slice(0, limit);
  return {
    data: mapRow ? sliced.map((r) => mapRow(r)) : sliced,
    nextCursor,
    limit
  };
}

export type GetMasterByIdArgs<TRow, TSelect> = {
  delegate: DelegateLike;
  id: string;
  select: TSelect;
  /** Restrict to non-deleted rows when the model is soft-deletable. */
  softDeletable?: boolean;
  mapRow?: (row: TRow) => TRow;
};

export async function getMasterById<TRow, TSelect>(
  args: GetMasterByIdArgs<TRow, TSelect>
): Promise<TRow | null> {
  const { delegate, id, select, softDeletable = false, mapRow } = args;
  const where = softDeletable ? { id, deletedAt: null } : { id };
  const row = (await delegate.findFirst({ where, select })) as TRow | null;
  if (!row) return null;
  return mapRow ? mapRow(row) : row;
}

export async function softDeleteMasterRecord(args: {
  delegate: DelegateLike;
  id: string;
  /** Used in the 404 message, e.g. `"Product"` → `"Product was not found"`. */
  label: string;
  softDeletable?: boolean;
}): Promise<{ id: string; isActive: boolean }> {
  const { delegate, id, label, softDeletable = false } = args;
  const where = softDeletable ? { id, deletedAt: null } : { id };
  const existing = await delegate.findFirst({ where, select: { id: true } });
  if (!existing) {
    throw new NotFoundException(`${label} was not found`);
  }
  return (await delegate.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, isActive: true }
  })) as { id: string; isActive: boolean };
}

export async function hardDeleteMasterRecord(args: {
  delegate: DelegateLike;
  id: string;
  label: string;
  softDeletable?: boolean;
}): Promise<{ ok: true }> {
  const { delegate, id, label, softDeletable = false } = args;
  const where = softDeletable
    ? { id, isActive: false, deletedAt: null }
    : { id, isActive: false };
  const existing = await delegate.findFirst({ where, select: { id: true } });
  if (!existing) {
    throw new NotFoundException(
      `${label} was not found or is still active. Deactivate it before removing permanently.`
    );
  }
  try {
    await delegate.delete({ where: { id } });
  } catch (e) {
    rethrowPrismaDeleteError(e);
  }
  return { ok: true as const };
}

/**
 * Centralised Prisma-error → Nest-error mapping for *unique-constraint*
 * violations on master-data create/update. The `errorMessages` callback
 * customises the 4xx text per-resource.
 *
 * Usage:
 *   ```ts
 *   try { return await prisma.product.create({...}); }
 *   catch (e) { throwIfUniqueConflict(e, "Another product already uses this code."); throw e; }
 *   ```
 */
export function throwIfUniqueConflict(e: unknown, message: string): void {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    throw new BadRequestException(message);
  }
}
