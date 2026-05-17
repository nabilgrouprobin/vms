"use client";

import {
  SofLaytimeCargoAllowanceForm,
  type SofLaytimeCargoAllowanceInputProps
} from "@/components/sof/sof-laytime-cargo-allowance-form";

export type SofLaytimeCargoSidebarCardProps = SofLaytimeCargoAllowanceInputProps;

export function SofLaytimeCargoSidebarCard(props: SofLaytimeCargoSidebarCardProps) {
  return <SofLaytimeCargoAllowanceForm {...props} variant="sidebar" />;
}
