import { useCallback, useEffect, useMemo, useState } from "react";

/** Common page-size choices for tables; pass your own when calling `PaginationBar`. */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Classic page index + page size for a list whose **total length is known** (e.g. full array in memory).
 * Use with `PaginationBar` and slice: `items.slice(range.start, range.end)`.
 */
export function useOffsetPagination(args: {
  totalItems: number;
  initialPageSize?: number;
  pageSizeOptions?: readonly number[];
}) {
  const sizeChoices = args.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSizeState] = useState(
    () => args.initialPageSize ?? (sizeChoices[0] as number)
  );

  const totalPages = useMemo(() => {
    if (args.totalItems <= 0) return 1;
    return Math.max(1, Math.ceil(args.totalItems / pageSize));
  }, [args.totalItems, pageSize]);

  useEffect(() => {
    setPageIndex((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  const setPageSize = useCallback((n: number) => {
    setPageSizeState(n);
    setPageIndex(0);
  }, []);

  const start = pageIndex * pageSize;
  const range = useMemo(() => {
    const from = args.totalItems === 0 ? 0 : start + 1;
    const to = Math.min(start + pageSize, args.totalItems);
    return { from, to, start, end: start + pageSize };
  }, [args.totalItems, pageSize, start]);

  const canPrev = pageIndex > 0;
  const canNext = pageIndex < totalPages - 1;

  const goPrev = useCallback(() => {
    setPageIndex((p) => Math.max(0, p - 1));
  }, []);

  const goNext = useCallback(() => {
    setPageIndex((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  return {
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    pageSizeOptions: sizeChoices,
    totalPages,
    canPrev,
    canNext,
    goPrev,
    goNext,
    range
  };
}
