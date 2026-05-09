"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import {
  MotherVesselReportsPanel,
  type MotherVesselDischargeRow
} from "@/components/sof/mother-vessel-reports-panel";
import type { MotherVesselCallDetail } from "@/components/sof/mother-vessel-panels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDt } from "@/lib/format";
import { parseApiErr } from "@/lib/parse-api-error";
import {
  createDailyDischarge,
  deleteDailyDischarge,
  fetchDailyDischarges,
  fetchMotherSof,
  updateDailyDischarge
} from "@/lib/sof-api";
import { reportsDischargePath } from "@/lib/workspace-paths";

type DischargeRow = {
  id: string;
  reportDate: string;
  quantity24hMt: string;
  cumulativeMt: string | null;
  remainingMt: string | null;
  remarks: string | null;
};

type MotherSofMeta = {
  status: string;
  vesselCall: MotherVesselCallDetail | null;
};

function DischargeEditor({
  row,
  sofClosed,
  onSaved
}: {
  row: DischargeRow;
  sofClosed: boolean;
  onSaved: () => void;
}) {
  const [qty, setQty] = useState(row.quantity24hMt);
  const [cum, setCum] = useState(row.cumulativeMt ?? "");
  const [rem, setRem] = useState(row.remainingMt ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <li className="rounded-md border border-border p-3 text-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <p className="text-xs text-muted-foreground">{formatDt(row.reportDate)}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <Label className="text-xs">24h MT</Label>
              <Input
                className="h-8"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                disabled={sofClosed}
              />
            </div>
            <div>
              <Label className="text-xs">Cumulative</Label>
              <Input
                className="h-8"
                value={cum}
                onChange={(e) => setCum(e.target.value)}
                disabled={sofClosed}
              />
            </div>
            <div>
              <Label className="text-xs">Remaining</Label>
              <Input
                className="h-8"
                value={rem}
                onChange={(e) => setRem(e.target.value)}
                disabled={sofClosed}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={sofClosed || busy}
            onClick={() => {
              setBusy(true);
              updateDailyDischarge(row.id, {
                quantity24hMt: qty,
                cumulativeMt: cum || null,
                remainingMt: rem || null
              })
                .then(onSaved)
                .catch((e) => alert(parseApiErr(e)))
                .finally(() => setBusy(false));
            }}
          >
            Update
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={sofClosed || busy}
            onClick={() => {
              if (confirm("Delete this discharge row?")) {
                setBusy(true);
                deleteDailyDischarge(row.id)
                  .then(onSaved)
                  .catch((e) => alert(parseApiErr(e)))
                  .finally(() => setBusy(false));
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </li>
  );
}

export function MotherCallDischargeSection({
  motherSofId,
  vesselCall: vesselCallProp,
  vesselCallId: vesselCallIdProp,
  motherSofStatus,
  showOpenReportsLink
}: {
  motherSofId: string;
  vesselCall?: MotherVesselCallDetail | null;
  vesselCallId?: string;
  /** When set (e.g. on the mother SOF page), avoids fetchMotherSof for status and uses this for edit locks */
  motherSofStatus?: string;
  showOpenReportsLink?: boolean;
}) {
  const qc = useQueryClient();

  const metaQ = useQuery({
    queryKey: ["mother-sof", motherSofId],
    queryFn: () => fetchMotherSof(motherSofId),
    enabled: !!motherSofId && motherSofStatus === undefined
  });

  const meta = metaQ.data as MotherSofMeta | undefined;
  const status = motherSofStatus ?? meta?.status ?? "";
  const sofClosed = status === "CLOSED";

  const vesselCall = vesselCallProp ?? meta?.vesselCall ?? null;
  const vesselCallId = vesselCallIdProp ?? vesselCall?.id;

  const dischargeQ = useQuery({
    queryKey: ["mother-sof-discharge", motherSofId],
    queryFn: () => fetchDailyDischarges(motherSofId),
    enabled: !!motherSofId
  });

  const discharges = (dischargeQ.data ?? []) as DischargeRow[];

  const [ddDate, setDdDate] = useState("");
  const [ddQty, setDdQty] = useState("");
  const [ddCum, setDdCum] = useState("");
  const [ddRem, setDdRem] = useState("");
  const [ddErr, setDdErr] = useState<string | null>(null);

  const invalidateDischarge = () => {
    void qc.invalidateQueries({ queryKey: ["mother-sof-discharge", motherSofId] });
  };

  const addDdMut = useMutation({
    mutationFn: () => {
      if (!ddDate || !ddQty) throw new Error("Report date and 24h quantity required");
      return createDailyDischarge(motherSofId, {
        reportDate: new Date(ddDate).toISOString(),
        quantity24hMt: ddQty,
        cumulativeMt: ddCum || undefined,
        remainingMt: ddRem || undefined
      });
    },
    onSuccess: () => {
      setDdErr(null);
      invalidateDischarge();
    },
    onError: (e) => setDdErr(parseApiErr(e))
  });

  return (
    <div className="space-y-6">
      {showOpenReportsLink ? (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Daily discharge rows are stored on the mother vessel SOF for this call. Open Reports
              for the same discharge workspace in the main menu.
            </p>
            <Button asChild>
              <Link
                href={reportsDischargePath("mother", {
                  id: motherSofId,
                  vesselCallId: vesselCallIdProp ?? vesselCallProp?.id ?? null
                })}
              >
                Open discharge in Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Daily discharge</h2>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add daily discharge</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Report date</Label>
                <Input type="date" value={ddDate} onChange={(e) => setDdDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>24h quantity (MT)</Label>
                <Input value={ddQty} onChange={(e) => setDdQty(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cumulative (optional)</Label>
                <Input value={ddCum} onChange={(e) => setDdCum(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Remaining (optional)</Label>
                <Input value={ddRem} onChange={(e) => setDdRem(e.target.value)} />
              </div>
              {ddErr ? <p className="text-sm text-destructive sm:col-span-2">{ddErr}</p> : null}
              <Button
                className="sm:col-span-2"
                disabled={addDdMut.isPending || sofClosed}
                onClick={() => {
                  setDdErr(null);
                  addDdMut.mutate();
                }}
              >
                Save discharge row
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {dischargeQ.isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : discharges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rows yet.</p>
              ) : (
                <ul className="space-y-2">
                  {discharges.map((d) => (
                    <DischargeEditor
                      key={d.id}
                      row={d}
                      sofClosed={sofClosed}
                      onSaved={invalidateDischarge}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Reports</h2>
        <MotherVesselReportsPanel
          vesselCall={vesselCall}
          vesselCallId={vesselCallId}
          discharges={discharges as MotherVesselDischargeRow[]}
        />
      </div>
    </div>
  );
}
