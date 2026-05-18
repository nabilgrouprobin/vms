"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { applySearchParams } from "@/lib/workspace-paths";

/** Open the add-event sheet once when `?addEvent=1` is present, then strip the flag from the URL. */
export function useSofAddEventFromQuery(
  ready: boolean,
  openAddEvent: () => void | Promise<void>
) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const openRef = useRef(openAddEvent);
  openRef.current = openAddEvent;
  const handledFor = useRef<string | null>(null);

  const addEvent = searchParams.get("addEvent") === "1";
  const sofId = searchParams.get("id")?.trim() ?? "";

  useEffect(() => {
    if (!addEvent || !ready || !sofId) return;
    const key = `${sofId}:addEvent`;
    if (handledFor.current === key) return;
    handledFor.current = key;

    void Promise.resolve(openRef.current()).finally(() => {
      router.replace(
        applySearchParams(pathname, searchParams, { addEvent: null }),
        { scroll: false }
      );
    });
  }, [addEvent, ready, sofId, pathname, router, searchParams]);
}
