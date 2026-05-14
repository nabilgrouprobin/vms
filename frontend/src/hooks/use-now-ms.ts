import { useEffect, useState } from "react";

/** Wall-clock milliseconds for pure render calculations; ticks on an interval. */
export function useNowMs(refreshIntervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), refreshIntervalMs);
    return () => window.clearInterval(id);
  }, [refreshIntervalMs]);
  return now;
}
