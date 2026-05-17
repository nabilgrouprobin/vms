"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SofLocalDatetimeInputs } from "@/components/sof/sof-local-datetime-inputs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseApiErr } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import { toDatetimeLocalValue } from "@/lib/sof-event-display";

export type SofLaytimeHolidayRowApi = {
  id: string;
  name: string;
  holidayStartAt: string;
  holidayEndAt: string;
  eveContactEndHm: string | null;
  postContactStartHm: string | null;
  sortOrder: number;
};

type HolidayFormRow = {
  name: string;
  holidayStartAt: string;
  holidayEndAt: string;
  eveContactEndHm: string;
  postContactStartHm: string;
};

function mapApiToForm(rows: SofLaytimeHolidayRowApi[] | undefined): HolidayFormRow[] {
  if (!rows?.length) return [];
  return rows.map((h) => ({
    name: h.name,
    holidayStartAt: toDatetimeLocalValue(h.holidayStartAt),
    holidayEndAt: toDatetimeLocalValue(h.holidayEndAt),
    eveContactEndHm: h.eveContactEndHm ?? "",
    postContactStartHm: h.postContactStartHm ?? ""
  }));
}

export type SofLaytimeStatementParamsCardMode = "full" | "partial-only" | "holidays-only";

export type SofLaytimeStatementParamsCardProps = {
  readOnly: boolean;
  /** When this string changes (e.g. server `updatedAt`), form resets from server. */
  serverSyncToken: string;
  laytimePartialCargoMt: string | null | undefined;
  laytimeHolidays: SofLaytimeHolidayRowApi[] | undefined;
  patchSof: (body: Record<string, unknown>) => Promise<unknown>;
  invalidateQueryKeys: unknown[][];
  /** `partial-only`: cargo override only. `holidays-only`: holidays only. `full`: laytime tab (default). */
  mode?: SofLaytimeStatementParamsCardMode;
  /** When false, partial cargo is edited in SofLaytimeCargoSidebarCard instead. */
  showPartialCargo?: boolean;
};

export function SofLaytimeStatementParamsCard({
  readOnly,
  serverSyncToken,
  laytimePartialCargoMt,
  laytimeHolidays,
  patchSof,
  invalidateQueryKeys,
  mode = "full",
  showPartialCargo = true
}: SofLaytimeStatementParamsCardProps) {
  const qc = useQueryClient();
  const showPartial =
    showPartialCargo && (mode === "full" || mode === "partial-only");
  const showHolidays = mode === "full" || mode === "holidays-only";

  const [partial, setPartial] = useState("");
  const [rows, setRows] = useState<HolidayFormRow[]>([]);

  useEffect(() => {
    if (showPartial) {
      setPartial(
        laytimePartialCargoMt != null && laytimePartialCargoMt !== ""
          ? String(laytimePartialCargoMt)
          : ""
      );
    }
    if (showHolidays) {
      setRows(mapApiToForm(laytimeHolidays));
    }
  }, [serverSyncToken, laytimePartialCargoMt, laytimeHolidays, showPartial, showHolidays]);

  const buildHolidaysPayload = () =>
    rows
      .filter((r) => r.name.trim())
      .map((r, i) => {
        if (!r.holidayStartAt.trim() || !r.holidayEndAt.trim()) {
          throw new Error(`Holiday “${r.name.trim()}” needs start and end date/time.`);
        }
        const s = new Date(r.holidayStartAt).getTime();
        const e = new Date(r.holidayEndAt).getTime();
        if (!Number.isFinite(s) || !Number.isFinite(e)) {
          throw new Error(`Holiday “${r.name.trim()}” has invalid date/time.`);
        }
        if (e < s) {
          throw new Error(`Holiday “${r.name.trim()}” ends before it starts.`);
        }
        const eve = r.eveContactEndHm.trim();
        const post = r.postContactStartHm.trim();
        if (eve && !/^\d{2}:\d{2}$/.test(eve)) {
          throw new Error(`Holiday “${r.name.trim()}”: eve contact end must be HH:mm or blank.`);
        }
        if (post && !/^\d{2}:\d{2}$/.test(post)) {
          throw new Error(`Holiday “${r.name.trim()}”: post contact start must be HH:mm or blank.`);
        }
        return {
          name: r.name.trim(),
          holidayStartAt: new Date(r.holidayStartAt).toISOString(),
          holidayEndAt: new Date(r.holidayEndAt).toISOString(),
          eveContactEndHm: eve || null,
          postContactStartHm: post || null,
          sortOrder: i
        };
      });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (mode === "partial-only") {
        const partialNum = partial.trim() === "" ? null : Number(partial.trim());
        if (partial.trim() !== "" && (partialNum === null || !Number.isFinite(partialNum) || partialNum < 0)) {
          throw new Error("Partial cargo (MT) must be a non-negative number or blank.");
        }
        await patchSof({ laytimePartialCargoMt: partialNum });
        return;
      }
      if (mode === "holidays-only" || (mode === "full" && !showPartial)) {
        await patchSof({ laytimeHolidays: buildHolidaysPayload() });
        return;
      }
      const partialNum = partial.trim() === "" ? null : Number(partial.trim());
      if (partial.trim() !== "" && (partialNum === null || !Number.isFinite(partialNum) || partialNum < 0)) {
        throw new Error("Partial cargo (MT) must be a non-negative number or blank.");
      }
      await patchSof({
        laytimePartialCargoMt: partialNum,
        laytimeHolidays: buildHolidaysPayload()
      });
    },
    onSuccess: () => {
      toast.success(
        mode === "partial-only"
          ? "Partial cargo saved."
          : mode === "holidays-only" || (mode === "full" && !showPartial)
            ? "SOF holidays saved."
            : "Laytime parameters saved."
      );
      for (const key of invalidateQueryKeys) {
        void qc.invalidateQueries({ queryKey: key as string[] });
      }
    },
    onError: (e) => toast.error(parseApiErr(e))
  });

  const title =
    mode === "partial-only"
      ? "Partial cargo (allowance)"
      : mode === "holidays-only" || (mode === "full" && !showPartial)
        ? "SOF holidays (laytime)"
        : "Statement laytime parameters";

  const description =
    mode === "partial-only"
      ? "Optional MT used instead of vessel-call total when computing discharge-rate allowed hours."
      : mode === "holidays-only" || (mode === "full" && !showPartial)
        ? "Sidebar holidays do not deduct from allowed laytime (288 h pool), same as weekly off-days, until demurrage starts. Save, then recalculate."
        : "Partial cargo (MT) scales discharge-rate allowance. Sidebar holidays exclude those calendar days from the allowed pool (like Fri/Sat) until demurrage.";

  return (
    <Card className="shadow-sm xl:shadow-none">
      <CardHeader className="space-y-1 px-3 py-2 pb-0">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CardDescription className="text-[10px] leading-snug">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3 pt-2">
        {showPartial ? (
          <div className="space-y-1">
            <Label htmlFor="lay-partial-mt" className="text-xs">
              Partial cargo for allowance (MT)
            </Label>
            <Input
              id="lay-partial-mt"
              className="h-8 font-mono text-sm"
              inputMode="decimal"
              placeholder="Use vessel total if blank"
              value={partial}
              onChange={(e) => setPartial(e.target.value)}
              disabled={readOnly}
            />
          </div>
        ) : null}

        {showHolidays ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">SOF holidays</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-[11px]"
                disabled={readOnly}
                onClick={() =>
                  setRows((prev) => [
                    ...prev,
                    {
                      name: "",
                      holidayStartAt: "",
                      holidayEndAt: "",
                      eveContactEndHm: "",
                      postContactStartHm: ""
                    }
                  ])
                }
              >
                <Plus className="size-3.5" />
                Add
              </Button>
            </div>
            {rows.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No holidays on this statement.</p>
            ) : (
              <div className="space-y-2">
                {rows.map((r, idx) => (
                  <div
                    key={idx}
                    className="space-y-1.5 rounded-md border border-border/80 bg-background/60 p-2"
                  >
                    <div className="flex items-end justify-between gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <Label className="text-[10px]">Name</Label>
                        <Input
                          className="h-8 text-xs"
                          value={r.name}
                          onChange={(e) =>
                            setRows((prev) => {
                              const n = [...prev];
                              n[idx] = { ...n[idx]!, name: e.target.value };
                              return n;
                            })
                          }
                          disabled={readOnly}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={readOnly}
                        aria-label="Remove holiday"
                        onClick={() => setRows((prev) => prev.filter((_, j) => j !== idx))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Start (local, 24-hour)</Label>
                        <SofLocalDatetimeInputs
                          value={r.holidayStartAt}
                          onChange={(v) =>
                            setRows((prev) => {
                              const n = [...prev];
                              n[idx] = { ...n[idx]!, holidayStartAt: v };
                              return n;
                            })
                          }
                          disabled={readOnly}
                          dateInputClassName="h-8 text-[11px]"
                          timeInputClassName="h-8 text-[11px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">End (local, 24-hour)</Label>
                        <SofLocalDatetimeInputs
                          value={r.holidayEndAt}
                          onChange={(v) =>
                            setRows((prev) => {
                              const n = [...prev];
                              n[idx] = { ...n[idx]!, holidayEndAt: v };
                              return n;
                            })
                          }
                          disabled={readOnly}
                          dateInputClassName="h-8 text-[11px]"
                          timeInputClassName="h-8 text-[11px]"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Eve contact end (HH:mm)</Label>
                        <Input
                          className="h-8 font-mono text-[11px]"
                          placeholder="18:00"
                          value={r.eveContactEndHm}
                          onChange={(e) =>
                            setRows((prev) => {
                              const n = [...prev];
                              n[idx] = { ...n[idx]!, eveContactEndHm: e.target.value };
                              return n;
                            })
                          }
                          disabled={readOnly}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Post contact start (HH:mm)</Label>
                        <Input
                          className="h-8 font-mono text-[11px]"
                          placeholder="08:00"
                          value={r.postContactStartHm}
                          onChange={(e) =>
                            setRows((prev) => {
                              const n = [...prev];
                              n[idx] = { ...n[idx]!, postContactStartHm: e.target.value };
                              return n;
                            })
                          }
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <Button
          type="button"
          size="sm"
          className="h-8 w-full"
          disabled={readOnly || saveMut.isPending}
          onClick={() => saveMut.mutate()}
        >
          {mode === "partial-only"
            ? "Save partial cargo"
            : mode === "holidays-only"
              ? "Save SOF holidays"
              : "Save laytime parameters"}
        </Button>
      </CardContent>
    </Card>
  );
}
