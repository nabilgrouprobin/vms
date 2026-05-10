"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { dismiss, subscribeToToasts, type ToastRecord, type ToastVariant } from "@/lib/toast";
import { cn } from "@/lib/utils";

const variantStyles: Record<ToastVariant, string> = {
  info: "border-sky-500/40 bg-sky-50 text-sky-900 dark:bg-sky-950/60 dark:text-sky-100",
  success:
    "border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100",
  warning:
    "border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100",
  error:
    "border-red-500/50 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-100"
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  useEffect(() => subscribeToToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end sm:px-0"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.variant === "error" || t.variant === "warning" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto w-full max-w-sm overflow-hidden rounded-md border shadow-lg",
            variantStyles[t.variant]
          )}
        >
          <div className="flex items-start gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                {t.title}
              </p>
              <p className="mt-0.5 break-words text-sm">{t.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-1 text-current opacity-70 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
