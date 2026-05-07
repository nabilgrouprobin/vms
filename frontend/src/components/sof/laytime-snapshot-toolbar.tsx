"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, RotateCcw, Save, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDt } from "@/lib/format";
import { formatDecimalHoursToHMin } from "@/lib/laytime-hours-format";
import { parseApiErr } from "@/lib/parse-api-error";
import { toDatetimeLocalValue } from "@/lib/sof-event-display";
import { updateLighterSof, updateMotherSof } from "@/lib/sof-api";

export type LaytimeSnapshotFields = {
  laytimeCommenceAt: string | null;
  laytimeUsedHours: string | null;
  laytimeExcludedHours: string | null;
  laytimeBalanceHours: string | null;
  demurrageAmount: string | null;
  dispatchAmount: string | null;
  netAmount: string | null;
};

type LaytimeSnapshotToolbarProps = {
  variant: "mother" | "lighter";
  sofId: string;
  readOnly: boolean;
  snapshot: LaytimeSnapshotFields;
  /** Invalidate keys after save/clear */
  detailQueryKey: readonly unknown[];
  /** Tighter padding when nested (e.g. laytime tab collapsible). */
  compact?: boolean;
};

function toIsoFromDatetimeLocal(v: string): string | null {
  const t = v.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

export function LaytimeSnapshotToolbar({
  variant,
  sofId,
  readOnly,
  snapshot,
  detailQueryKey,
  compact = false
}: LaytimeSnapshotToolbarProps) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [commenceLocal, setCommenceLocal] = useState("");
  const [used, setUsed] = useState("");
  const [excluded, setExcluded] = useState("");
  const [balance, setBalance] = useState("");
  const [dem, setDem] = useState("");
  const [dis, setDis] = useState("");
  const [net, setNet] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const syncFromSnapshot = () => {
    setCommenceLocal(
      snapshot.laytimeCommenceAt ? toDatetimeLocalValue(snapshot.laytimeCommenceAt) : ""
    );
    setUsed(snapshot.laytimeUsedHours ?? "");
    setExcluded(snapshot.laytimeExcludedHours ?? "");
    setBalance(snapshot.laytimeBalanceHours ?? "");
    setDem(snapshot.demurrageAmount ?? "");
    setDis(snapshot.dispatchAmount ?? "");
    setNet(snapshot.netAmount ?? "");
  };

  useEffect(() => {
    if (editing) return;
    syncFromSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when server snapshot fields change
  }, [
    editing,
    snapshot.laytimeCommenceAt,
    snapshot.laytimeUsedHours,
    snapshot.laytimeExcludedHours,
    snapshot.laytimeBalanceHours,
    snapshot.demurrageAmount,
    snapshot.dispatchAmount,
    snapshot.netAmount
  ]);

  const mut = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      variant === "mother" ? updateMotherSof(sofId, body) : updateLighterSof(sofId, body),
    onSuccess: () => {
      setErr(null);
      setEditing(false);
      void qc.invalidateQueries({ queryKey: [...detailQueryKey] });
    },
    onError: (e) => setErr(parseApiErr(e))
  });

  const save = () => {
    setErr(null);
    mut.mutate({
      laytimeCommenceAt: toIsoFromDatetimeLocal(commenceLocal),
      laytimeUsedHours: emptyToNull(used),
      laytimeExcludedHours: emptyToNull(excluded),
      laytimeBalanceHours: emptyToNull(balance),
      demurrageAmount: emptyToNull(dem),
      dispatchAmount: emptyToNull(dis),
      netAmount: emptyToNull(net)
    });
  };

  const clearSnapshot = () => {
    if (
      !confirm(
        "Clear stored laytime snapshot on this SOF? Commence, hour balances, and money amounts will be removed until you recalculate or enter them again."
      )
    ) {
      return;
    }
    setErr(null);
    mut.mutate({
      laytimeCommenceAt: null,
      laytimeUsedHours: null,
      laytimeExcludedHours: null,
      laytimeBalanceHours: null,
      demurrageAmount: null,
      dispatchAmount: null,
      netAmount: null
    });
  };

  const cancelEdit = () => {
    syncFromSnapshot();
    setEditing(false);
    setErr(null);
  };

  const usedLabel = variant === "mother" ? "Contract hrs (stored)" : "Used";
  const excludedLabel = variant === "mother" ? "Idle (24 − working)" : "Excluded";

  return (
    <div
      className={
        compact
          ? "space-y-2 rounded-md border border-border bg-muted/20 p-2"
          : "space-y-3 rounded-md border border-border bg-muted/20 p-3"
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={
            compact ? "text-xs font-medium text-foreground" : "text-sm font-medium text-foreground"
          }
        >
          Stored laytime snapshot
        </p>
        <div className="flex flex-wrap gap-2">
          {!readOnly && !editing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-1"
                onClick={() => {
                  syncFromSnapshot();
                  setEditing(true);
                }}
              >
                <Pencil className="size-3.5" aria-hidden />
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1 text-destructive"
                onClick={clearSnapshot}
                disabled={mut.isPending}
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Clear
              </Button>
            </>
          ) : null}
          {!readOnly && editing ? (
            <>
              <Button
                type="button"
                size="sm"
                className="gap-1"
                onClick={save}
                disabled={mut.isPending}
              >
                <Save className="size-3.5" aria-hidden />
                {mut.isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={cancelEdit}
                disabled={mut.isPending}
              >
                <X className="size-3.5" aria-hidden />
                Cancel
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
              <th className="px-3 py-2">Field</th>
              <th className="px-3 py-2">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="px-3 py-2 text-muted-foreground">Laytime commence</td>
              <td className="px-3 py-2">
                {editing ? (
                  <Input
                    type="datetime-local"
                    className="h-9 max-w-xs font-mono text-xs"
                    value={commenceLocal}
                    onChange={(e) => setCommenceLocal(e.target.value)}
                  />
                ) : (
                  <span className="font-medium">{formatDt(snapshot.laytimeCommenceAt)}</span>
                )}
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-3 py-2 text-muted-foreground">{usedLabel}</td>
              <td className="px-3 py-2">
                {editing ? (
                  <Input
                    className="h-9 max-w-[12rem] font-mono text-xs"
                    value={used}
                    onChange={(e) => setUsed(e.target.value)}
                  />
                ) : (
                  <span className="font-medium">
                    {formatDecimalHoursToHMin(snapshot.laytimeUsedHours)}
                  </span>
                )}
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-3 py-2 text-muted-foreground">{excludedLabel}</td>
              <td className="px-3 py-2">
                {editing ? (
                  <Input
                    className="h-9 max-w-[12rem] font-mono text-xs"
                    value={excluded}
                    onChange={(e) => setExcluded(e.target.value)}
                  />
                ) : (
                  <span className="font-medium">
                    {formatDecimalHoursToHMin(snapshot.laytimeExcludedHours)}
                  </span>
                )}
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-3 py-2 text-muted-foreground">Balance</td>
              <td className="px-3 py-2">
                {editing ? (
                  <Input
                    className="h-9 max-w-[12rem] font-mono text-xs"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                  />
                ) : (
                  <span className="font-medium">
                    {formatDecimalHoursToHMin(snapshot.laytimeBalanceHours)}
                  </span>
                )}
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-3 py-2 text-muted-foreground">Demurrage</td>
              <td className="px-3 py-2">
                {editing ? (
                  <Input
                    className="h-9 max-w-[12rem] font-mono text-xs"
                    value={dem}
                    onChange={(e) => setDem(e.target.value)}
                  />
                ) : (
                  <span className="font-medium">{snapshot.demurrageAmount ?? "—"}</span>
                )}
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="px-3 py-2 text-muted-foreground">Dispatch</td>
              <td className="px-3 py-2">
                {editing ? (
                  <Input
                    className="h-9 max-w-[12rem] font-mono text-xs"
                    value={dis}
                    onChange={(e) => setDis(e.target.value)}
                  />
                ) : (
                  <span className="font-medium">{snapshot.dispatchAmount ?? "—"}</span>
                )}
              </td>
            </tr>
            <tr className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-muted-foreground">Net</td>
              <td className="px-3 py-2">
                {editing ? (
                  <Input
                    className="h-9 max-w-[12rem] font-mono text-xs"
                    value={net}
                    onChange={(e) => setNet(e.target.value)}
                  />
                ) : (
                  <span className="font-medium">{snapshot.netAmount ?? "—"}</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Hours accept decimals when editing (saved as stored); display uses hours and minutes. Clear
        removes the snapshot fields only.
      </p>
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
    </div>
  );
}
