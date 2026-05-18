"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  answerConfirmDialog,
  subscribeConfirmDialog,
  type ConfirmDialogState
} from "@/lib/confirm-dialog";

export function ConfirmDialogHost() {
  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null);

  useEffect(() => subscribeConfirmDialog(setDialog), []);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") answerConfirmDialog(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  if (!dialog) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close dialog"
        onClick={() => answerConfirmDialog(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="vms-confirm-title"
        aria-describedby="vms-confirm-desc"
        className="relative z-[1] w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg"
      >
        <h2 id="vms-confirm-title" className="text-base font-semibold text-foreground">
          {dialog.title}
        </h2>
        <p id="vms-confirm-desc" className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {dialog.message}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => answerConfirmDialog(false)}>
            {dialog.cancelLabel}
          </Button>
          <Button type="button" onClick={() => answerConfirmDialog(true)}>
            {dialog.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}