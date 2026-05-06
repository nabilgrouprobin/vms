import { useEffect, useState } from "react";

/**
 * Returns `value` after it has stayed unchanged for `delayMs` (default 300ms).
 * Useful for search boxes backed by server queries.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
