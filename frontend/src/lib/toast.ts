/**
 * Tiny pub/sub toast store. Replaces native window.alert() for inline
 * notifications across the app. Subscribed by `<Toaster />` mounted in
 * the root layout.
 */

export type ToastVariant = "info" | "success" | "error" | "warning";

export type ToastAction = {
  label: string;
  variant?: "primary" | "secondary";
  onClick: () => void;
};

export type ToastInput = {
  message: string;
  /** Defaults to "info". */
  variant?: ToastVariant;
  /** Defaults vary by variant: info/success 4s, warning 6s, error 8s. 0 = stay until dismissed. */
  durationMs?: number;
  /** Defaults to "Notice" / "Success" / "Error" / "Heads up" by variant. */
  title?: string;
  /** Action buttons (e.g. confirm / cancel). Implies `durationMs: 0` when unset. */
  actions?: ToastAction[];
  /** Called when the toast is dismissed via the close control (not when `dismiss` is silent). */
  onDismiss?: () => void;
};

export type ToastRecord = {
  id: number;
  variant: ToastVariant;
  message: string;
  title: string;
  durationMs: number;
  actions?: ToastAction[];
  createdAt: number;
};

const titleByVariant: Record<ToastVariant, string> = {
  info: "Notice",
  success: "Success",
  error: "Error",
  warning: "Heads up"
};

const defaultDurationByVariant: Record<ToastVariant, number> = {
  info: 4000,
  success: 4000,
  warning: 6000,
  error: 8000
};

let nextId = 1;
const listeners = new Set<(toasts: ToastRecord[]) => void>();
const dismissCallbacks = new Map<number, () => void>();
let toasts: ToastRecord[] = [];

function emit() {
  for (const listener of listeners) {
    listener(toasts);
  }
}

function push(input: ToastInput): number {
  const variant = input.variant ?? "info";
  const hasActions = Boolean(input.actions?.length);
  const durationMs =
    input.durationMs ?? (hasActions ? 0 : defaultDurationByVariant[variant]);
  const record: ToastRecord = {
    id: nextId++,
    variant,
    message: input.message,
    title: input.title ?? titleByVariant[variant],
    durationMs,
    actions: input.actions,
    createdAt: Date.now()
  };
  if (input.onDismiss) {
    dismissCallbacks.set(record.id, input.onDismiss);
  }
  toasts = [...toasts, record];
  emit();
  if (record.durationMs > 0) {
    setTimeout(() => dismiss(record.id), record.durationMs);
  }
  return record.id;
}

export function dismiss(id: number, opts?: { silent?: boolean }) {
  if (!opts?.silent) {
    dismissCallbacks.get(id)?.();
  }
  dismissCallbacks.delete(id);
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

export function subscribeToToasts(listener: (toasts: ToastRecord[]) => void) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

function shorten(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  try {
    return String(value);
  } catch {
    return "Unexpected error";
  }
}

export const toast = {
  show(message: string, variant: ToastVariant = "info") {
    return push({ message, variant });
  },
  info(message: unknown, opts?: Omit<ToastInput, "message" | "variant">) {
    return push({ ...opts, message: shorten(message), variant: "info" });
  },
  success(message: unknown, opts?: Omit<ToastInput, "message" | "variant">) {
    return push({ ...opts, message: shorten(message), variant: "success" });
  },
  warning(message: unknown, opts?: Omit<ToastInput, "message" | "variant">) {
    return push({ ...opts, message: shorten(message), variant: "warning" });
  },
  error(message: unknown, opts?: Omit<ToastInput, "message" | "variant">) {
    return push({ ...opts, message: shorten(message), variant: "error" });
  }
};
