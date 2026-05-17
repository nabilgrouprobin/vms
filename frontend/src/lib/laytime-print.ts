/**
 * Opt-in laytime print layout: add `html.print-laytime-mode` before `window.print()`
 * so `globals.css` can hide app chrome and `.laytime-print-suppress` regions.
 */
export const LAYTIME_PRINT_MODE_HTML_CLASS = "print-laytime-mode";

/** Delay (ms) fallback if `afterprint` does not fire (some Safari builds). */
const CLEANUP_FALLBACK_MS = 2500;

export function runLaytimeBundlePrint(): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const root = document.documentElement;
  root.classList.add(LAYTIME_PRINT_MODE_HTML_CLASS);

  let cleaned = false;

  const onAfterPrint = () => {
    cleanup();
  };

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    root.classList.remove(LAYTIME_PRINT_MODE_HTML_CLASS);
    window.removeEventListener("afterprint", onAfterPrint);
    window.clearTimeout(fallbackTimer);
  };

  const fallbackTimer = window.setTimeout(cleanup, CLEANUP_FALLBACK_MS);

  window.addEventListener("afterprint", onAfterPrint);

  requestAnimationFrame(() => {
    window.print();
  });
}
