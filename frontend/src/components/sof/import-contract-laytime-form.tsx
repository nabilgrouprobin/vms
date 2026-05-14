"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDt } from "@/lib/format";
import { formatDecimalHoursToDaysHMin, formatDecimalHoursToTotalHoursMin } from "@/lib/laytime-hours-format";
import { fetchImportContract, patchImportContract } from "@/lib/import-contracts-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import { patchVesselCall } from "@/lib/vessel-calls-api";
import { vesselSofWorkspacePath } from "@/lib/workspace-paths";
import { cn } from "@/lib/utils";

const WEEKDAYS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
] as const;

type Weekday = (typeof WEEKDAYS)[number];

const LAYTIME_WEEK_MARKER =
  /^__LAYTIME_WEEK__\s+(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\s+(\d{2}:\d{2})\s+(SUNDAY|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY)\s+(\d{2}:\d{2})$/i;

function parseLaytimeWeekMarker(raw: string | null | undefined): {
  startDay: Weekday;
  startTime: string;
  endDay: Weekday;
  endTime: string;
  notes: string;
} | null {
  if (!raw?.trim()) return null;
  const first = raw.split("\n")[0]?.trim() ?? "";
  const m = first.match(LAYTIME_WEEK_MARKER);
  if (!m) return null;
  return {
    startDay: m[1].toUpperCase() as Weekday,
    startTime: m[2],
    endDay: m[3].toUpperCase() as Weekday,
    endTime: m[4],
    notes: raw.split("\n").slice(1).join("\n").trim()
  };
}

function stripLaytimeWeekFirstLine(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const first = raw.split("\n")[0]?.trim() ?? "";
  if (LAYTIME_WEEK_MARKER.test(first)) {
    return raw.split("\n").slice(1).join("\n").trim();
  }
  return raw.trim();
}

function buildLaytimeExcludedTimePeriod(
  startDay: Weekday,
  startTime: string,
  endDay: Weekday,
  endTime: string,
  notes: string
): string | null {
  const line = `__LAYTIME_WEEK__ ${startDay} ${startTime} ${endDay} ${endTime}`;
  const n = notes.trim();
  if (!n) return line;
  return `${line}\n${n}`;
}

function dayIndex(d: Weekday): number {
  return WEEKDAYS.indexOf(d);
}

/** Workdays from start through end inclusive (forward on the week circle). */
function excludedDaysFromWorkSpan(startDay: Weekday, endDay: Weekday): Weekday[] {
  const si = dayIndex(startDay);
  const ei = dayIndex(endDay);
  if (si < 0 || ei < 0) return [...WEEKDAYS];
  const work = new Set<number>();
  let d = si;
  work.add(d);
  let guard = 0;
  while (d !== ei && guard < 8) {
    d = (d + 1) % 7;
    work.add(d);
    guard++;
  }
  return WEEKDAYS.filter((_, i) => !work.has(i)) as Weekday[];
}

function workSpanFromExcludedDaysList(days: string[]): { start: Weekday; end: Weekday } {
  const ex = new Set(days.map((x) => x.trim().toUpperCase()));
  const work = WEEKDAYS.filter((d) => !ex.has(d));
  if (work.length === 0) return { start: "MONDAY", end: "FRIDAY" };
  return { start: work[0], end: work[work.length - 1] };
}

function humanizeWeekday(d: Weekday): string {
  return d.charAt(0) + d.slice(1).toLowerCase();
}

function LaytimeCountingFractionFields({
  readOnly,
  compact,
  layFrac,
  setLayFrac,
  workableH,
  setWorkableH,
  totalH,
  setTotalH,
  preview
}: {
  readOnly: boolean;
  compact: boolean;
  layFrac: string;
  setLayFrac: Dispatch<SetStateAction<string>>;
  workableH: string;
  setWorkableH: Dispatch<SetStateAction<string>>;
  totalH: string;
  setTotalH: Dispatch<SetStateAction<string>>;
  preview: number | null;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border/80 bg-muted/10",
        compact ? "space-y-2 p-2" : "space-y-3 p-3"
      )}
    >
      <p className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>
        Time counting fraction (Laytime2000)
      </p>
      <p className={cn("text-muted-foreground", compact ? "text-[10px] leading-snug" : "text-xs")}>
        Optional multiplier on calendar-adjusted laytime hours. Explicit fraction overrides
        workable ÷ total hatches. Per-event <span className="font-mono">laytimeImpactHours</span>{" "}
        still skips this.
      </p>
      <div className={cn("grid sm:grid-cols-3", compact ? "gap-2" : "gap-3")}>
        <div className={cn("space-y-1", compact && "space-y-0.5")}>
          <Label className={compact ? "text-xs" : undefined}>Fraction (0–1)</Label>
          <Input
            className={compact ? "h-8 text-sm" : undefined}
            disabled={readOnly}
            value={layFrac}
            onChange={(e) => setLayFrac(e.target.value)}
            inputMode="decimal"
            placeholder="e.g. 0.6"
          />
        </div>
        <div className={cn("space-y-1", compact && "space-y-0.5")}>
          <Label className={compact ? "text-xs" : undefined}>Workable hatches</Label>
          <Input
            className={compact ? "h-8 text-sm" : undefined}
            disabled={readOnly}
            value={workableH}
            onChange={(e) => setWorkableH(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 5"
          />
        </div>
        <div className={cn("space-y-1", compact && "space-y-0.5")}>
          <Label className={compact ? "text-xs" : undefined}>Total hatches</Label>
          <Input
            className={compact ? "h-8 text-sm" : undefined}
            disabled={readOnly}
            value={totalH}
            onChange={(e) => setTotalH(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 6"
          />
        </div>
      </div>
      {preview !== null ? (
        <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          <span className="font-medium text-foreground">Preview applied multiplier:</span>{" "}
          {preview.toFixed(4).replace(/\.?0+$/, "")}
        </p>
      ) : (
        <p className={cn("text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>
          Leave all empty for full 1.0 counting (no CP fraction).
        </p>
      )}
    </div>
  );
}

function ImportContractWeekWindowFields({
  readOnly,
  compact,
  weekStartDay,
  setWeekStartDay,
  weekStartTime,
  setWeekStartTime,
  weekEndDay,
  setWeekEndDay,
  weekEndTime,
  setWeekEndTime
}: {
  readOnly: boolean;
  compact: boolean;
  weekStartDay: Weekday;
  setWeekStartDay: Dispatch<SetStateAction<Weekday>>;
  weekStartTime: string;
  setWeekStartTime: Dispatch<SetStateAction<string>>;
  weekEndDay: Weekday;
  setWeekEndDay: Dispatch<SetStateAction<Weekday>>;
  weekEndTime: string;
  setWeekEndTime: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div className={cn("grid sm:grid-cols-2", compact ? "gap-2" : "gap-4")}>
      <div className={cn("space-y-2 sm:col-span-2", compact && "space-y-1")}>
        <Label className={compact ? "text-xs" : undefined}>Week starts on</Label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={cn(
              "flex rounded-md border border-input bg-card px-2 text-sm",
              compact ? "h-8" : "h-9"
            )}
            disabled={readOnly}
            value={weekStartDay}
            onChange={(e) => setWeekStartDay(e.target.value as Weekday)}
          >
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {humanizeWeekday(d)}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground">—</span>
          <Input
            type="time"
            className="w-[7.5rem]"
            disabled={readOnly}
            value={weekStartTime}
            onChange={(e) => setWeekStartTime(e.target.value)}
          />
        </div>
      </div>
      <div className={cn("space-y-2 sm:col-span-2", compact && "space-y-1")}>
        <Label className={compact ? "text-xs" : undefined}>Week ends on</Label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className={cn(
              "flex rounded-md border border-input bg-card px-2 text-sm",
              compact ? "h-8" : "h-9"
            )}
            disabled={readOnly}
            value={weekEndDay}
            onChange={(e) => setWeekEndDay(e.target.value as Weekday)}
          >
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {humanizeWeekday(d)}
              </option>
            ))}
          </select>
          <span className="text-muted-foreground">—</span>
          <Input
            type="time"
            className="w-[7.5rem]"
            disabled={readOnly}
            value={weekEndTime}
            onChange={(e) => setWeekEndTime(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export type ImportContractLaytimeFormProps = {
  contractId: string;
  readOnly?: boolean;
  /** When set, shows unlink from this mother vessel call (does not delete the contract). */
  vesselCallId?: string | null;
  /** Mother vessel call cargo (MT); editable in embedded laytime tab. */
  vesselCallApproxTotalWeightTon?: string | null;
  /** Compact layout for embedding on SOF overview. */
  embedded?: boolean;
  /** Tighter spacing on laytime tab (narrow sidebar). */
  embeddedCompact?: boolean;
  onSaved?: () => void;
  onUnlinked?: () => void;
};

export function ImportContractLaytimeForm({
  contractId,
  readOnly = false,
  vesselCallId,
  vesselCallApproxTotalWeightTon,
  embedded = false,
  embeddedCompact = false,
  onSaved,
  onUnlinked
}: ImportContractLaytimeFormProps) {
  const formId = useId();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["import-contract", contractId],
    queryFn: () => fetchImportContract(contractId),
    enabled: !!contractId
  });

  const [holidaysExcluded, setHolidaysExcluded] = useState(true);
  const [excludedTimePeriod, setExcludedTimePeriod] = useState("");
  const [dischargePort, setDischargePort] = useState("");
  const [dischargeRate, setDischargeRate] = useState("");
  const [rateUnit, setRateUnit] = useState("");
  const [demRate, setDemRate] = useState("");
  const [disRate, setDisRate] = useState("");
  const [currency, setCurrency] = useState("");
  const [layFrac, setLayFrac] = useState("");
  const [workableH, setWorkableH] = useState("");
  const [totalH, setTotalH] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const [weekStartDay, setWeekStartDay] = useState<Weekday>("SUNDAY");
  const [weekStartTime, setWeekStartTime] = useState("08:00");
  const [weekEndDay, setWeekEndDay] = useState<Weekday>("THURSDAY");
  const [weekEndTime, setWeekEndTime] = useState("17:00");
  const [cargoMt, setCargoMt] = useState("");

  const c = q.data;

  useEffect(() => {
    if (vesselCallApproxTotalWeightTon !== undefined && vesselCallApproxTotalWeightTon !== null) {
      setCargoMt(vesselCallApproxTotalWeightTon);
    }
  }, [vesselCallApproxTotalWeightTon]);

  useEffect(() => {
    if (!c) return;
    setHolidaysExcluded(c.holidaysExcluded ?? true);
    setDischargePort(c.dischargePort ?? "");
    setDischargeRate(c.dischargeRateMtPerDay ?? "");
    setRateUnit(c.dischargeRateUnit ?? "");
    setDemRate(c.laytimeDemurrageRatePerDay ?? "");
    setDisRate(c.laytimeDispatchRatePerDay ?? "");
    setCurrency(c.currency ?? "");
    setLayFrac(c.laytimeCountingFraction ?? "");
    setWorkableH(c.workableHatches != null ? String(c.workableHatches) : "");
    setTotalH(c.totalHatches != null ? String(c.totalHatches) : "");
    const m = parseLaytimeWeekMarker(c.excludedTimePeriod);
    if (m) {
      setWeekStartDay(m.startDay);
      setWeekStartTime(m.startTime);
      setWeekEndDay(m.endDay);
      setWeekEndTime(m.endTime);
      setExcludedTimePeriod(m.notes);
    } else {
      const span = workSpanFromExcludedDaysList(c.excludedDays ?? []);
      setWeekStartDay(span.start);
      setWeekEndDay(span.end);
      setWeekStartTime("08:00");
      setWeekEndTime("17:00");
      setExcludedTimePeriod(stripLaytimeWeekFirstLine(c.excludedTimePeriod ?? ""));
    }
  }, [c]);

  const computedAllowedHours = useMemo(() => {
    const qty = cargoMt.trim() === "" ? NaN : parseFloat(cargoMt.replace(",", "."));
    const rate = dischargeRate.trim() === "" ? NaN : parseFloat(dischargeRate.replace(",", "."));
    if (!Number.isFinite(qty) || !Number.isFinite(rate) || qty <= 0 || rate <= 0) return null;
    return (qty / rate) * 24;
  }, [cargoMt, dischargeRate]);

  const excludedDaysPreview = useMemo(
    () => excludedDaysFromWorkSpan(weekStartDay, weekEndDay).map(humanizeWeekday).join(", "),
    [weekStartDay, weekEndDay]
  );

  const countingFracPreview = useMemo(() => {
    const lf = layFrac.trim();
    if (lf !== "") {
      const n = parseFloat(lf.replace(",", "."));
      if (Number.isFinite(n) && n > 0 && n <= 1) return n;
      return null;
    }
    const wh = parseInt(workableH.trim(), 10);
    const th = parseInt(totalH.trim(), 10);
    if (!Number.isFinite(wh) || !Number.isFinite(th) || th <= 0 || wh < 0) return null;
    return Math.min(1, wh / th);
  }, [layFrac, workableH, totalH]);

  const mut = useMutation({
    mutationFn: async () => {
      const lf = layFrac.trim();
      let laytimeCountingFraction: number | null = null;
      if (lf !== "") {
        const n = parseFloat(lf.replace(",", "."));
        if (!Number.isFinite(n) || n <= 0 || n > 1) {
          throw new Error("Counting fraction must be a number between 0 and 1 (e.g. 0.6)");
        }
        laytimeCountingFraction = n;
      }
      const whs = workableH.trim();
      const ths = totalH.trim();
      if ((whs === "") !== (ths === "")) {
        throw new Error("Set both workable hatches and total hatches, or leave both empty");
      }
      let workableHatches: number | null = null;
      let totalHatches: number | null = null;
      if (whs !== "") {
        workableHatches = parseInt(whs, 10);
        totalHatches = parseInt(ths, 10);
        if (!Number.isFinite(workableHatches) || !Number.isFinite(totalHatches)) {
          throw new Error("Hatch counts must be whole numbers");
        }
        if (totalHatches < 1) {
          throw new Error("Total hatches must be at least 1");
        }
        if (workableHatches < 0 || workableHatches > totalHatches) {
          throw new Error("Workable hatches must be between 0 and total hatches");
        }
      }

      const excludedDaysList = excludedDaysFromWorkSpan(weekStartDay, weekEndDay);
      const excludedTimePeriodPayload = buildLaytimeExcludedTimePeriod(
        weekStartDay,
        weekStartTime,
        weekEndDay,
        weekEndTime,
        excludedTimePeriod
      );

      await patchImportContract(contractId, {
        excludedDays: excludedDaysList,
        holidaysExcluded,
        excludedTimePeriod: excludedTimePeriodPayload,
        dischargePort: dischargePort.trim() || null,
        dischargeRateMtPerDay: dischargeRate === "" ? null : parseFloat(dischargeRate),
        dischargeRateUnit: rateUnit.trim() || null,
        laytimeDemurrageRatePerDay: demRate === "" ? null : parseFloat(demRate),
        laytimeDispatchRatePerDay: disRate === "" ? null : parseFloat(disRate),
        laytimeCountingFraction,
        workableHatches,
        totalHatches,
        currency: currency.trim() || null
      });

      if (embedded && vesselCallId) {
        const t = cargoMt.trim();
        const w = t === "" ? null : parseFloat(t.replace(",", "."));
        if (w !== null && !Number.isFinite(w)) {
          throw new Error("Total amount (MT) must be a valid number");
        }
        await patchVesselCall(vesselCallId, {
          approxTotalWeightTon: w === null ? null : w
        });
      }
    },
    onSuccess: () => {
      setErr(null);
      void qc.invalidateQueries({ queryKey: ["import-contract", contractId] });
      void qc.invalidateQueries({ queryKey: ["mother-sof"] });
      onSaved?.();
    },
    onError: (e) => setErr(parseApiErr(e))
  });

  const unlinkMut = useMutation({
    mutationFn: async () => {
      if (!vesselCallId) throw new Error("No vessel call");
      return patchVesselCall(vesselCallId, { importContractId: null });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mother-sof"] });
      void qc.invalidateQueries({ queryKey: ["import-contract", contractId] });
      onUnlinked?.();
    },
    onError: (e) => toast.error(parseApiErr(e))
  });

  if (q.isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">Loading contract…</CardContent>
      </Card>
    );
  }

  if (q.isError || !c) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-destructive">
          Could not load this import contract.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={embedded ? (embeddedCompact ? "space-y-3" : "space-y-4") : "space-y-6"}>
      {!embedded ? (
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-1 -ml-2 h-8 px-2">
            <Link href={vesselSofWorkspacePath("overview", "mother")}>← Mother SOF</Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Import contract · laytime</h1>
          <p className="text-sm text-muted-foreground">{c.contractNo}</p>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-md border border-border bg-muted/20 text-xs",
            embeddedCompact ? "px-2 py-1.5" : "px-3 py-2"
          )}
        >
          <p className="font-semibold text-foreground">{c.contractNo}</p>
          <dl className={cn("grid gap-2 sm:grid-cols-2", embeddedCompact ? "mt-1 gap-1" : "mt-2")}>
            <div>
              <dt className="text-muted-foreground">Discharge port</dt>
              <dd className="font-medium">{dischargePort.trim() || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">LC establish by</dt>
              <dd className="font-medium">{formatDt(c.lcEstablishByDate ?? null)}</dd>
            </div>
          </dl>
          <div className={cn("flex flex-wrap gap-2", embeddedCompact ? "mt-1" : "mt-2")}>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
              <Link href={`/import-contracts/${contractId}`}>Open full page</Link>
            </Button>
            {vesselCallId && !readOnly ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 text-xs text-destructive"
                disabled={unlinkMut.isPending}
                onClick={() => {
                  if (
                    confirm(
                      "Unlink this import contract from the vessel call? Laytime will use no contract until you link another."
                    )
                  ) {
                    unlinkMut.mutate();
                  }
                }}
              >
                Unlink from call
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {embedded ? (
        <Card>
          <CardHeader className={embeddedCompact ? "space-y-0.5 py-2 pb-0" : "pb-3"}>
            <CardTitle className={embeddedCompact ? "text-sm" : "text-base"}>
              Working week &amp; cargo
            </CardTitle>
            {embeddedCompact ? (
              <CardDescription className="text-[10px] leading-snug">
                Week + cargo → save, then{" "}
                <span className="font-medium text-foreground">Recalculate</span> on the sheet.
              </CardDescription>
            ) : (
              <CardDescription className="text-xs">
                <span className="font-medium text-foreground">Week starts on / Week ends on</span>{" "}
                define when contract contact hours count on the daily laytime sheet (e.g. Sunday
                08:00 through Thursday 17:00). Save here, then use{" "}
                <span className="font-medium text-foreground">Recalculate laytime</span> below.
                Cargo quantity and discharge rate set allowed laytime. Excluded weekdays for SOF
                segments are derived from this week span.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className={embeddedCompact ? "space-y-3 pt-2" : "space-y-5"}>
            <ImportContractWeekWindowFields
              readOnly={readOnly}
              compact={embeddedCompact}
              weekStartDay={weekStartDay}
              setWeekStartDay={setWeekStartDay}
              weekStartTime={weekStartTime}
              setWeekStartTime={setWeekStartTime}
              weekEndDay={weekEndDay}
              setWeekEndDay={setWeekEndDay}
              weekEndTime={weekEndTime}
              setWeekEndTime={setWeekEndTime}
            />
            <div className={cn("grid sm:grid-cols-2", embeddedCompact ? "gap-2" : "gap-4")}>
              <div className={cn("space-y-2", embeddedCompact && "space-y-1")}>
                <Label className={embeddedCompact ? "text-xs" : undefined}>Total amount (MT)</Label>
                <Input
                  className={embeddedCompact ? "h-8 text-sm" : undefined}
                  disabled={readOnly || !vesselCallId}
                  value={cargoMt}
                  onChange={(e) => setCargoMt(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 33000"
                />
                {!vesselCallId ? (
                  <p className="text-[11px] text-muted-foreground">
                    Link a vessel call to edit cargo quantity here.
                  </p>
                ) : null}
              </div>
              <div className={cn("space-y-2", embeddedCompact && "space-y-1")}>
                <Label className={embeddedCompact ? "text-xs" : undefined}>
                  Discharge rate (MT/day)
                </Label>
                <Input
                  className={embeddedCompact ? "h-8 text-sm" : undefined}
                  disabled={readOnly}
                  value={dischargeRate}
                  onChange={(e) => setDischargeRate(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            </div>

            {computedAllowedHours !== null ? (
              <div
                className={cn(
                  "rounded-md border border-border bg-muted/30 text-sm",
                  embeddedCompact ? "px-2 py-1.5 text-xs" : "px-3 py-2"
                )}
              >
                <p className="font-medium text-foreground">Computed laytime (qty ÷ rate)</p>
                <p className="mt-1 text-muted-foreground">
                  <span className="text-foreground">
                    {formatDecimalHoursToDaysHMin(computedAllowedHours)}
                  </span>
                  <span className="mx-2">·</span>
                  <span className="text-foreground">
                    {formatDecimalHoursToTotalHoursMin(computedAllowedHours)}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter a positive total amount and discharge rate to preview allowed laytime in days
                and hours.
              </p>
            )}

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1">
                  <ChevronDown className="size-4" />
                  More contract terms (port, demurrage, dispatch, notes)
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4 data-[state=closed]:animate-out">
                <div className="space-y-2">
                  <Label>Discharge port</Label>
                  <Input
                    disabled={readOnly}
                    value={dischargePort}
                    onChange={(e) => setDischargePort(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discharge rate unit</Label>
                  <Input
                    disabled={readOnly}
                    value={rateUnit}
                    onChange={(e) => setRateUnit(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Demurrage / day</Label>
                    <Input
                      disabled={readOnly}
                      value={demRate}
                      onChange={(e) => setDemRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dispatch / day</Label>
                    <Input
                      disabled={readOnly}
                      value={disRate}
                      onChange={(e) => setDisRate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input
                      disabled={readOnly}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      maxLength={8}
                    />
                  </div>
                </div>
                <LaytimeCountingFractionFields
                  readOnly={readOnly}
                  compact={embeddedCompact}
                  layFrac={layFrac}
                  setLayFrac={setLayFrac}
                  workableH={workableH}
                  setWorkableH={setWorkableH}
                  totalH={totalH}
                  setTotalH={setTotalH}
                  preview={countingFracPreview}
                />
                <div className="flex items-center gap-2">
                  <input
                    id={`${formId}-hol-ex-emb`}
                    type="checkbox"
                    className="size-4 rounded border-input"
                    disabled={readOnly}
                    checked={holidaysExcluded}
                    onChange={(e) => setHolidaysExcluded(e.target.checked)}
                  />
                  <Label
                    htmlFor={`${formId}-hol-ex-emb`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    Holidays excluded (informational)
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label>Calendar notes (optional, after saved week line)</Label>
                  <Input
                    disabled={readOnly}
                    value={excludedTimePeriod}
                    onChange={(e) => setExcludedTimePeriod(e.target.value)}
                    placeholder="e.g. rain delays noted in CP"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contract working week (laytime)</CardTitle>
              <CardDescription className="text-xs">
                Defines the recurring contact window on the mother laytime daily sheet and derives
                excluded weekdays for elapsed-based SOF segments (unless an event sets explicit{" "}
                <code className="text-[10px]">laytimeImpactHours</code>). Save contract terms, then
                recalculate laytime on the mother SOF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImportContractWeekWindowFields
                readOnly={readOnly}
                compact={false}
                weekStartDay={weekStartDay}
                setWeekStartDay={setWeekStartDay}
                weekStartTime={weekStartTime}
                setWeekStartTime={setWeekStartTime}
                weekEndDay={weekEndDay}
                setWeekEndDay={setWeekEndDay}
                weekEndTime={weekEndTime}
                setWeekEndTime={setWeekEndTime}
              />
              <div className="space-y-2">
                <Label>Calendar notes (optional)</Label>
                <Input
                  disabled={readOnly}
                  value={excludedTimePeriod}
                  onChange={(e) => setExcludedTimePeriod(e.target.value)}
                  placeholder="e.g. rain delays noted in CP (stored after the week line)"
                />
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">
                <span className="font-medium text-foreground">Excluded from segment counting:</span>{" "}
                {excludedDaysPreview || "—"}
              </p>
              <div className="flex items-center gap-2">
                <input
                  id={`${formId}-hol-ex`}
                  type="checkbox"
                  className="size-4 rounded border-input"
                  disabled={readOnly}
                  checked={holidaysExcluded}
                  onChange={(e) => setHolidaysExcluded(e.target.checked)}
                />
                <Label htmlFor={`${formId}-hol-ex`} className="cursor-pointer text-sm font-normal">
                  Holidays excluded (informational; holiday calendar not automated yet)
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rates, port &amp; currency</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Discharge port</Label>
                <Input
                  disabled={readOnly}
                  value={dischargePort}
                  onChange={(e) => setDischargePort(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Discharge rate (MT/day)</Label>
                <Input
                  disabled={readOnly}
                  value={dischargeRate}
                  onChange={(e) => setDischargeRate(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Discharge rate unit</Label>
                <Input
                  disabled={readOnly}
                  value={rateUnit}
                  onChange={(e) => setRateUnit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Demurrage / day</Label>
                <Input
                  disabled={readOnly}
                  value={demRate}
                  onChange={(e) => setDemRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Dispatch / day</Label>
                <Input
                  disabled={readOnly}
                  value={disRate}
                  onChange={(e) => setDisRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  disabled={readOnly}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  maxLength={8}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Laytime time counting</CardTitle>
              <CardDescription className="text-xs">
                Matches Laytime2000-style <span className="font-medium">Frac</span> on port
                chronology (after excluded weekdays / OODDA). Save, then recalculate laytime on the
                SOF.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LaytimeCountingFractionFields
                readOnly={readOnly}
                compact={false}
                layFrac={layFrac}
                setLayFrac={setLayFrac}
                workableH={workableH}
                setWorkableH={setWorkableH}
                totalH={totalH}
                setTotalH={setTotalH}
                preview={countingFracPreview}
              />
            </CardContent>
          </Card>
        </>
      )}

      {err ? <p className="text-sm text-destructive">{err}</p> : null}

      {!readOnly ? (
        <Button
          type="button"
          size={embedded && embeddedCompact ? "sm" : "default"}
          className={embedded && embeddedCompact ? "w-full" : undefined}
          disabled={mut.isPending}
          onClick={() => mut.mutate()}
        >
          {mut.isPending
            ? "Saving…"
            : embedded
              ? "Save laytime setup"
              : "Save contract laytime terms"}
        </Button>
      ) : null}
    </div>
  );
}

export function VesselCallImportContractLinkPanel({
  vesselCallId,
  readOnly,
  onLinked
}: {
  vesselCallId: string;
  readOnly?: boolean;
  onLinked?: () => void;
}) {
  const qc = useQueryClient();
  const [contractId, setContractId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const link = () => {
    const id = contractId.trim();
    if (!id) {
      setErr("Enter an import contract ID");
      return;
    }
    setErr(null);
    setBusy(true);
    patchVesselCall(vesselCallId, { importContractId: id })
      .then(() => {
        setContractId("");
        void qc.invalidateQueries({ queryKey: ["mother-sof"] });
        onLinked?.();
      })
      .catch((e) => setErr(parseApiErr(e)))
      .finally(() => setBusy(false));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Import contract (documents)</CardTitle>
        <CardDescription className="text-xs">
          No contract is linked to this vessel call. Link an existing import contract to drive
          laytime discharge rate, working week, and demurrage/dispatch rates. Contract terms are
          edited below after linking.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="link-contract-id">Import contract ID</Label>
          <Input
            id="link-contract-id"
            disabled={readOnly || busy}
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            placeholder="Paste contract id (cuid)"
          />
        </div>
        {err ? <p className="text-sm text-destructive">{err}</p> : null}
        <Button type="button" disabled={readOnly || busy} onClick={link}>
          {busy ? "Linking…" : "Link contract to call"}
        </Button>
      </CardContent>
    </Card>
  );
}
