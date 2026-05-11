import { useEffect } from "react";

type AutoLoadAllPagesInput = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  /** When false the hook is a no-op (e.g. data not ready yet). Defaults to true. */
  enabled?: boolean;
};

/**
 * Eagerly fetch every remaining page of a `useInfiniteQuery` after the first one
 * arrives. Pair with cursor-paginated lists that need the COMPLETE timeline
 * loaded client-side for derived calculations such as SOF event gap detection,
 * which would otherwise produce phantom gaps when the unloaded tail contains
 * events that implicitly chain into the visible window.
 *
 * Stops automatically once `hasNextPage` flips to false; each `fetchNextPage`
 * call only fires when the previous one has settled (`!isFetchingNextPage`).
 */
export function useAutoLoadAllPages({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  enabled = true
}: AutoLoadAllPagesInput): void {
  useEffect(() => {
    if (!enabled) return;
    if (!hasNextPage) return;
    if (isFetchingNextPage) return;
    fetchNextPage();
  }, [enabled, hasNextPage, isFetchingNextPage, fetchNextPage]);
}
