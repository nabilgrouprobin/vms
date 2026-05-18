"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatLaytimeReportDurationForInput,
  parseLaytimeReportDuration
} from "@/lib/laytime-summary-calc";
import { parseApiErr } from "@/lib/parse-api-error";
import { toast } from "@/lib/toast";

export type SofLaytimeSummaryParamsCardProps = {
  readOnly: boolean;
  serverSyncToken: string;
  laytimeMinimumAllowedHours: string | null | undefined;
  laytimeGraceHours: string | null | undefined;
  patchSof: (body: Record<string, unknown>) => Promise<unknown>;
  invalidateQueryKeys: unknown[][];
};

export function SofLaytimeSummaryParamsCard({
  readOnly,
  serverSyncToken,
  laytimeMinimumAllowedHours,
  laytimeGraceHours,
  patchSof,
  invalidateQueryKeys
}: SofLaytimeSummaryParamsCardProps) {
  const qc = useQueryClient();
  const [minimum, setMinimum] = useState("");
  const [grace, setGrace] = useState("");

  useEffect(() => {
    setMinimum(formatLaytimeReportDurationForInput(laytimeMinimumAllowedHours));
    setGrace(formatLaytimeReportDurationForInput(laytimeGraceHours));
  }, [serverSyncToken, laytimeMinimumAllowedHours, laytimeGraceHours]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const minH = minimum.trim() ? parseLaytimeReportDuration(minimum) : 0;
      const graceH = grace.trim() ? parseLaytimeReportDuration(grace) : 0;
      if (minimum.trim() && minH === null) {
        throw new Error("Minimum allowed laytime: use format like 0d00:00 or decimal hours.");
      }
      if (grace.trim() && graceH === null) {
        throw new Error("Grace time: use format like 0d00:00 or decimal hours.");
      }
      await patchSof({
        laytimeMinimumAllowedHours: minH && minH > 0 ? minH : null,
        laytimeGraceHours: graceH && graceH > 0 ? graceH : null
      });
    },
    onSuccess: async () => {
      for (const key of invalidateQueryKeys) {
        await qc.invalidateQueries({ queryKey: key });
      }
      toast.success("Laytime summary parameters saved.");
    },
    onError: (e) => toast.error(parseApiErr(e))
  });

  return (
    <div className="space-y-3 text-xs">
      <p className="text-[10px] leading-snug text-muted-foreground">
        Optional. Shown in the laytime summary table below the daily sheet (e.g.{" "}
        <span className="font-mono text-foreground">12d19:30</span>).
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="laytime-min-allowed" className="text-xs">
          Minimum allowed laytime
        </Label>
        <Input
          id="laytime-min-allowed"
          className="h-8 font-mono text-sm"
          placeholder="0d00:00"
          value={minimum}
          onChange={(e) => setMinimum(e.target.value)}
          disabled={readOnly}
          autoComplete="off"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="laytime-grace" className="text-xs">
          Grace time
        </Label>
        <Input
          id="laytime-grace"
          className="h-8 font-mono text-sm"
          placeholder="0d00:00"
          value={grace}
          onChange={(e) => setGrace(e.target.value)}
          disabled={readOnly}
          autoComplete="off"
        />
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        disabled={readOnly || saveMut.isPending}
        onClick={() => saveMut.mutate()}
      >
        {saveMut.isPending ? "Saving…" : "Save summary params"}
      </Button>
    </div>
  );
}
