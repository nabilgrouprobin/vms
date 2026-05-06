"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

import {
  SofAddEventSheet,
  type SofAddEventFields,
  type SofAddEventUserOption
} from "@/components/sof/detail/sof-add-event-sheet";
import { SofDetailHeader } from "@/components/sof/detail/sof-detail-header";
import { SofDetailEventsTab } from "@/components/sof/detail/sof-detail-events-tab";
import { SofDetailLaytimeSheetsStrip } from "@/components/sof/detail/sof-detail-laytime-sheets-strip";
import { SofDetailTabStrip } from "@/components/sof/detail/sof-detail-tab-strip";
import { useSofOptionsQuery } from "@/hooks/use-sof-options";
import {
  ImportContractLaytimeForm,
  VesselCallImportContractLinkPanel
} from "@/components/sof/import-contract-laytime-form";
import { LaytimeSnapshotToolbar } from "@/components/sof/laytime-snapshot-toolbar";
import {
  LighterSofEventsContextPanel,
  LighterTripOverviewPanel,
  type LighterTripDetail
} from "@/components/sof/lighter-sof-panels";
import { MotherLaytimeTimesheetTable } from "@/components/sof/mother-laytime-timesheet-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { formatDt } from "@/lib/format";
import { formatDecimalHoursToHMin } from "@/lib/laytime-hours-format";
import {
  flatSofEventInfinitePages,
  latestSofEventMetrics,
  type SofEventInfinitePages
} from "@/lib/sof-event-display";
import { fetchSofEventTypeOptions } from "@/lib/master-data-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { patchVesselCall } from "@/lib/vessel-calls-api";
import {
  createLighterSofEvent,
  deleteLighterSof,
  fetchLighterSof,
  fetchLighterSofEvents,
  recalculateLighterLaytime,
  updateLighterSof,
  type LaytimeBreakdown,
  type MotherLaytimeDailyLedger,
  type MotherLaytimeTimesheet
} from "@/lib/sof-api";
import {
  DEFAULT_LAYTIME_IANA_ZONE,
  formatGmtOffsetForZone,
  formatIanaZoneSuggestionLabel,
  LAYTIME_TIMEZONE_SUGGESTIONS
} from "@/lib/timezone-gmt";
import { LighterSofDischargeSection } from "@/components/sof/lighter-sof-discharge-section";
import type { VesselSofWorkspaceSection } from "@/components/sof/detail/types";
import type { Paginated, SofEventListItem } from "@/types/vms";
import { SOF_STATUS } from "@/types/vms";

type LighterSofDetail = {
  id: string;
  sofNo: string;
  status: string;
  remarks: string | null;
  startedAt: string | null;
  completedAt: string | null;
  laytimeAllowedHours: string | null;
  laytimeUsedHours: string | null;
  laytimeExcludedHours: string | null;
  laytimeBalanceHours: string | null;
  laytimeCommenceAt: string | null;
  demurrageAmount: string | null;
  dispatchAmount: string | null;
  netAmount: string | null;
  lighterTrip: LighterTripDetail | null;
  events: Array<{
    id: string;
    eventTypeId: string;
    eventTypeDefinition: { id: string; code: string; name: string };
    eventTime: string;
    remarks: string | null;
    isHold: boolean;
  }>;
};

export function LighterSofDetailView({
  id,
  listHref = "/lighter-sof",
  workspaceSection,
  hideWorkspaceChrome
}: {
  id: string;
  listHref?: string;
  workspaceSection?: VesselSofWorkspaceSection;
  hideWorkspaceChrome?: boolean;
}) {
  const qc = useQueryClient();

  const sofQ = useQuery({
    queryKey: ["lighter-sof", id],
    queryFn: () => fetchLighterSof(id),
    enabled: !!id
  });

  const optionsQ = useSofOptionsQuery();

  const eventTypesQ = useQuery({
    queryKey: ["sof-event-type-options", "LIGHTER_VESSEL"],
    queryFn: () => fetchSofEventTypeOptions("LIGHTER_VESSEL"),
    staleTime: 600_000
  });

  const eventsQ = useInfiniteQuery({
    queryKey: ["lighter-sof-events", id],
    enabled: !!id,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchLighterSofEvents(id, { limit: 25, cursor: pageParam }),
    getNextPageParam: (last: Paginated<SofEventListItem>) => last.nextCursor ?? undefined
  });

  const sof = sofQ.data as LighterSofDetail | undefined;

  const eventRows = useMemo(
    () => flatSofEventInfinitePages(eventsQ.data as SofEventInfinitePages | undefined),
    [eventsQ.data]
  );

  const latestEventMetrics = useMemo(() => latestSofEventMetrics(eventRows), [eventRows]);

  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("");
  const [layAllowed, setLayAllowed] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);

  const [layTz, setLayTz] = useState("");
  const layTzDatalistId = useId();
  const layTzPreviewIana = layTz.trim() || DEFAULT_LAYTIME_IANA_ZONE;
  const layTzGmtPreview = useMemo(
    () => formatGmtOffsetForZone(layTzPreviewIana),
    [layTzPreviewIana]
  );

  useEffect(() => {
    if (sof) {
      setRemarks(sof.remarks ?? "");
      setStatus(sof.status);
      setLayAllowed(sof.laytimeAllowedHours ?? "");
      const z = sof.lighterTrip?.vesselCall?.laytimeTimeZone;
      setLayTz(z?.trim() ? z : "");
    }
  }, [sof]);

  const patchMut = useMutation({
    mutationFn: () =>
      updateLighterSof(id, {
        remarks: remarks || null,
        status,
        laytimeAllowedHours: layAllowed || null
      }),
    onSuccess: () => {
      setFormErr(null);
      qc.invalidateQueries({ queryKey: ["lighter-sof", id] });
      qc.invalidateQueries({ queryKey: ["lighter-sof"] });
    },
    onError: (e) => setFormErr(parseApiErr(e))
  });

  const delMut = useMutation({
    mutationFn: () => deleteLighterSof(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lighter-sof"] });
      window.location.href = listHref;
    },
    onError: (e) => alert(parseApiErr(e))
  });

  const [evType, setEvType] = useState("");
  const [evTime, setEvTime] = useState("");
  const [evDurationMinutes, setEvDurationMinutes] = useState("");
  const [evRemarks, setEvRemarks] = useState("");
  const [evHold, setEvHold] = useState(false);
  const [evUser, setEvUser] = useState("");
  const [evErr, setEvErr] = useState<string | null>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);

  useEffect(() => {
    const list = eventTypesQ.data;
    if (!list?.length) return;
    setEvType((prev) => (prev && list.some((t) => t.id === prev) ? prev : list[0].id));
  }, [eventTypesQ.data]);

  const [layRecalc, setLayRecalc] = useState<{
    breakdown: LaytimeBreakdown;
    timesheet: MotherLaytimeTimesheet;
    dailyLedger: MotherLaytimeDailyLedger;
  } | null>(null);

  const patchVcLayTzMut = useMutation({
    mutationFn: async () => {
      const vcId = sof?.lighterTrip?.vesselCall?.id;
      if (!vcId) throw new Error("No vessel call on trip");
      return patchVesselCall(vcId, {
        laytimeTimeZone: layTz.trim() || null
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["lighter-sof", id] });
    },
    onError: (e) => alert(parseApiErr(e))
  });

  const layRecalcMut = useMutation({
    mutationFn: () => recalculateLighterLaytime(id),
    onSuccess: (res) => {
      setLayRecalc({
        breakdown: res.breakdown,
        timesheet: res.timesheet,
        dailyLedger: res.dailyLedger
      });
      void qc.invalidateQueries({ queryKey: ["lighter-sof", id] });
    },
    onError: (e) => alert(parseApiErr(e))
  });

  const addEvMut = useMutation({
    mutationFn: () => {
      if (!evUser) throw new Error("Select a user (created by)");
      if (!evType) throw new Error("Select an event type");
      const t = evTime ? new Date(evTime).toISOString() : new Date().toISOString();
      const dm = evDurationMinutes.trim();
      if (dm !== "") {
        const n = parseInt(dm, 10);
        if (!Number.isFinite(n) || n <= 0) {
          throw new Error("Duration must be a positive whole number of minutes");
        }
      }
      return createLighterSofEvent(id, {
        eventTypeId: evType,
        eventTime: t,
        ...(dm === "" ? {} : { durationMinutes: parseInt(dm, 10), durationHours: null }),
        remarks: evRemarks || undefined,
        isHold: evHold,
        createdBy: evUser
      });
    },
    onSuccess: () => {
      setEvErr(null);
      setEvRemarks("");
      setEvDurationMinutes("");
      setAddEventOpen(false);
      qc.invalidateQueries({ queryKey: ["lighter-sof-events", id] });
      qc.invalidateQueries({ queryKey: ["lighter-sof", id] });
    },
    onError: (e) => setEvErr(parseApiErr(e))
  });

  const addEventFields = useMemo<SofAddEventFields>(
    () => ({
      evType,
      setEvType,
      evTime,
      setEvTime,
      evDurationMinutes,
      setEvDurationMinutes,
      evRemarks,
      setEvRemarks,
      evHold,
      setEvHold,
      evUser,
      setEvUser,
      evErr
    }),
    [evType, evTime, evDurationMinutes, evRemarks, evHold, evUser, evErr]
  );

  const addEventUsers = useMemo(
    () => (optionsQ.data?.users ?? []) as SofAddEventUserOption[],
    [optionsQ.data?.users]
  );

  const laytimeSnapshot = useMemo(() => {
    if (!sof) return null;
    return {
      laytimeCommenceAt: sof.laytimeCommenceAt,
      laytimeUsedHours: sof.laytimeUsedHours,
      laytimeExcludedHours: sof.laytimeExcludedHours,
      laytimeBalanceHours: sof.laytimeBalanceHours,
      demurrageAmount: sof.demurrageAmount,
      dispatchAmount: sof.dispatchAmount,
      netAmount: sof.netAmount
    };
  }, [sof]);

  if (sofQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (sofQ.isError || !sof) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-destructive">
          Lighter SOF not found or API error.
          <Button variant="link" asChild className="ml-2 h-auto p-0">
            <Link href={listHref}>Back to list</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const vc = sof.lighterTrip?.vesselCall;
  const inWorkspace = Boolean(workspaceSection);

  const header = (
    <SofDetailHeader
      listHref={listHref}
      hideWorkspaceChrome={hideWorkspaceChrome}
      title={sof.sofNo}
      subtitle={
        sof.lighterTrip
          ? `${sof.lighterTrip.lighterVessel.name} · Trip ${sof.lighterTrip.tripNo} · ${sof.lighterTrip.vesselCall.vessel.name} (${sof.lighterTrip.vesselCall.callNo})`
          : "No trip linked"
      }
      status={sof.status}
    />
  );

  const addEventSheet = (
    <SofAddEventSheet
      open={addEventOpen}
      onOpenChange={setAddEventOpen}
      description="Log a new event for this lighter SOF. Choose the user recording it, then save or cancel."
      fields={addEventFields}
      users={addEventUsers}
      eventTypes={eventTypesQ.data ?? []}
      typesLoading={eventTypesQ.isLoading}
      typesError={eventTypesQ.isError ? parseApiErr(eventTypesQ.error) : null}
      manageHref="/master-data/sof-event-types"
      onSave={() => {
        setEvErr(null);
        addEvMut.mutate();
      }}
      isPending={addEvMut.isPending}
      saveDisabled={
        sof.status === "CLOSED" ||
        !evUser ||
        !evType ||
        eventTypesQ.isLoading ||
        (eventTypesQ.data?.length ?? 0) === 0
      }
    />
  );

  return (
    <div className="space-y-6">
      {header}

      <Tabs
        {...(inWorkspace ? { value: workspaceSection! } : { defaultValue: "overview" })}
        className="w-full"
      >
        {!inWorkspace ? <SofDetailTabStrip variant="lighter" /> : null}

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Edit SOF</CardTitle>
              <CardDescription className="text-xs">
                Status, laytime allowance override, and remarks. Trip milestones and contract
                laytime run on the Laytime tab.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {SOF_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Laytime allowed (override)</Label>
                  <Input value={layAllowed} onChange={(e) => setLayAllowed(e.target.value)} />
                  {layAllowed.trim() ? (
                    <p className="text-[11px] text-muted-foreground">
                      ≈ {formatDecimalHoursToHMin(layAllowed)} — used when contract rate / trip
                      cargo cannot derive free time
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label>Remarks</Label>
                  <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Trip status: {sof.lighterTrip?.status} · Started {formatDt(sof.startedAt)} ·
                Completed {formatDt(sof.completedAt)}
              </p>
              {formErr ? <p className="text-sm text-destructive">{formErr}</p> : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setFormErr(null);
                    patchMut.mutate();
                  }}
                  disabled={patchMut.isPending}
                >
                  Save changes
                </Button>
                <Button
                  variant="destructive"
                  type="button"
                  disabled={
                    delMut.isPending || sof.status === "CLOSED" || sof.status === "APPROVED"
                  }
                  onClick={() => {
                    if (confirm("Delete this lighter SOF?")) delMut.mutate();
                  }}
                >
                  Delete SOF
                </Button>
              </div>
            </CardContent>
          </Card>

          <LighterTripOverviewPanel lighterTrip={sof.lighterTrip} />
        </TabsContent>

        <TabsContent value="events" className="space-y-3">
          <SofDetailEventsTab
            contextPanel={
              <LighterSofEventsContextPanel
                lighterTrip={sof.lighterTrip}
                laytimeBalanceHours={sof.laytimeBalanceHours}
                latestEvent={latestEventMetrics}
              />
            }
            addEventDisabled={sof.status === "CLOSED"}
            onAddEvent={() => {
              setEvErr(null);
              setAddEventOpen(true);
            }}
            events={eventRows as SofEventListItem[]}
            eventTypeOptions={eventTypesQ.data ?? []}
            readOnly={sof.status === "CLOSED"}
            eventsQueryKey={["lighter-sof-events", id]}
            eventsCsvBasename={`${sof.sofNo}-events`}
            onEventsChanged={() => {
              void qc.invalidateQueries({ queryKey: ["lighter-sof", id] });
            }}
            pagination={{
              hasNextPage: eventsQ.hasNextPage,
              isFetchingNextPage: eventsQ.isFetchingNextPage,
              fetchNextPage: () => eventsQ.fetchNextPage()
            }}
          />
        </TabsContent>

        <TabsContent value="laytime" className="space-y-3">
          {!vc?.id ? (
            <Card>
              <CardContent className="py-4 text-sm text-muted-foreground">
                No vessel call on the lighter trip; link the trip to a call to use import-contract
                laytime.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
              <div className="order-1 min-w-0 flex-1 space-y-2 xl:order-2">
                <SofDetailLaytimeSheetsStrip
                  heading="Laytime sheets (lighter)"
                  idleHint="Recalculate to load the daily sheet (same engine as mother vessel, using this trip's cargo for discharge-rate time)."
                  breakdown={layRecalc?.breakdown}
                  recalculateDisabled={layRecalcMut.isPending || sof.status === "CLOSED"}
                  recalculatePending={layRecalcMut.isPending}
                  onRecalculate={() => layRecalcMut.mutate()}
                />

                {laytimeSnapshot ? (
                  <Collapsible defaultOpen={false}>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-full justify-between px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <span>Stored snapshot (manual overrides)</span>
                        <ChevronDown className="size-3.5 shrink-0 opacity-70" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-1">
                      <LaytimeSnapshotToolbar
                        variant="lighter"
                        sofId={id}
                        readOnly={sof.status === "CLOSED"}
                        snapshot={laytimeSnapshot}
                        detailQueryKey={["lighter-sof", id]}
                        compact
                      />
                    </CollapsibleContent>
                  </Collapsible>
                ) : null}

                {layRecalc ? (
                  <MotherLaytimeTimesheetTable
                    dailyLedger={layRecalc.dailyLedger}
                    timesheet={layRecalc.timesheet}
                    breakdown={layRecalc.breakdown}
                  />
                ) : null}
              </div>

              <aside className="order-2 space-y-2 xl:order-1 xl:w-[min(17rem,26vw)] xl:shrink-0 xl:rounded-lg xl:border xl:border-border xl:bg-muted/15 xl:p-2 xl:sticky xl:top-3 xl:self-start xl:max-h-[calc(100dvh-5rem)] xl:overflow-y-auto">
                {vc.importContract?.id ? (
                  <Card className="shadow-sm xl:shadow-none">
                    <CardHeader className="space-y-1 px-3 py-2 pb-0">
                      <CardTitle className="text-sm font-semibold">Contract &amp; week</CardTitle>
                      <CardDescription className="text-[10px] leading-snug line-clamp-2">
                        Terms from the mother vessel call’s import contract. Trip cargo quantity
                        drives discharge-rate laytime when filled.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-2">
                      <ImportContractLaytimeForm
                        contractId={vc.importContract.id}
                        embedded
                        embeddedCompact
                        readOnly={sof.status === "CLOSED"}
                        vesselCallId={vc.id}
                        vesselCallApproxTotalWeightTon={vc.approxTotalWeightTon ?? null}
                        onSaved={() => void qc.invalidateQueries({ queryKey: ["lighter-sof", id] })}
                        onUnlinked={() =>
                          void qc.invalidateQueries({ queryKey: ["lighter-sof", id] })
                        }
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <VesselCallImportContractLinkPanel
                    vesselCallId={vc.id}
                    readOnly={sof.status === "CLOSED"}
                    onLinked={() => void qc.invalidateQueries({ queryKey: ["lighter-sof", id] })}
                  />
                )}

                <Card className="shadow-sm xl:shadow-none">
                  <CardHeader className="space-y-0 px-3 py-2 pb-0">
                    <CardTitle className="text-sm font-semibold">Calendar zone</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 px-3 pb-3 pt-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Label htmlFor={`lay-tz-l-${id}`} className="text-xs">
                        IANA time zone (vessel call)
                      </Label>
                      <Input
                        id={`lay-tz-l-${id}`}
                        className="h-8 font-mono text-sm"
                        list={layTzDatalistId}
                        value={layTz}
                        onChange={(e) => setLayTz(e.target.value)}
                        placeholder={DEFAULT_LAYTIME_IANA_ZONE}
                        autoComplete="off"
                        disabled={sof.status === "CLOSED"}
                      />
                      <datalist id={layTzDatalistId}>
                        {LAYTIME_TIMEZONE_SUGGESTIONS.map((z) => (
                          <option key={z} value={z}>
                            {formatIanaZoneSuggestionLabel(z)}
                          </option>
                        ))}
                      </datalist>
                      {layTzGmtPreview ? (
                        <p className="text-[10px] leading-snug text-muted-foreground">
                          {layTz.trim() ? (
                            <>
                              <span className="font-mono text-foreground">{layTzPreviewIana}</span>{" "}
                              —{" "}
                              <span className="font-medium text-foreground">{layTzGmtPreview}</span>{" "}
                              now
                            </>
                          ) : (
                            <>
                              Blank uses backend default{" "}
                              <span className="font-mono text-foreground">
                                {DEFAULT_LAYTIME_IANA_ZONE}
                              </span>{" "}
                              —{" "}
                              <span className="font-medium text-foreground">{layTzGmtPreview}</span>{" "}
                              now.
                            </>
                          )}
                        </p>
                      ) : layTz.trim() ? (
                        <p className="text-[10px] text-destructive">
                          Unknown zone; check the IANA spelling.
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="shrink-0"
                      disabled={sof.status === "CLOSED" || patchVcLayTzMut.isPending}
                      onClick={() => patchVcLayTzMut.mutate()}
                    >
                      Save
                    </Button>
                  </CardContent>
                </Card>
              </aside>
            </div>
          )}
        </TabsContent>

        <TabsContent value="discharge" className="space-y-4">
          <LighterSofDischargeSection
            vesselCallId={vc?.id}
            callNo={vc?.callNo}
            vesselCallDetail={vc ?? null}
          />
        </TabsContent>
      </Tabs>
      {addEventSheet}
    </div>
  );
}
