/**
 * Centered confirm dialog (modal). Used for actions that need explicit
 * confirmation — separate from bottom-right notification toasts.
 */

export type ConfirmDialogInput = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export type ConfirmDialogState = ConfirmDialogInput & {
  id: number;
};

let nextId = 1;
let active: ConfirmDialogState | null = null;
let resolveActive: ((value: boolean) => void) | null = null;
const listeners = new Set<(state: ConfirmDialogState | null) => void>();

function emit() {
  for (const listener of listeners) {
    listener(active);
  }
}

export function subscribeConfirmDialog(listener: (state: ConfirmDialogState | null) => void) {
  listeners.add(listener);
  listener(active);
  return () => {
    listeners.delete(listener);
  };
}

export function showConfirmDialog(input: ConfirmDialogInput): Promise<boolean> {
  return new Promise((resolve) => {
    if (resolveActive) {
      resolveActive(false);
    }
    resolveActive = resolve;
    active = {
      id: nextId++,
      title: input.title,
      message: input.message,
      confirmLabel: input.confirmLabel ?? "Continue",
      cancelLabel: input.cancelLabel ?? "Cancel"
    };
    emit();
  });
}

export function answerConfirmDialog(confirmed: boolean) {
  const resolve = resolveActive;
  resolveActive = null;
  active = null;
  emit();
  resolve?.(confirmed);
}

/** Confirm switching an SOF event between Count and Not count. */
export function confirmLaytimeCountChange(nextCountsAsLaytime: boolean): Promise<boolean> {
  const toCount = nextCountsAsLaytime;
  return showConfirmDialog({
    title: toCount ? "Mark as Count?" : "Mark as Not count?",
    message: toCount
      ? "This event's contact hours will count toward laytime on the daily sheet."
      : "This event stays in the contact window but will not count toward laytime used.",
    confirmLabel: toCount ? "Count laytime" : "Exclude from count",
    cancelLabel: "Keep as is"
  });
}
