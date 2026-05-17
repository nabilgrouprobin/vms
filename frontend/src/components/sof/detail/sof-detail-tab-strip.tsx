"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VesselSofWorkspaceSection } from "./types";

const TAB_TRIGGER_CLASS = "flex-1 sm:flex-none";

const LABELS: Record<VesselSofWorkspaceSection, string> = {
  overview: "Overview",
  events: "Events",
  laytime: "Laytime calculation",
  discharge: "Discharge"
};

/** Full SOF page tab order (mother vs lighter differ only in discharge / laytime order). */
const ORDER: Record<"mother" | "lighter", VesselSofWorkspaceSection[]> = {
  mother: ["overview", "events", "discharge", "laytime"],
  lighter: ["overview", "events", "laytime", "discharge"]
};

export function SofDetailTabStrip({ variant }: { variant: "mother" | "lighter" }) {
  const keys = ORDER[variant];
  return (
    <TabsList
      data-sof-tab-list
      className="flex h-auto w-full flex-wrap justify-start gap-1 p-1 sm:inline-flex sm:h-9 sm:w-auto sm:flex-nowrap"
    >
      {keys.map((value) => (
        <TabsTrigger key={value} value={value} className={TAB_TRIGGER_CLASS}>
          {LABELS[value]}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
