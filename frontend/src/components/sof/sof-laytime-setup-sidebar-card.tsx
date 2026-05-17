"use client";

import {
  SofLaytimeCargoAllowanceForm,
  type SofLaytimeCargoAllowanceInputProps
} from "@/components/sof/sof-laytime-cargo-allowance-form";
import {
  SofLaytimeWeekWindowForm,
  type LaytimeWeekPayloadGetter,
  type SofLaytimeWeekWindowInputProps
} from "@/components/sof/sof-laytime-week-window-form";

export type { LaytimeWeekPayloadGetter };
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type SofLaytimeSetupSidebarCardProps = {
  cargo?: SofLaytimeCargoAllowanceInputProps;
  week?: SofLaytimeWeekWindowInputProps;
};

export function SofLaytimeSetupSidebarCard({ cargo, week }: SofLaytimeSetupSidebarCardProps) {
  if (!cargo && !week) return null;

  return (
    <Card className="shadow-sm xl:border-0 xl:bg-transparent xl:shadow-none">
      <CardHeader className="space-y-0.5 px-3 py-2.5 pb-0">
        <CardTitle className="text-sm font-semibold">Laytime setup</CardTitle>
        <CardDescription className="text-[10px] leading-snug">
          Allowed time = (partial cargo if set, else total cargo) ÷ discharge rate (MT/day) × 24 h.
          Save to update allowance; the sheet refreshes after the first recalculate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0 px-3 pb-3 pt-2">
        {cargo ? (
          <section className="border-b border-border/80 py-3 first:pt-0">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Cargo &amp; discharge rate
            </p>
            <SofLaytimeCargoAllowanceForm {...cargo} variant="embedded" />
          </section>
        ) : null}
        {week ? (
          <section className={cargo ? "pt-3" : "py-3 first:pt-0"}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Working week
            </p>
            <SofLaytimeWeekWindowForm {...week} variant="embedded" />
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
