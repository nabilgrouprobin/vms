import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/hooks/use-offset-pagination";

type CursorPagerInput<T> = {
  items: readonly T[];
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  /** When this value changes (e.g. search + filters), page resets to 0. */
  resetKey: string;
  initialPageSize?: number;
  pageSizeOptions?: readonly number[];
};

/**
 * Page through data that arrives in chunks (e.g. `useInfiniteQuery` + cursor API).
 * Prefetches forward until the current window is filled. Pair with `PaginationBar`.
 */
export function useCursorBackedPagination<T>(input: CursorPagerInput<T>) {
  const {
    items,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    resetKey,
    initialPageSize,
    pageSizeOptions
  } = input;

  const sizeChoices = pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSizeState] = useState(
    () => initialPageSize ?? (sizeChoices[0] as number)
  );

  useEffect(() => {
    setPageIndex(0);
  }, [resetKey]);

  const setPageSize = useCallback((n: number) => {
    setPageSizeState(n);
    setPageIndex(0);
  }, []);

  const requiredCount = (pageIndex + 1) * pageSize;

  useEffect(() => {
    if (items.length >= requiredCount) return;
    if (!hasNextPage) return;
    if (isFetchingNextPage) return;
    fetchNextPage();
  }, [items.length, requiredCount, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const start = pageIndex * pageSize;
  const pageItems = useMemo(() => items.slice(start, start + pageSize), [items, start, pageSize]);

  const hasLocalNextPage = (pageIndex + 1) * pageSize < items.length;
  const canGoNext = hasLocalNextPage || (hasNextPage && items.length > start);
  const canGoPrev = pageIndex > 0;

  const goPrev = useCallback(() => {
    setPageIndex((p) => Math.max(0, p - 1));
  }, []);

  const goNext = useCallback(() => {
    setPageIndex((p) => {
      const s = p * pageSize;
      const localNext = (p + 1) * pageSize < items.length;
      const remoteNext = hasNextPage && items.length > s;
      if (localNext || remoteNext) return p + 1;
      return p;
    });
  }, [hasNextPage, items.length, pageSize]);

  useEffect(() => {
    if (items.length === 0) {
      setPageIndex(0);
      return;
    }
    if (!hasNextPage) {
      const maxIdx = Math.max(0, Math.ceil(items.length / pageSize) - 1);
      setPageIndex((p) => Math.min(p, maxIdx));
    }
  }, [items.length, hasNextPage, pageSize]);

  const rangeLabel = useMemo(() => {
    if (items.length === 0) {
      return hasNextPage ? "Loading…" : "No rows";
    }
    const from = start + 1;
    const to = Math.min(start + pageSize, items.length);
    const base = `Showing ${from}–${to} of ${items.length} loaded`;
    return hasNextPage ? `${base} — more available` : base;
  }, [hasNextPage, items.length, pageSize, start]);

  return {
    pageItems,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    pageSizeOptions: sizeChoices,
    canGoPrev,
    canGoNext,
    goPrev,
    goNext,
    rangeLabel,
    isPrefetching: isFetchingNextPage && items.length < requiredCount
  };
}
