"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  dismiss,
  subscribeToToasts,
  type ToastRecord,
  type ToastVariant
} from "@/lib/toast";
import { cn } from "@/lib/utils";

const variantAccent: Record<ToastVariant, string> = {
  info: "border-l-sky-500",
  success: "border-l-emerald-500",
  warning: "border-l-amber-500",
  error: "border-l-red-500"
};

const variantIcon: Record<ToastVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle
};

const TOAST_EXIT_MS = 220;

function ToastCard({
  toast: t,
  exiting,
  onDismiss
}: {
  toast: ToastRecord;
  exiting: boolean;
  onDismiss: (id: number) => void;
}) {
  const Icon = variantIcon[t.variant];

  return (
    <div
      role={t.variant === "error" || t.variant === "warning" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-md border border-border border-l-4 bg-card text-card-foreground shadow-md",
        variantAccent[t.variant],
        "vms-toast-enter",
        exiting && "vms-toast-exit"
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <Icon
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{t.title}</p>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{t.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(t.id)}
          aria-label="Dismiss"
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<number>>(() => new Set());

  useEffect(() => subscribeToToasts(setToasts), []);

  const requestDismiss = useCallback((id: number) => {
    setExitingIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    window.setTimeout(() => {
      dismiss(id);
      setExitingIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, TOAST_EXIT_MS);
  }, []);

  const notifications = toasts.filter((t) => !t.actions?.length);

  if (notifications.length === 0 && exitingIds.size === 0) return null;

  return (
    <div
      data-vms-toaster
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
    >
      {notifications.map((t) => (
        <ToastCard
          key={t.id}
          toast={t}
          exiting={exitingIds.has(t.id)}
          onDismiss={requestDismiss}
        />
      ))}
    </div>
  );
}
