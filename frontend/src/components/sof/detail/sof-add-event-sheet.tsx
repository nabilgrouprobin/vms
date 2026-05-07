"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { SofEventTypeOption } from "@/types/vms";

export type SofAddEventUserOption = { id: string; fullName: string; email: string };

export type SofAddEventFields = {
  evType: string;
  setEvType: (v: string) => void;
  evTime: string;
  setEvTime: (v: string) => void;
  evDurationMinutes: string;
  setEvDurationMinutes: (v: string) => void;
  evRemarks: string;
  setEvRemarks: (v: string) => void;
  evHold: boolean;
  setEvHold: (v: boolean) => void;
  evUser: string;
  setEvUser: (v: string) => void;
  evErr: string | null;
};

export function SofAddEventSheet({
  open,
  onOpenChange,
  description,
  fields,
  users,
  eventTypes,
  typesLoading,
  typesError,
  manageHref,
  onSave,
  isPending,
  saveDisabled
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  fields: SofAddEventFields;
  users: SofAddEventUserOption[];
  eventTypes: SofEventTypeOption[];
  typesLoading?: boolean;
  typesError?: string | null;
  /** Optional link to Master files → SOF event types */
  manageHref?: string;
  onSave: () => void;
  isPending: boolean;
  saveDisabled?: boolean;
}) {
  const holdId = useId();
  const {
    evType,
    setEvType,
    evTime,
    setEvTime,
    evDurationMinutes,
    setEvDurationMinutes,
    evRemarks,
    setEvRemarks,
    evHold,
    setEvHold,
    evUser,
    setEvUser,
    evErr
  } = fields;

  const typesBusy = Boolean(typesLoading);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-md">
        <div className="space-y-1.5 pr-8">
          <SheetTitle>Add event</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <Label>Type</Label>
            <select
              className="flex h-10 min-h-10 w-full rounded-md border border-input bg-card px-3 text-sm touch-manipulation disabled:opacity-60"
              value={evType}
              disabled={typesBusy || eventTypes.length === 0}
              onChange={(e) => setEvType(e.target.value)}
            >
              {eventTypes.length === 0 && !typesBusy ? (
                <option value="">No types — add them in Master files</option>
              ) : null}
              {eventTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
            {typesError ? <p className="text-xs text-destructive">{typesError}</p> : null}
            {manageHref ? (
              <p className="text-xs text-muted-foreground">
                Missing a label?{" "}
                <Link href={manageHref} className="font-medium text-foreground underline underline-offset-2">
                  Manage SOF event types
                </Link>
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Event ends at</Label>
            <Input
              type="datetime-local"
              className="h-10 min-h-10"
              value={evTime}
              onChange={(e) => setEvTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Length (minutes)</Label>
            <Input
              inputMode="numeric"
              clearPlaceholderOnFocus
              placeholder="Optional — e.g. 13 for thirteen minutes"
              className="h-10 min-h-10"
              value={evDurationMinutes}
              onChange={(e) => setEvDurationMinutes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Created by</Label>
            <select
              className="flex h-10 min-h-10 w-full rounded-md border border-input bg-card px-3 text-sm touch-manipulation"
              value={evUser}
              onChange={(e) => setEvUser(e.target.value)}
            >
              <option value="">Select user…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 py-1">
            <input
              id={holdId}
              type="checkbox"
              className="size-4 touch-manipulation"
              checked={evHold}
              onChange={(e) => setEvHold(e.target.checked)}
            />
            <Label htmlFor={holdId}>Hold / delay</Label>
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <textarea
              rows={4}
              value={evRemarks}
              onChange={(e) => setEvRemarks(e.target.value)}
              className={cn(
                "flex min-h-[88px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm transition-colors",
                "placeholder:text-muted-foreground focus:placeholder:text-transparent focus:placeholder:opacity-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />
          </div>
          {evErr ? <p className="text-sm text-destructive">{evErr}</p> : null}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              className="w-full gap-2 sm:flex-1"
              disabled={isPending || saveDisabled}
              onClick={onSave}
            >
              <Plus className="size-4" />
              Save event
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
