"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseApiErr } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import type {
  LaytimeBreakdown,
  LaytimeChronologyRow,
  MotherLaytimeDailyLedger,
  MotherLaytimeRecalculateResult,
  MotherLaytimeTimesheet
} from "@/lib/sof-api";

export type SofLaytimeRecalcState = {
  breakdown: LaytimeBreakdown;
  timesheet: MotherLaytimeTimesheet;
  dailyLedger: MotherLaytimeDailyLedger;
  chronology: LaytimeChronologyRow[];
};

type UseSofLaytimeRecalculateOptions = {
  sofId: string;
  eventsQueryKey: readonly unknown[];
  detailQueryKey: readonly unknown[];
  recalculate: () => Promise<MotherLaytimeRecalculateResult>;
  vesselCallId: string | undefined;
  sofStatus: string | undefined;
  eventRows: ReadonlyArray<{
    id: string;
    countsAsLaytime?: boolean | null;
    eventTime: string;
  }>;
  /** When false, auto-recalc on event changes is paused (e.g. user left Events/Laytime). */
  autoRecalcEnabled: boolean;
};

/**
 * Laytime preview + persist: refetch events, then POST recalculate (server reads DB).
 * Serializes overlapping runs and only auto-recalcs when the events laytime key changes.
 */
export function useSofLaytimeRecalculate({
  sofId,
  eventsQueryKey,
  detailQueryKey,
  recalculate,
  vesselCallId,
  sofStatus,
  eventRows,
  autoRecalcEnabled
}: UseSofLaytimeRecalculateOptions) {
  const qc = useQueryClient();
  const [layRecalc, setLayRecalc] = useState<SofLaytimeRecalcState | null>(null);

  const recalcChainRef = useRef(Promise.resolve<void>(undefined));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoKeyRef = useRef<string | null>(null);
  const [saveLaytimePending, setSaveLaytimePending] = useState(false);
  const recalculateFnRef = useRef(recalculate);
  recalculateFnRef.current = recalculate;

  const layRecalcMut = useMutation({
    mutationFn: () => recalculateFnRef.current(),
    onSuccess: (res) => {
      setLayRecalc({
        breakdown: res.breakdown,
        timesheet: res.timesheet,
        dailyLedger: res.dailyLedger,
        chronology: res.chronology ?? []
      });
      void qc.invalidateQueries({ queryKey: [...detailQueryKey] });
    },
    onError: (e) => toast.error(parseApiErr(e))
  });

  const mutateAsyncRef = useRef(layRecalcMut.mutateAsync);
  mutateAsyncRef.current = layRecalcMut.mutateAsync;

  const enqueueLaytimeRecalculate = useCallback(async () => {
      if (sofStatus === "CLOSED" || !vesselCallId) return;

      const run = async () => {
        await qc.refetchQueries({ queryKey: [...eventsQueryKey] });
        await mutateAsyncRef.current();
      };

      const chained = recalcChainRef.current.then(run, run);
      recalcChainRef.current = chained.then(
        () => undefined,
        () => undefined
      );
      return chained;
    },
    [eventsQueryKey, qc, sofStatus, vesselCallId]
  );

  const enqueueLaytimeRecalculateRef = useRef(enqueueLaytimeRecalculate);
  enqueueLaytimeRecalculateRef.current = enqueueLaytimeRecalculate;

  const scheduleLaytimeRecalculate = useCallback(
    (delayMs = 400) => {
      if (sofStatus === "CLOSED" || !vesselCallId) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void enqueueLaytimeRecalculateRef.current().catch((e) => toast.error(parseApiErr(e)));
      }, delayMs);
    },
    [sofStatus, vesselCallId]
  );

  const runLaytimeRecalculateNow = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    return enqueueLaytimeRecalculate();
  }, [enqueueLaytimeRecalculate]);

  const saveLaytimeToDatabase = useCallback(async () => {
    setSaveLaytimePending(true);
    try {
      await runLaytimeRecalculateNow();
      toast.success("Laytime calculation saved to database");
    } catch (e) {
      toast.error(parseApiErr(e));
    } finally {
      setSaveLaytimePending(false);
    }
  }, [runLaytimeRecalculateNow]);

  const eventsLaytimeKey = useMemo(
    () =>
      eventRows
        .map((e) => `${e.id}:${e.countsAsLaytime !== false}:${e.eventTime}`)
        .join("|"),
    [eventRows]
  );

  useEffect(() => {
    if (!autoRecalcEnabled || sofStatus === "CLOSED" || !vesselCallId || eventRows.length === 0) {
      return;
    }
    if (lastAutoKeyRef.current === eventsLaytimeKey) return;
    lastAutoKeyRef.current = eventsLaytimeKey;
    scheduleLaytimeRecalculate();
  }, [
    autoRecalcEnabled,
    eventsLaytimeKey,
    eventRows.length,
    scheduleLaytimeRecalculate,
    sofStatus,
    vesselCallId
  ]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  return {
    layRecalc,
    layRecalcMut,
    layRecalcPending: layRecalcMut.isPending,
    saveLaytimePending,
    runLaytimeRecalculate: runLaytimeRecalculateNow,
    scheduleLaytimeRecalculate,
    saveLaytimeToDatabase
  };
}
