"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSofOptions } from "@/lib/sof-api";

/** SofOptions change rarely; long stale time avoids repeat work when switching SOF pages. */
const STALE_MS = 5 * 60_000;

export function useSofOptionsQuery() {
  return useQuery({
    queryKey: ["sof-options"] as const,
    queryFn: fetchSofOptions,
    staleTime: STALE_MS
  });
}
