"use client";

import {
  SofLaytimeWeekWindowForm,
  type SofLaytimeWeekWindowInputProps
} from "@/components/sof/sof-laytime-week-window-form";

export type SofLaytimeWeekWindowSidebarCardProps = SofLaytimeWeekWindowInputProps;

export function SofLaytimeWeekWindowSidebarCard(props: SofLaytimeWeekWindowSidebarCardProps) {
  return <SofLaytimeWeekWindowForm {...props} variant="sidebar" />;
}
