"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type QueryKey
} from "@tanstack/react-query";
import { useMemo } from "react";

import { useCursorBackedPagination } from "@/hooks/use-cursor-backed-pagination";
import { parseApiErr } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import type { Paginated } from "@/types/vms";

export type MasterCrudListParams = {
  limit?: number;
  cursor?: string;
  search?: string;
  includeInactive?: boolean;
};

export type MasterCrudFetcher<TRow> = (
  params: MasterCrudListParams
) => Promise<Paginated<TRow>>;

export type UseMasterCrudArgs<TRow extends { id: string }> = {
  /** React Query key factory call, e.g. `masterDataKeys.products()`. */
  queryKey: QueryKey;
  /** Concrete `fetch...` from `master-data-api`. */
  fetchList: MasterCrudFetcher<TRow>;
  /** `?search` value (already debounced by the caller). */
  search: string;
  /** Whether to include inactive rows in the listing. */
  includeInactive: boolean;
  /** Page size for the infinite query. Defaults to 24. */
  pageSize?: number;
  /** `(id) => Promise<unknown>` — defaults to no-op (page falls back to inline). */
  softDelete?: (id: string) => Promise<unknown>;
  restore?: (id: string) => Promise<unknown>;
  purge?: (id: string) => Promise<unknown>;
  /**
   * Additional cache keys to invalidate after every successful mutation —
   * use for sibling caches like `["location-options"]` that mirror the same
   * underlying rows.
   */
  extraInvalidateKeys?: ReadonlyArray<QueryKey>;
};

/**
 * Reusable React Query + cursor-pager glue for the master-data list pages.
 *
 * Each page used to repeat:
 *   const listQ = useInfiniteQuery({ queryKey, queryFn, getNextPageParam })
 *   const rows = useMemo(() => listQ.data?.pages.flatMap(...))
 *   const pager = useCursorBackedPagination({ items: rows, ... })
 *   const deleteM = useMutation({ mutationFn: softDeleteX, onSuccess: invalidate })
 *   const restoreM = useMutation({ mutationFn: patchX(isActive: true), onSuccess: invalidate })
 *   const purgeM = useMutation({ mutationFn: purgeX, onSuccess: invalidate })
 *
 * That whole stack collapses into one `useMasterCrud(...)` call. Form-specific
 * `create`/`update` mutations remain per-page because every form is bespoke.
 */
export function useMasterCrud<TRow extends { id: string }>({
  queryKey,
  fetchList,
  search,
  includeInactive,
  pageSize = 24,
  softDelete,
  restore,
  purge,
  extraInvalidateKeys
}: UseMasterCrudArgs<TRow>) {
  const qc = useQueryClient();

  // Stable queryKey: `[...baseKey, search, includeInactive]`. Ensures filter
  // changes invalidate independently while sharing a parent prefix for
  // bulk invalidation via `qc.invalidateQueries({ queryKey })`.
  const fullKey = useMemo<QueryKey>(
    () => [...queryKey, search, includeInactive] as const,
    [queryKey, search, includeInactive]
  );

  const listQ = useInfiniteQuery({
    queryKey: fullKey,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
    queryFn: ({ pageParam }) =>
      fetchList({
        limit: pageSize,
        cursor: pageParam,
        search: search || undefined,
        includeInactive
      }),
    getNextPageParam: (last: Paginated<TRow>) => last.nextCursor ?? undefined
  });

  const rows = useMemo(
    () => listQ.data?.pages.flatMap((p) => p.data) ?? [],
    [listQ.data]
  );

  const listResetKey = useMemo(
    () => `${search}\u0000${includeInactive ? "1" : "0"}`,
    [search, includeInactive]
  );

  const pager = useCursorBackedPagination({
    items: rows,
    hasNextPage: Boolean(listQ.hasNextPage),
    fetchNextPage: () => void listQ.fetchNextPage(),
    isFetchingNextPage: listQ.isFetchingNextPage,
    resetKey: listResetKey
  });

  const invalidateList = async () => {
    await qc.invalidateQueries({ queryKey });
    if (extraInvalidateKeys?.length) {
      await Promise.all(
        extraInvalidateKeys.map((key) => qc.invalidateQueries({ queryKey: key }))
      );
    }
  };

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      if (!softDelete) throw new Error("softDelete handler missing");
      return softDelete(id);
    },
    onSuccess: invalidateList
  });

  const restoreM = useMutation({
    mutationFn: async (id: string) => {
      if (!restore) throw new Error("restore handler missing");
      return restore(id);
    },
    onSuccess: invalidateList
  });

  const purgeM = useMutation({
    mutationFn: async (id: string) => {
      if (!purge) throw new Error("purge handler missing");
      return purge(id);
    },
    onSuccess: invalidateList
  });

  /**
   * Convenience wrapper around the row action buttons: shows a window.confirm
   * prompt with the row's display name, fires the mutation, and toasts errors.
   */
  function runRowAction(
    mutation: { mutate: (id: string, opts?: { onError?: (e: unknown) => void }) => void },
    id: string,
    confirmMessage: string
  ) {
    if (!window.confirm(confirmMessage)) return;
    mutation.mutate(id, {
      onError: (e) => toast.error(parseApiErr(e))
    });
  }

  return {
    listQ,
    rows,
    pager,
    deleteM,
    restoreM,
    purgeM,
    invalidateList,
    runRowAction
  };
}
