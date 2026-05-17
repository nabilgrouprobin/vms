"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchImportContract, patchImportContract } from "@/lib/import-contracts-api";
import {
  formatDecimalHoursToDaysHMin,
  formatDecimalHoursToTotalHoursMin
} from "@/lib/laytime-hours-format";
import { parseApiErr } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";
import { patchVesselCall } from "@/lib/vessel-calls-api";
import { cn } from "@/lib/utils";

export type SofLaytimeCargoAllowanceInputProps = {
  contractId: string | null | undefined;
  vesselCallId: string | null | undefined;
  vesselCallApproxTotalWeightTon: string | null | undefined;
  laytimePartialCargoMt: string | null | undefined;
  laytimeDischargeRateMtPerDay: string | null | undefined;
  readOnly: boolean;
  patchSof: (body: Record<string, unknown>) => Promise<unknown>;
  invalidateQueryKeys: unknown[][];
  /** After cargo/rate is saved (e.g. refresh laytime sheet). */
  onAfterSave?: () => void;
};

export type SofLaytimeCargoAllowanceFormProps = SofLaytimeCargoAllowanceInputProps & {
  /** `sidebar`: own card. `embedded`: fields inside {@link SofLaytimeSetupSidebarCard}. */
  variant?: "sidebar" | "panel" | "embedded";
};

function parseMtInput(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = parseFloat(t.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function SofLaytimeCargoAllowanceForm({
  contractId,
  vesselCallId,
  vesselCallApproxTotalWeightTon,
  laytimePartialCargoMt,
  laytimeDischargeRateMtPerDay,
  readOnly,
  patchSof,
  invalidateQueryKeys,
  onAfterSave,
  variant = "sidebar"
}: SofLaytimeCargoAllowanceFormProps) {
  const qc = useQueryClient();
  const isPanel = variant === "panel";
  const isEmbedded = variant === "embedded";
  const [totalCargo, setTotalCargo] = useState("");
  const [dischargeRate, setDischargeRate] = useState("");
  const [partialCargo, setPartialCargo] = useState("");

  const contractQ = useQuery({
    queryKey: ["import-contract", contractId, "laytime-cargo"],
    queryFn: () => fetchImportContract(contractId!),
    enabled: !!contractId
  });

  useEffect(() => {
    if (vesselCallApproxTotalWeightTon != null && vesselCallApproxTotalWeightTon !== "") {
      setTotalCargo(String(vesselCallApproxTotalWeightTon));
    } else {
      setTotalCargo("");
    }
  }, [vesselCallApproxTotalWeightTon, vesselCallId]);

  useEffect(() => {
    const c = contractQ.data;
    const contractRate = c?.dischargeRateMtPerDay;
    if (contractRate != null && contractRate !== "") {
      setDischargeRate(String(contractRate));
    } else if (laytimeDischargeRateMtPerDay != null && laytimeDischargeRateMtPerDay !== "") {
      setDischargeRate(String(laytimeDischargeRateMtPerDay));
    } else {
      setDischargeRate("");
    }
  }, [
    contractQ.data?.id,
    contractQ.data?.dischargeRateMtPerDay,
    laytimeDischargeRateMtPerDay
  ]);

  useEffect(() => {
    setPartialCargo(
      laytimePartialCargoMt != null && laytimePartialCargoMt !== ""
        ? String(laytimePartialCargoMt)
        : ""
    );
  }, [laytimePartialCargoMt]);

  const allowanceQty = useMemo(() => {
    const partial = parseMtInput(partialCargo);
    const total = parseMtInput(totalCargo);
    if (partial !== null && Number.isFinite(partial) && partial > 0) return partial;
    if (total !== null && Number.isFinite(total) && total > 0) return total;
    return null;
  }, [partialCargo, totalCargo]);

  const computedAllowedHours = useMemo(() => {
    const rate = parseMtInput(dischargeRate);
    if (allowanceQty === null || rate === null || !Number.isFinite(rate) || rate <= 0) return null;
    return (allowanceQty / rate) * 24;
  }, [allowanceQty, dischargeRate]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const total = parseMtInput(totalCargo);
      if (totalCargo.trim() !== "" && (total === null || !Number.isFinite(total) || total < 0)) {
        throw new Error("Total cargo (MT) must be a non-negative number or blank.");
      }
      const rate = parseMtInput(dischargeRate);
      if (dischargeRate.trim() !== "" && (rate === null || !Number.isFinite(rate) || rate <= 0)) {
        throw new Error("Discharge rate (MT/day) must be a positive number or blank.");
      }
      const partial = parseMtInput(partialCargo);
      if (
        partialCargo.trim() !== "" &&
        (partial === null || !Number.isFinite(partial) || partial < 0)
      ) {
        throw new Error("Partial cargo (MT) must be a non-negative number or blank.");
      }

      if (contractId) {
        if (dischargeRate.trim() !== "") {
          if (!contractQ.data) throw new Error("Contract not loaded yet.");
          await patchImportContract(contractId, {
            dischargeRateMtPerDay: rate
          });
        } else {
          await patchImportContract(contractId, { dischargeRateMtPerDay: null });
        }
      }

      if (vesselCallId) {
        await patchVesselCall(vesselCallId, {
          approxTotalWeightTon: total
        });
      }

      const sofPatch: Record<string, unknown> = { laytimePartialCargoMt: partial };
      if (!contractId) {
        sofPatch.laytimeDischargeRateMtPerDay = rate;
      }
      await patchSof(sofPatch);
    },
    onSuccess: () => {
      toast.success("Cargo and discharge allowance saved.");
      if (contractId) {
        void qc.invalidateQueries({ queryKey: ["import-contract", contractId] });
      }
      for (const key of invalidateQueryKeys) {
        void qc.invalidateQueries({ queryKey: key as string[] });
      }
      onAfterSave?.();
    },
    onError: (e) => toast.error(parseApiErr(e))
  });

  const fields = (
    <>
      <div
        className={cn(
          "gap-3",
          isPanel ? "grid sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"
        )}
      >
        <div className="space-y-1">
          <Label className={isPanel ? "text-xs font-medium" : "text-xs"}>Total cargo (MT)</Label>
          <Input
            className={cn("font-mono", isPanel ? "h-9 text-sm" : "h-8 text-sm")}
            inputMode="decimal"
            placeholder="Vessel call total, e.g. 33000"
            value={totalCargo}
            onChange={(e) => setTotalCargo(e.target.value)}
            disabled={readOnly || !vesselCallId}
          />
          {!vesselCallId ? (
            <p className="text-[10px] text-muted-foreground">No vessel call linked to this SOF.</p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label className={isPanel ? "text-xs font-medium" : "text-xs"}>Discharge rate (MT/day)</Label>
          <Input
            className={cn("font-mono", isPanel ? "h-9 text-sm" : "h-8 text-sm")}
            inputMode="decimal"
            placeholder="e.g. 5000"
            value={dischargeRate}
            onChange={(e) => setDischargeRate(e.target.value)}
            disabled={readOnly || (!!contractId && contractQ.isLoading)}
          />
          {contractId && contractQ.isLoading ? (
            <p className="text-[10px] text-muted-foreground">Loading contract…</p>
          ) : contractId ? (
            <p className="text-[10px] text-muted-foreground">
              Saved on the linked import contract.
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              Saved on this SOF (no import contract linked).
            </p>
          )}
        </div>
        <div className={cn("space-y-1", isPanel && "sm:col-span-2 lg:col-span-1")}>
          <Label className={isPanel ? "text-xs font-medium" : "text-xs"}>Partial cargo on this SOF (MT)</Label>
          <Input
            className={cn("font-mono", isPanel ? "h-9 text-sm" : "h-8 text-sm")}
            inputMode="decimal"
            placeholder="Optional — overrides total for allowance"
            value={partialCargo}
            onChange={(e) => setPartialCargo(e.target.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {computedAllowedHours !== null ? (
        <div
          className={cn(
            "rounded-md border border-border bg-muted/30 text-xs",
            isPanel ? "px-3 py-2 sm:col-span-2 lg:col-span-3" : "px-2 py-1.5"
          )}
        >
          <p className="font-medium text-foreground">
            Allowed laytime pool (hours) — qty ÷ rate × 24 h; only contact hours deduct
          </p>
          <p className="mt-0.5 text-muted-foreground">
            <span className="font-medium text-foreground">
              {formatDecimalHoursToTotalHoursMin(computedAllowedHours)}
            </span>
            <span className="mx-1.5">·</span>
            <span className="text-foreground">
              {formatDecimalHoursToDaysHMin(computedAllowedHours)}
            </span>
            {allowanceQty !== null ? (
              <span className="mt-0.5 block text-[10px]">
                Using {partialCargo.trim() ? "partial" : "total"} qty{" "}
                <span className="font-mono tabular-nums">{allowanceQty}</span> MT
              </span>
            ) : null}
          </p>
        </div>
      ) : (
        <p className={cn("text-muted-foreground", isPanel ? "text-xs" : "text-[10px]")}>
          Enter cargo quantity and discharge rate to preview allowed laytime, then save and
          recalculate.
        </p>
      )}

      <Button
        type="button"
        size="sm"
        className={cn(isPanel ? "w-fit" : "h-8 w-full")}
        disabled={readOnly || saveMut.isPending}
        onClick={() => saveMut.mutate()}
      >
        {saveMut.isPending ? "Saving…" : "Save cargo & allowance"}
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
        aria-labelledby="laytime-cargo-inputs"
      >
        <div id="laytime-cargo-inputs" className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Allowance inputs
          </h3>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Total cargo, discharge rate, and optional partial cargo drive equation (1) below. Save
            here, then run <span className="font-medium text-foreground">Recalculate</span>.
          </p>
        </div>
        {fields}
      </section>
    );
  }

  return (
    <Card className="shadow-sm xl:shadow-none">
      <CardHeader className="space-y-1 px-3 py-2 pb-0">
        <CardTitle className="text-sm font-semibold">Cargo &amp; discharge allowance</CardTitle>
        <CardDescription className="text-[10px] leading-snug">
          Total cargo and discharge rate set allowed laytime (qty ÷ rate × 24 h). Partial cargo on
          this statement overrides total for that calculation when filled.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-3 pt-2">{fields}</CardContent>
    </Card>
  );
}
