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
import { CardContent } from "@/components/ui/card";

export type SofLaytimeSetupSidebarCardProps = {
  cargo?: SofLaytimeCargoAllowanceInputProps;
  week?: SofLaytimeWeekWindowInputProps;
};

export function SofLaytimeSetupSidebarCard({ cargo, week }: SofLaytimeSetupSidebarCardProps) {
  if (!cargo && !week) return null;

  return (
    <div className="space-y-0">
      <CardContent className="space-y-0 px-0 pb-0 pt-0">
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
    </div>
  );
}
