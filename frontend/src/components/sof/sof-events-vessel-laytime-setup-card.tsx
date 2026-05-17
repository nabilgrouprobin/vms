"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

import { ImportContractWeekWindowFields } from "@/components/sof/import-contract-laytime-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SofLocalDatetimeInputs } from "@/components/sof/sof-local-datetime-inputs";
import type { MotherVesselCallDetail } from "@/components/sof/mother-vessel-panels";
import { fetchImportContract, patchImportContract } from "@/lib/import-contracts-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import { toDatetimeLocalValue } from "@/lib/sof-event-display";
import {
  buildLaytimeExcludedTimePeriod,
  excludedDaysFromWorkSpan,
  parseLaytimeWeekMarker,
  stripLaytimeWeekFirstLine,
  workSpanFromExcludedDaysList,
  type LaytimeWeekday
} from "@/lib/laytime-week-marker";
import { patchVesselCall } from "@/lib/vessel-calls-api";

type Props = {
  vesselCall: MotherVesselCallDetail | null | undefined;
  readOnly: boolean;
  /** e.g. ["mother-sof", id] */
  invalidateQueryKeys: unknown[][];
  /** Laytime tab already has contract link + week via ImportContractLaytimeForm — pass false to avoid duplicate UI. */
  showContractLink?: boolean;
  showNor?: boolean;
  showWeek?: boolean;
  /** After NOR is saved — e.g. recalculate laytime so contact/NOR rules apply immediately. */
  onNorSaved?: () => void;
};

export function SofEventsVesselLaytimeSetupCard({
  vesselCall,
  readOnly,
  invalidateQueryKeys,
  showContractLink = true,
  showNor = true,
  showWeek = true,
  onNorSaved
}: Props) {
  const qc = useQueryClient();
  const formId = useId();
  const vcId = vesselCall?.id;
  const icId = vesselCall?.importContract?.id ?? null;

  const [contractIdInput, setContractIdInput] = useState("");
  const [norDateTime, setNorDateTime] = useState("");
  const [norAcceptedSeparate, setNorAcceptedSeparate] = useState("");
  const [acceptedDiffersFromTendered, setAcceptedDiffersFromTendered] = useState(false);

  const [weekStartDay, setWeekStartDay] = useState<LaytimeWeekday>("MONDAY");
  const [weekStartTime, setWeekStartTime] = useState("08:00");
  const [weekEndDay, setWeekEndDay] = useState<LaytimeWeekday>("FRIDAY");
  const [weekEndTime, setWeekEndTime] = useState("17:00");
  const [calendarNotes, setCalendarNotes] = useState("");

  useEffect(() => {
    if (!vesselCall) return;
    const tendered = vesselCall.norTenderedAt
      ? toDatetimeLocalValue(vesselCall.norTenderedAt)
      : "";
    const accepted = vesselCall.norAcceptedAt
      ? toDatetimeLocalValue(vesselCall.norAcceptedAt)
      : "";
    setNorDateTime(tendered);
    setNorAcceptedSeparate(accepted);
    const differs =
      !!tendered &&
      !!accepted &&
      tendered !== accepted;
    setAcceptedDiffersFromTendered(differs);
    setContractIdInput("");
  }, [vesselCall?.id, vesselCall?.updatedAt, vesselCall?.norTenderedAt, vesselCall?.norAcceptedAt]);

  const norPreview = useMemo(() => {
    const raw = norDateTime.trim();
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    const h = d.getHours();
    if (h < 12) {
      return "NOR before 12:00 → contact 13:00 to end of that day; laytime starts 13:00 same day.";
    }
    return "NOR at/after 12:00 → no contact that day; laytime and contact from next day 08:00 to end of day.";
  }, [norDateTime]);

  const contractQ = useQuery({
    queryKey: ["import-contract", icId, "laytime-week"],
    queryFn: () => fetchImportContract(icId!),
    enabled: !!icId && showWeek
  });

  useEffect(() => {
    const c = contractQ.data;
    if (!c) return;
    const m = parseLaytimeWeekMarker(c.excludedTimePeriod);
    if (m) {
      setWeekStartDay(m.startDay);
      setWeekStartTime(m.startTime);
      setWeekEndDay(m.endDay);
      setWeekEndTime(m.endTime);
      setCalendarNotes(stripLaytimeWeekFirstLine(c.excludedTimePeriod ?? ""));
    } else {
      const span = workSpanFromExcludedDaysList(c.excludedDays ?? []);
      setWeekStartDay(span.start);
      setWeekStartTime("08:00");
      setWeekEndDay(span.end);
      setWeekEndTime("17:00");
      setCalendarNotes((c.excludedTimePeriod ?? "").trim());
    }
  }, [contractQ.data]);

  const invalidateAll = () => {
    for (const key of invalidateQueryKeys) {
      void qc.invalidateQueries({ queryKey: key as string[] });
    }
  };

  const linkContractMut = useMutation({
    mutationFn: async () => {
      if (!vcId) throw new Error("No vessel call.");
      const id = contractIdInput.trim();
      if (!id) throw new Error("Enter an import contract id.");
      await patchVesselCall(vcId, { importContractId: id });
    },
    onSuccess: () => {
      toast.success("Import contract linked to this call.");
      invalidateAll();
    },
    onError: (e) => toast.error(parseApiErr(e))
  });

  const unlinkContractMut = useMutation({
    mutationFn: async () => {
      if (!vcId) throw new Error("No vessel call.");
      await patchVesselCall(vcId, { importContractId: null });
    },
    onSuccess: () => {
      toast.success("Import contract unlinked.");
      invalidateAll();
    },
    onError: (e) => toast.error(parseApiErr(e))
  });

  const saveNorMut = useMutation({
    mutationFn: async () => {
      if (!vcId) throw new Error("No vessel call.");
      const nt = norDateTime.trim();
      if (!nt) {
        await patchVesselCall(vcId, {
          norTenderedAt: null,
          norAcceptedAt: null
        });
        return;
      }
      const tenderedIso = new Date(nt).toISOString();
      if (Number.isNaN(new Date(nt).getTime())) {
        throw new Error("Enter a valid NOR date and time.");
      }
      let acceptedIso = tenderedIso;
      if (acceptedDiffersFromTendered) {
        const na = norAcceptedSeparate.trim();
        if (!na) throw new Error("Enter NOR accepted date and time, or uncheck “different from tendered”.");
        const ad = new Date(na);
        if (Number.isNaN(ad.getTime())) throw new Error("Enter a valid NOR accepted date and time.");
        acceptedIso = ad.toISOString();
      }
      await patchVesselCall(vcId, {
        norTenderedAt: tenderedIso,
        norAcceptedAt: acceptedIso
      });
    },
    onSuccess: () => {
      toast.success("NOR saved — laytime will use NOR contact rules.");
      invalidateAll();
      onNorSaved?.();
    },
    onError: (e) => toast.error(parseApiErr(e))
  });

  const saveWeekMut = useMutation({
    mutationFn: async () => {
      if (!icId) throw new Error("No import contract on this call.");
      const c = contractQ.data;
      if (!c) throw new Error("Contract not loaded yet.");
      const excludedTimePeriod = buildLaytimeExcludedTimePeriod(
        weekStartDay,
        weekStartTime,
        weekEndDay,
        weekEndTime,
        calendarNotes
      );
      const excludedDays = excludedDaysFromWorkSpan(weekStartDay, weekEndDay).map((d) => d);
      await patchImportContract(icId, {
        excludedTimePeriod,
        excludedDays
      });
    },
    onSuccess: () => {
      toast.success("Contract working week saved.");
      void qc.invalidateQueries({ queryKey: ["import-contract", icId, "laytime-week"] });
      invalidateAll();
    },
    onError: (e) => toast.error(parseApiErr(e))
  });

  const showAny = showContractLink || showNor || showWeek;
  if (!showAny) return null;

  if (!vesselCall || !vcId) {
    if (!showNor) return null;
    return (
      <Card className="shadow-sm xl:shadow-none">
        <CardHeader className="px-3 py-2 pb-0">
          <CardTitle className="text-sm font-semibold">NOR</CardTitle>
          <CardDescription className="text-[10px]">
            Link this SOF to a vessel call to edit NOR on the laytime sheet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const linked = vesselCall.importContract;

  const norFields = (
    <>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor={`${formId}-nor-dt`} className="text-xs">
            NOR date &amp; time (local, 24-hour)
          </Label>
          <SofLocalDatetimeInputs
            value={norDateTime}
            onChange={setNorDateTime}
            disabled={readOnly}
            dateInputClassName="h-8 text-[11px]"
            timeInputClassName="h-8 text-[11px]"
          />
          <p className="text-[10px] text-muted-foreground">
            Enter date and time as HH:mm (e.g. 13:30, no AM/PM). Accepted matches tendered unless you
            tick the box below.
          </p>
        </div>
      {norPreview ? (
        <p className="rounded-md border border-border/80 bg-muted/20 px-2 py-1.5 text-[10px] leading-snug text-foreground">
          {norPreview}
        </p>
      ) : null}
      <label className="flex cursor-pointer items-center gap-2 text-[11px] text-muted-foreground">
        <input
          type="checkbox"
          className="size-3.5 rounded border-border"
          checked={acceptedDiffersFromTendered}
          onChange={(e) => setAcceptedDiffersFromTendered(e.target.checked)}
          disabled={readOnly || !norDateTime.trim()}
        />
        NOR accepted is different from tendered
      </label>
      {acceptedDiffersFromTendered ? (
        <div className="space-y-1">
          <Label htmlFor={`${formId}-nor-a`} className="text-xs">
            NOR accepted date &amp; time (local, 24-hour)
          </Label>
          <SofLocalDatetimeInputs
            value={norAcceptedSeparate}
            onChange={setNorAcceptedSeparate}
            disabled={readOnly}
            dateInputClassName="h-8 text-[11px]"
            timeInputClassName="h-8 text-[11px]"
          />
        </div>
      ) : null}
      </div>
      <Button
        type="button"
        size="sm"
        className="h-8 w-full"
        disabled={readOnly || saveNorMut.isPending}
        onClick={() => saveNorMut.mutate()}
      >
        {saveNorMut.isPending ? "Saving…" : "Save NOR & apply laytime rules"}
      </Button>
    </>
  );

  return (
    <div className="space-y-2">
      {showContractLink ? (
        <Card className="shadow-sm xl:shadow-none">
          <CardHeader className="space-y-1 px-3 py-2 pb-0">
            <CardTitle className="text-sm font-semibold">
              Import contract{showNor ? " & NOR" : ""}
            </CardTitle>
            <CardDescription className="text-[10px] leading-snug">
              Link the vessel call to an import contract by id (CP terms)
              {showNor
                ? ", or leave unlinked and set NOR manually. Laytime commence uses NOR tendered when commence is not set elsewhere."
                : "."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-3 pb-3 pt-2">
            {linked ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 bg-muted/20 px-2 py-1.5 text-xs">
                <span className="min-w-0 truncate">
                  Linked:{" "}
                  <span className="font-mono font-medium">{linked.contractNo}</span>{" "}
                  <span className="text-muted-foreground">({linked.id})</span>
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button variant="link" size="sm" className="h-7 px-1 text-xs" asChild>
                    <Link href={`/import-contracts/${linked.id}`}>Open contract</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={readOnly || unlinkContractMut.isPending}
                    onClick={() => unlinkContractMut.mutate()}
                  >
                    Unlink
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={`${formId}-icid`} className="text-xs">
                  Import contract id
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Input
                    id={`${formId}-icid`}
                    className="h-8 font-mono text-xs"
                    placeholder="Paste contract id (cuid)"
                    value={contractIdInput}
                    onChange={(e) => setContractIdInput(e.target.value)}
                    disabled={readOnly}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 shrink-0"
                    disabled={readOnly || linkContractMut.isPending}
                    onClick={() => linkContractMut.mutate()}
                  >
                    Link contract
                  </Button>
                </div>
              </div>
            )}
            {showNor ? norFields : null}
          </CardContent>
        </Card>
      ) : null}

      {!showContractLink && showNor ? (
        <Card className="shadow-sm xl:shadow-none">
          <CardHeader className="space-y-1 px-3 py-2 pb-0">
            <CardTitle className="text-sm font-semibold">NOR</CardTitle>
            <CardDescription className="text-[10px] leading-snug">
              Tendered and accepted times on the vessel call. Laytime commence uses NOR tendered when
              commence is not set elsewhere.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-3 pb-3 pt-2">{norFields}</CardContent>
        </Card>
      ) : null}

      {showWeek ? (
        <Card className="shadow-sm xl:shadow-none">
          <CardHeader className="space-y-1 px-3 py-2 pb-0">
            <CardTitle className="text-sm font-semibold">Contract working week</CardTitle>
            <CardDescription className="text-[10px] leading-snug">
              Start/end weekday and clock define the contact window on the laytime daily sheet. Stored on
              the linked import contract.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-3 pb-3 pt-2">
            {!icId ? (
              <p className="text-[11px] text-muted-foreground">
                Link an import contract to edit the working week.
              </p>
            ) : contractQ.isLoading ? (
              <p className="text-[11px] text-muted-foreground">Loading contract…</p>
            ) : contractQ.isError ? (
              <p className="text-[11px] text-destructive">{parseApiErr(contractQ.error)}</p>
            ) : (
              <>
                <ImportContractWeekWindowFields
                  readOnly={readOnly}
                  compact
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
                  <Label className="text-xs">Calendar notes (optional)</Label>
                  <Input
                    className="h-8 text-xs"
                    value={calendarNotes}
                    onChange={(e) => setCalendarNotes(e.target.value)}
                    disabled={readOnly}
                    placeholder="Notes after the week line"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 w-full"
                  disabled={readOnly || saveWeekMut.isPending}
                  onClick={() => saveWeekMut.mutate()}
                >
                  Save working week on contract
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
