"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { SofLocalDatetimeInputs } from "@/components/sof/sof-local-datetime-inputs";
import { cn } from "@/lib/utils";
import type { SofEventTypeOption } from "@/types/vms";

export type SofAddEventCurrentUser = { id: string; fullName: string; email: string | null };

export type SofAddEventFields = {
  evType: string;
  setEvType: (v: string) => void;
  /** Local `yyyy-mm-ddTHH:mm` (no zone suffix) for the event end — from paired date/time inputs. */
  evTime: string;
  setEvTime: (v: string) => void;
  /** Optional explicit start (`yyyy-mm-ddTHH:mm`). When blank, backend chains from previous row end. */
  evStartTime: string;
  setEvStartTime: (v: string) => void;
  evRemarks: string;
  setEvRemarks: (v: string) => void;
  evHoldReason: string;
  setEvHoldReason: (v: string) => void;
  evErr: string | null;
};

export function SofAddEventSheet({
  open,
  onOpenChange,
  description,
  fields,
  currentUser,
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
  currentUser: SofAddEventCurrentUser | null;
  eventTypes: SofEventTypeOption[];
  typesLoading?: boolean;
  typesError?: string | null;
  /** Optional link to Master files → SOF event types */
  manageHref?: string;
  onSave: () => void;
  isPending: boolean;
  saveDisabled?: boolean;
}) {
  const {
    evType,
    setEvType,
    evTime,
    setEvTime,
    evStartTime,
    setEvStartTime,
    evRemarks,
    setEvRemarks,
    evHoldReason,
    setEvHoldReason,
    evErr
  } = fields;

  const typesBusy = Boolean(typesLoading);
  const selectedType = eventTypes.find((t) => t.id === evType) ?? null;
  const selectedIsHold = selectedType?.category === "HOLD_DELAY";

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
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
                  {t.name}
                </option>
              ))}
            </select>
            {selectedType ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Category:</span>
                {selectedIsHold ? (
                  <Badge variant="warning">Hold</Badge>
                ) : (
                  <span className="font-medium text-foreground">Normal</span>
                )}
              </div>
            ) : null}
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
            <p className="text-xs text-muted-foreground">
              Pick the date, then type time as <span className="font-mono text-foreground">HH:mm</span>{" "}
              (24-hour only, e.g. 14:30 — no AM/PM).
            </p>
            <SofLocalDatetimeInputs
              className="min-h-10"
              dateInputClassName="h-10"
              timeInputClassName="h-10"
              value={evTime}
              onChange={setEvTime}
            />
          </div>
          <div className="space-y-2">
            <Label>Event starts at</Label>
            <SofLocalDatetimeInputs
              className="min-h-10"
              dateInputClassName="h-10"
              timeInputClassName="h-10"
              value={evStartTime}
              onChange={setEvStartTime}
            />
            <p className="text-xs text-muted-foreground">
              Defaults to the previous event’s end time so the timeline chains automatically.
              Adjust it to fill a gap or insert an event between existing rows. Clear the date field
              to chain implicitly on the server.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Created by</Label>
            <div className="flex h-10 min-h-10 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-foreground">
              {currentUser ? (
                <span className="truncate">
                  {currentUser.fullName}
                  {currentUser.email ? (
                    <span className="text-muted-foreground"> ({currentUser.email})</span>
                  ) : null}
                </span>
              ) : (
                <span className="text-muted-foreground">Not signed in</span>
              )}
            </div>
          </div>
          {selectedIsHold ? (
            <div className="space-y-2">
              <Label>Hold reason (optional)</Label>
              <Input
                value={evHoldReason}
                onChange={(e) => setEvHoldReason(e.target.value)}
                placeholder="e.g. weather, surveyor break, awaiting documents"
                className="h-10 min-h-10"
              />
            </div>
          ) : null}
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
