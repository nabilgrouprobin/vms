"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { ImportContractWeekWindowFields } from "@/components/sof/import-contract-laytime-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchImportContract } from "@/lib/import-contracts-api";
import {
  excludedDaysFromWorkSpan,
  humanizeLaytimeWeekday,
  laytimeWeekPatchFromDraft,
  parseLaytimeWeekMarker,
  stripLaytimeWeekFirstLine,
  workSpanFromExcludedDaysList,
  type LaytimeWeekday
} from "@/lib/laytime-week-marker";
import { parseApiErr } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export type LaytimeWeekPayloadGetter = () => {
  laytimeExcludedTimePeriod: string;
  laytimeExcludedDays: string[];
};

export type SofLaytimeWeekWindowInputProps = {
  laytimeExcludedTimePeriod: string | null | undefined;
  laytimeExcludedDays: string[] | null | undefined;
  /** Optional: pre-fill from contract when this SOF has no saved week yet */
  contractId?: string | null;
  readOnly: boolean;
  patchSof: (body: Record<string, unknown>) => Promise<unknown>;
  invalidateQueryKeys: unknown[][];
  /** After working week is saved (e.g. refresh laytime sheet). */
  onAfterSave?: () => void;
  /** Supplies current sidebar week for laytime recalculate POST body. */
  onRegisterWeekPayload?: (getter: LaytimeWeekPayloadGetter | null) => void;
};

export type SofLaytimeWeekWindowFormProps = SofLaytimeWeekWindowInputProps & {
  variant?: "sidebar" | "panel" | "embedded";
};

function hasSavedSofWeek(
  period: string | null | undefined,
  days: string[] | null | undefined
): boolean {
  return (period != null && period.trim() !== "") || (days?.length ?? 0) > 0;
}

function applyWeekToState(
  period: string | null | undefined,
  days: string[] | null | undefined,
  setters: {
    setWeekStartDay: (d: LaytimeWeekday) => void;
    setWeekStartTime: (t: string) => void;
    setWeekEndDay: (d: LaytimeWeekday) => void;
    setWeekEndTime: (t: string) => void;
    setCalendarNotes: (n: string) => void;
  }
) {
  const m = parseLaytimeWeekMarker(period);
  if (m) {
    setters.setWeekStartDay(m.startDay);
    setters.setWeekStartTime(m.startTime);
    setters.setWeekEndDay(m.endDay);
    setters.setWeekEndTime(m.endTime);
    setters.setCalendarNotes(m.notes);
    return;
  }
  const span = workSpanFromExcludedDaysList(days ?? []);
  setters.setWeekStartDay(span.start);
  setters.setWeekStartTime("08:00");
  setters.setWeekEndDay(span.end);
  setters.setWeekEndTime("17:00");
  setters.setCalendarNotes(stripLaytimeWeekFirstLine(period ?? ""));
}

export function SofLaytimeWeekWindowForm({
  laytimeExcludedTimePeriod,
  laytimeExcludedDays,
  contractId,
  readOnly,
  patchSof,
  invalidateQueryKeys,
  onAfterSave,
  onRegisterWeekPayload,
  variant = "sidebar"
}: SofLaytimeWeekWindowFormProps) {
  const qc = useQueryClient();
  const isPanel = variant === "panel";
  const isEmbedded = variant === "embedded";

  const [weekStartDay, setWeekStartDay] = useState<LaytimeWeekday>("SUNDAY");
  const [weekStartTime, setWeekStartTime] = useState("08:00");
  const [weekEndDay, setWeekEndDay] = useState<LaytimeWeekday>("THURSDAY");
  const [weekEndTime, setWeekEndTime] = useState("17:00");
  const [calendarNotes, setCalendarNotes] = useState("");

  const sofHasWeek = hasSavedSofWeek(laytimeExcludedTimePeriod, laytimeExcludedDays);

  const contractQ = useQuery({
    queryKey: ["import-contract", contractId, "laytime-week-seed"],
    queryFn: () => fetchImportContract(contractId!),
    enabled: !!contractId && !sofHasWeek
  });

  useEffect(() => {
    if (sofHasWeek) {
      applyWeekToState(laytimeExcludedTimePeriod, laytimeExcludedDays, {
        setWeekStartDay,
        setWeekStartTime,
        setWeekEndDay,
        setWeekEndTime,
        setCalendarNotes
      });
      return;
    }
    const c = contractQ.data;
    if (!c) return;
    applyWeekToState(c.excludedTimePeriod, c.excludedDays, {
      setWeekStartDay,
      setWeekStartTime,
      setWeekEndDay,
      setWeekEndTime,
      setCalendarNotes
    });
  }, [
    sofHasWeek,
    laytimeExcludedTimePeriod,
    laytimeExcludedDays,
    contractQ.data
  ]);

  const excludedPreview = useMemo(
    () =>
      excludedDaysFromWorkSpan(weekStartDay, weekEndDay)
        .map(humanizeLaytimeWeekday)
        .join(", "),
    [weekStartDay, weekEndDay]
  );

  useEffect(() => {
    if (!onRegisterWeekPayload || readOnly) {
      onRegisterWeekPayload?.(null);
      return;
    }
    const getter: LaytimeWeekPayloadGetter = () =>
      laytimeWeekPatchFromDraft({
        weekStartDay,
        weekStartTime,
        weekEndDay,
        weekEndTime,
        calendarNotes
      });
    onRegisterWeekPayload(getter);
    return () => onRegisterWeekPayload(null);
  }, [
    onRegisterWeekPayload,
    readOnly,
    weekStartDay,
    weekStartTime,
    weekEndDay,
    weekEndTime,
    calendarNotes
  ]);

  const saveMut = useMutation({
    mutationFn: async () => {
      await patchSof(
        laytimeWeekPatchFromDraft({
          weekStartDay,
          weekStartTime,
          weekEndDay,
          weekEndTime,
          calendarNotes
        })
      );
    },
    onSuccess: () => {
      toast.success("Working week saved on this statement.");
      for (const key of invalidateQueryKeys) {
        void qc.invalidateQueries({ queryKey: key as string[] });
      }
      onAfterSave?.();
    },
    onError: (e) => toast.error(parseApiErr(e))
  });

  const fields = (
    <>
      <ImportContractWeekWindowFields
        readOnly={readOnly}
        compact={!isPanel}
        weekStartDay={weekStartDay}
        setWeekStartDay={setWeekStartDay}
        weekStartTime={weekStartTime}
        setWeekStartTime={setWeekStartTime}
        weekEndDay={weekEndDay}
        setWeekEndDay={setWeekEndDay}
        weekEndTime={weekEndTime}
        setWeekEndTime={setWeekEndTime}
      />
      <div className="space-y-1">
        <Label className={isPanel ? "text-xs font-medium" : "text-xs"}>
          Calendar notes (optional)
        </Label>
        <Input
          className={cn(isPanel ? "h-9 text-sm" : "h-8 text-xs")}
          value={calendarNotes}
          onChange={(e) => setCalendarNotes(e.target.value)}
          disabled={readOnly}
          placeholder="Notes after the week line"
        />
      </div>
      <p className={cn("text-muted-foreground", isPanel ? "text-[11px]" : "text-[10px]")}>
        <span className="font-medium text-foreground">Excluded weekdays (engine):</span>{" "}
        {excludedPreview || "—"}
      </p>
      {!sofHasWeek && !readOnly ? (
        <p className={cn("text-amber-800 dark:text-amber-200", isPanel ? "text-[11px]" : "text-[10px]")}>
          Week not saved on this statement yet — use Save working week, or Recalculate laytime
          (sends these settings with the calculation).
        </p>
      ) : null}
      <Button
        type="button"
        size="sm"
        className={cn(isPanel ? "w-fit" : "h-8 w-full")}
        disabled={readOnly || saveMut.isPending}
        onClick={() => saveMut.mutate()}
      >
        {saveMut.isPending ? "Saving…" : "Save working week"}
      </Button>
    </>
  );

  if (isEmbedded) {
    return <div className="space-y-3">{fields}</div>;
  }

  if (isPanel) {
    return (
      <section
        className="laytime-print-suppress space-y-3 rounded-lg border border-border bg-muted/15 p-4"
        aria-labelledby="laytime-week-inputs"
      >
        <div id="laytime-week-inputs" className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Working week
          </h3>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Week starts on / week ends on (day + time) define when contact hours count on the daily
            sheet. Saved on this statement — not the import contract.
          </p>
        </div>
        {fields}
      </section>
    );
  }

  return (
    <Card className="shadow-sm xl:shadow-none">
      <CardHeader className="space-y-1 px-3 py-2 pb-0">
        <CardTitle className="text-sm font-semibold">Working week</CardTitle>
        <CardDescription className="text-[10px] leading-snug">
          Week starts on / week ends on — manual input for this statement (day + time).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3 pt-2">{fields}</CardContent>
    </Card>
  );
}
