"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { LighterSofReportsTable } from "@/components/reports/lighter-sof-reports-table";
import { MotherDischargeReportsTable } from "@/components/reports/mother-discharge-reports-table";
import { VesselSofWorkspaceScaffold } from "@/components/sof/vessel-sof-workspace-scaffold";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MotherLighterPickerCard,
  MotherLighterPickerToolbar,
  PickerScrollArea
} from "@/components/workspace/mother-lighter-picker";
import { reportsWorkspacePath } from "@/lib/workspace-paths";

function ReportsWorkspaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind: "mother" | "lighter" = searchParams.get("kind") === "lighter" ? "lighter" : "mother";
  const view = searchParams.get("view") === "discharge" ? "discharge" : "summary";
  const [search, setSearch] = useState("");

  const setKind = (next: "mother" | "lighter") => {
    router.replace(reportsWorkspacePath(next, { discharge: view === "discharge" }));
  };

  const setView = (next: "summary" | "discharge") => {
    router.replace(reportsWorkspacePath(kind, { discharge: next === "discharge" }));
  };

  return (
    <div className="w-full space-y-6">
      <Tabs
        value={view}
        onValueChange={(v) => setView(v === "discharge" ? "discharge" : "summary")}
        className="w-full space-y-6"
      >
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="summary" className="text-xs sm:text-sm">
            Fleet &amp; SOF summary
          </TabsTrigger>
          <TabsTrigger value="discharge" className="text-xs sm:text-sm">
            Discharge update · cumulative · ghat aging
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-0 space-y-6 outline-none">
          <div className="w-full min-w-0 space-y-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
              <p className="text-sm text-muted-foreground">
                {kind === "mother"
                  ? "Mother vessel discharge and lighter pipeline metrics by SOF."
                  : "Lighter SOF list with the same discharge update grid as mother SOF (mother call + pipeline metrics)."}
              </p>
            </div>

            <MotherLighterPickerCard
              toolbar={
                <MotherLighterPickerToolbar
                  kind={kind}
                  onKindChange={setKind}
                  search={search}
                  onSearchChange={setSearch}
                  placeholderMother="Search mother SOF, call, vessel…"
                  placeholderLighter="Search lighter SOF, trip, lighter…"
                />
              }
            >
              <PickerScrollArea variant="panel">
                {kind === "mother" ? (
                  <MotherDischargeReportsTable search={search} embedded />
                ) : (
                  <LighterSofReportsTable search={search} embedded />
                )}
              </PickerScrollArea>
            </MotherLighterPickerCard>
          </div>
        </TabsContent>

        <TabsContent value="discharge" className="mt-0 space-y-6 outline-none">
          <div className="w-full min-w-0 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Discharge &amp; aging</h1>
            <p className="text-sm text-muted-foreground">
              Daily discharge updates and cumulative balances on{" "}
              <span className="font-medium">mother vessel</span> SOFs; lighter aging at ghat is
              included there and under <span className="font-medium">lighter</span> SOFs
              (mother-call context). Switch Mother / Lighter in the picker below.
            </p>
          </div>
          <VesselSofWorkspaceScaffold section="discharge" reportsLinkBase />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ReportsWorkspace() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <ReportsWorkspaceInner />
    </Suspense>
  );
}
