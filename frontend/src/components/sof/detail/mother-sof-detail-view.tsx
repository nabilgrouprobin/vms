"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

import {
  SofAddEventSheet,
  type SofAddEventCurrentUser,
  type SofAddEventFields
} from "@/components/sof/detail/sof-add-event-sheet";
import { SofDetailHeader } from "@/components/sof/detail/sof-detail-header";
import { SofDetailEventsTab } from "@/components/sof/detail/sof-detail-events-tab";
import { SofDetailLaytimeSheetsStrip } from "@/components/sof/detail/sof-detail-laytime-sheets-strip";
import { SofDetailTabStrip } from "@/components/sof/detail/sof-detail-tab-strip";
import { LaytimeSnapshotToolbar } from "@/components/sof/laytime-snapshot-toolbar";
import { getUserProfile } from "@/lib/auth-storage";

import {
  ImportContractLaytimeForm,
  VesselCallImportContractLinkPanel
} from "@/components/sof/import-contract-laytime-form";
import { MotherCallDischargeSection } from "@/components/sof/mother-call-discharge-section";
import { MotherLaytimeTimesheetTable } from "@/components/sof/mother-laytime-timesheet-table";
import {
  MotherVesselEventsContextPanel,
  MotherVesselOverviewPanel,
  type MotherVesselCallDetail
} from "@/components/sof/mother-vessel-panels";
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
  toDatetimeLocalValue as toLocalDtInput,
  type SofEventInfinitePages
} from "@/lib/sof-event-display";
import {
  DEFAULT_LAYTIME_IANA_ZONE,
  formatGmtOffsetForZone,
  formatIanaZoneSuggestionLabel,
  LAYTIME_TIMEZONE_SUGGESTIONS
} from "@/lib/timezone-gmt";
import { fetchSofEventTypeOptions } from "@/lib/master-data-api";
import { parseApiErr } from "@/lib/parse-api-error";
import { VESSEL_SOF_CLEAR_SELECTION_EVENT } from "@/lib/workspace-paths";
import { patchVesselCall } from "@/lib/vessel-calls-api";
import {
  createMotherSofEvent,
  deleteMotherSof,
  fetchMotherSof,
  fetchMotherSofEvents,
  recalculateMotherLaytime,
  updateMotherSof,
  type LaytimeBreakdown,
  type MotherLaytimeDailyLedger,
  type MotherLaytimeTimesheet
} from "@/lib/sof-api";
import type { VesselSofWorkspaceSection } from "@/components/sof/detail/types";
import type { Paginated, SofEventListItem, SofEventTypeCategoryUi } from "@/types/vms";
import { SOF_STATUS } from "@/types/vms";

type MotherSofDetail = {
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
  vesselCall: MotherVesselCallDetail | null;
  events: Array<{
    id: string;
    eventTypeId: string;
    eventTypeDefinition: { id: string; code: string; name: string; category: SofEventTypeCategoryUi };
    eventTime: string;
    remarks: string | null;
    isHold: boolean;
  }>;
};

export function MotherSofDetailView({
  id,
  listHref = "/mother-sof",
  workspaceSection,
  hideWorkspaceChrome
}: {
  id: string;
  listHref?: string;
  /** When set, only this area is shown (for main-menu workspace pages). */
  workspaceSection?: VesselSofWorkspaceSection;
  /** Hide list back link and use compact header when embedded in workspace picker layout. */
  hideWorkspaceChrome?: boolean;
}) {
  const qc = useQueryClient();

  const sofQ = useQuery({
    queryKey: ["mother-sof", id],
    queryFn: () => fetchMotherSof(id),
    enabled: !!id
  });

  const eventTypesQ = useQuery({
    queryKey: ["sof-event-type-options", "MOTHER_VESSEL"],
    queryFn: () => fetchSofEventTypeOptions("MOTHER_VESSEL"),
    staleTime: 600_000
  });

  const eventsQ = useInfiniteQuery({
    queryKey: ["mother-sof-events", id],
    enabled: !!id,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchMotherSofEvents(id, { limit: 25, cursor: pageParam }),
    getNextPageParam: (last: Paginated<SofEventListItem>) => last.nextCursor ?? undefined
  });

  const sof = sofQ.data as MotherSofDetail | undefined;

  const eventRows = useMemo(
    () => flatSofEventInfinitePages(eventsQ.data as SofEventInfinitePages | undefined),
    [eventsQ.data]
  );

  const latestEventMetrics = useMemo(() => latestSofEventMetrics(eventRows), [eventRows]);

  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("");
  const [layAllowed, setLayAllowed] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);

  useEffect(() => {
    if (sof) {
      setRemarks(sof.remarks ?? "");
      setStatus(sof.status);
      setLayAllowed(sof.laytimeAllowedHours ?? "");
      const z = sof.vesselCall?.laytimeTimeZone;
      setLayTz(z?.trim() ? z : "");
    }
  }, [sof]);

  const patchMut = useMutation({
    mutationFn: () =>
      updateMotherSof(id, {
        remarks: remarks || null,
        status,
        laytimeAllowedHours: layAllowed || null
      }),
    onSuccess: () => {
      setFormErr(null);
      qc.invalidateQueries({ queryKey: ["mother-sof", id] });
      qc.invalidateQueries({ queryKey: ["mother-sof"] });
    },
    onError: (e) => setFormErr(parseApiErr(e))
  });

  const delMut = useMutation({
    mutationFn: () => deleteMotherSof(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mother-sof"] });
      window.location.href = listHref;
    },
    onError: (e) => alert(parseApiErr(e))
  });

  const [evType, setEvType] = useState("");
  const [evTime, setEvTime] = useState("");
  const [evStartTime, setEvStartTime] = useState("");
  const [evRemarks, setEvRemarks] = useState("");
  const [evHoldReason, setEvHoldReason] = useState("");
  const [evErr, setEvErr] = useState<string | null>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);

  const currentUser = useMemo<SofAddEventCurrentUser | null>(() => {
    const p = getUserProfile();
    return p ? { id: p.id, fullName: p.fullName, email: p.email } : null;
  }, []);

  useEffect(() => {
    const list = eventTypesQ.data;
    if (!list?.length) return;
    setEvType((prev) => (prev && list.some((t) => t.id === prev) ? prev : list[0].id));
  }, [eventTypesQ.data]);

  useEffect(() => {
    const onWorkspaceClear = () => setAddEventOpen(false);
    window.addEventListener(VESSEL_SOF_CLEAR_SELECTION_EVENT, onWorkspaceClear);
    return () => window.removeEventListener(VESSEL_SOF_CLEAR_SELECTION_EVENT, onWorkspaceClear);
  }, []);

  const openAddEvent = (prefill?: { startIso?: string | null; endIso?: string | null }) => {
    setEvErr(null);
    setEvHoldReason("");
    if (prefill?.endIso) setEvTime(toLocalDtInput(prefill.endIso));
    if (prefill?.startIso !== undefined) {
      setEvStartTime(prefill.startIso ? toLocalDtInput(prefill.startIso) : "");
    } else {
      // Default the new event's start to the most recent event's end so the user
      // sees the natural chain point and can still adjust it before saving.
      const lastEnd = latestEventMetrics?.eventTime ?? null;
      setEvStartTime(lastEnd ? toLocalDtInput(lastEnd) : "");
    }
    setAddEventOpen(true);
  };

  const addEvMut = useMutation({
    mutationFn: () => {
      if (!currentUser?.id) throw new Error("You must be signed in to record events");
      if (!evType) throw new Error("Select an event type");
      if (!evTime) throw new Error("Set the event end time");
      const endMs = new Date(evTime).getTime();
      if (!Number.isFinite(endMs)) throw new Error("Invalid end time");
      let durationMinutes: number | undefined;
      if (evStartTime.trim() !== "") {
        const startMs = new Date(evStartTime).getTime();
        if (!Number.isFinite(startMs)) throw new Error("Invalid start time");
        if (startMs >= endMs) throw new Error("Start time must be before end time");
        durationMinutes = Math.max(1, Math.round((endMs - startMs) / 60_000));
      }
      const selectedType = eventTypesQ.data?.find((t) => t.id === evType) ?? null;
      const isHold = selectedType?.category === "HOLD_DELAY";
      return createMotherSofEvent(id, {
        eventTypeId: evType,
        eventTime: new Date(endMs).toISOString(),
        ...(durationMinutes !== undefined
          ? { durationMinutes, durationHours: null }
          : {}),
        remarks: evRemarks || undefined,
        isHold,
        ...(isHold && evHoldReason.trim() ? { holdReason: evHoldReason.trim() } : {}),
        createdBy: currentUser.id
      });
    },
    onSuccess: () => {
      setEvErr(null);
      setEvRemarks("");
      setEvStartTime("");
      setEvHoldReason("");
      setAddEventOpen(false);
      qc.invalidateQueries({ queryKey: ["mother-sof-events", id] });
      qc.invalidateQueries({ queryKey: ["mother-sof", id] });
    },
    onError: (e) => setEvErr(parseApiErr(e))
  });

  const addEventFields = useMemo<SofAddEventFields>(
    () => ({
      evType,
      setEvType,
      evTime,
      setEvTime,
      evStartTime,
      setEvStartTime,
      evRemarks,
      setEvRemarks,
      evHoldReason,
      setEvHoldReason,
      evErr
    }),
    [evType, evTime, evStartTime, evRemarks, evHoldReason, evErr]
  );

  const [layRecalc, setLayRecalc] = useState<{
    breakdown: LaytimeBreakdown;
    timesheet: MotherLaytimeTimesheet;
    dailyLedger: MotherLaytimeDailyLedger;
  } | null>(null);

  const [layTz, setLayTz] = useState("");
  const layTzDatalistId = useId();
  const layTzPreviewIana = layTz.trim() || DEFAULT_LAYTIME_IANA_ZONE;
  const layTzGmtPreview = useMemo(
    () => formatGmtOffsetForZone(layTzPreviewIana),
    [layTzPreviewIana]
  );

  const patchVcLayTzMut = useMutation({
    mutationFn: async () => {
      if (!sof?.vesselCall?.id) throw new Error("No vessel call");
      return patchVesselCall(sof.vesselCall.id, {
        laytimeTimeZone: layTz.trim() || null
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["mother-sof", id] });
    },
    onError: (e) => alert(parseApiErr(e))
  });

  const layRecalcMut = useMutation({
    mutationFn: () => recalculateMotherLaytime(id),
    onSuccess: (res) => {
      setLayRecalc({
        breakdown: res.breakdown,
        timesheet: res.timesheet,
        dailyLedger: res.dailyLedger
      });
      void qc.invalidateQueries({ queryKey: ["mother-sof", id] });
    },
    onError: (e) => alert(parseApiErr(e))
  });

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
          SOF not found or API error.
          <Button variant="link" asChild className="ml-2 p-0 h-auto">
            <Link href={listHref}>Back to list</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const header = (
    <SofDetailHeader
      listHref={listHref}
      hideWorkspaceChrome={hideWorkspaceChrome}
      title={sof.sofNo}
      subtitle={`${sof.vesselCall?.vessel.name ?? "—"} · ${sof.vesselCall?.callNo ?? "—"}`}
      status={sof.status}
    />
  );

  const addEventSheet = (
    <SofAddEventSheet
      open={addEventOpen}
      onOpenChange={setAddEventOpen}
      description="Log a new event for this SOF. The event is recorded under your signed-in account."
      fields={addEventFields}
      currentUser={currentUser}
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
        !currentUser?.id ||
        !evType ||
        !evTime ||
        eventTypesQ.isLoading ||
        (eventTypesQ.data?.length ?? 0) === 0
      }
    />
  );

  const eventsTab = (
    <SofDetailEventsTab
      contextPanel={
        <MotherVesselEventsContextPanel
          vesselCall={sof.vesselCall}
          laytimeBalanceHours={sof.laytimeBalanceHours}
          latestEvent={latestEventMetrics}
          compact
        />
      }
      addEventDisabled={sof.status === "CLOSED"}
      onAddEvent={(prefill) => openAddEvent(prefill)}
      events={eventRows as SofEventListItem[]}
      eventTypeOptions={eventTypesQ.data ?? []}
      readOnly={sof.status === "CLOSED"}
      eventsQueryKey={["mother-sof-events", id]}
      eventsCsvBasename={`${sof.sofNo}-events`}
      onEventsChanged={() => {
        void qc.invalidateQueries({ queryKey: ["mother-sof", id] });
      }}
      pagination={{
        hasNextPage: eventsQ.hasNextPage,
        isFetchingNextPage: eventsQ.isFetchingNextPage,
        fetchNextPage: () => eventsQ.fetchNextPage()
      }}
    />
  );

  const laytimeSheetsStrip = (
    <SofDetailLaytimeSheetsStrip
      heading="Laytime sheets"
      idleHint="Recalculate to load the daily sheet and events."
      breakdown={layRecalc?.breakdown}
      recalculateDisabled={layRecalcMut.isPending || sof.status === "CLOSED"}
      recalculatePending={layRecalcMut.isPending}
      onRecalculate={() => layRecalcMut.mutate()}
    />
  );

  if (workspaceSection) {
    return (
      <div className="space-y-6">
        {header}

        {workspaceSection === "overview" ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Edit SOF</CardTitle>
                  <CardDescription className="text-xs">
                    Status, laytime allowance, and remarks. Closed SOF cannot be edited on the
                    backend.
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
                      <Label>Laytime allowed</Label>
                      <Input value={layAllowed} onChange={(e) => setLayAllowed(e.target.value)} />
                      {layAllowed.trim() ? (
                        <p className="text-[11px] text-muted-foreground">
                          ≈ {formatDecimalHoursToHMin(layAllowed)} (display)
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <Label>Remarks</Label>
                      <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Started {formatDt(sof.startedAt)} · Completed {formatDt(sof.completedAt)}
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
                        if (
                          confirm(
                            "Delete this SOF? Events and hourly rows must be removed first on the server."
                          )
                        ) {
                          delMut.mutate();
                        }
                      }}
                    >
                      Delete SOF
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <MotherVesselOverviewPanel vesselCall={sof.vesselCall} />
            </div>
          </div>
        ) : null}

        {workspaceSection === "discharge" ? (
          <MotherCallDischargeSection
            motherSofId={id}
            vesselCall={sof.vesselCall}
            vesselCallId={sof.vesselCall?.id}
            motherSofStatus={sof.status}
          />
        ) : null}

        {workspaceSection === "events" ? eventsTab : null}

        {workspaceSection === "laytime" ? (
          <div className="space-y-3">
            {!sof.vesselCall?.id ? (
              <Card>
                <CardContent className="py-4 text-sm text-muted-foreground">
                  No vessel call is linked; contract and laytime tools need a call on this SOF.
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
                <div className="order-1 min-w-0 flex-1 space-y-2 xl:order-2">
                  {laytimeSheetsStrip}
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
                          variant="mother"
                          sofId={id}
                          readOnly={sof.status === "CLOSED"}
                          snapshot={laytimeSnapshot}
                          detailQueryKey={["mother-sof", id]}
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
                  {sof.vesselCall.importContract?.id ? (
                    <Card className="shadow-sm xl:shadow-none">
                      <CardHeader className="space-y-1 px-3 py-2 pb-0">
                        <CardTitle className="text-sm font-semibold">Contract &amp; week</CardTitle>
                        <CardDescription className="text-[10px] leading-snug line-clamp-2">
                          Save here before recalculate. Terms from linked import contract.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-2">
                        <ImportContractLaytimeForm
                          contractId={sof.vesselCall.importContract.id}
                          embedded
                          embeddedCompact
                          readOnly={sof.status === "CLOSED"}
                          vesselCallId={sof.vesselCall.id}
                          vesselCallApproxTotalWeightTon={sof.vesselCall.approxTotalWeightTon}
                          onSaved={() =>
                            void qc.invalidateQueries({ queryKey: ["mother-sof", id] })
                          }
                          onUnlinked={() =>
                            void qc.invalidateQueries({ queryKey: ["mother-sof", id] })
                          }
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <VesselCallImportContractLinkPanel
                      vesselCallId={sof.vesselCall.id}
                      readOnly={sof.status === "CLOSED"}
                      onLinked={() => void qc.invalidateQueries({ queryKey: ["mother-sof", id] })}
                    />
                  )}
                  <Card className="shadow-sm xl:shadow-none">
                    <CardHeader className="space-y-0 px-3 py-2 pb-0">
                      <CardTitle className="text-sm font-semibold">Calendar zone</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 px-3 pb-3 pt-2 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1 space-y-1">
                        <Label htmlFor="lay-tz" className="text-xs">
                          IANA time zone (GMT shown for reference)
                        </Label>
                        <Input
                          id="lay-tz"
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
                                <span className="font-mono text-foreground">
                                  {layTzPreviewIana}
                                </span>{" "}
                                —{" "}
                                <span className="font-medium text-foreground">
                                  {layTzGmtPreview}
                                </span>{" "}
                                now (DST can shift this).
                              </>
                            ) : (
                              <>
                                Blank uses backend default{" "}
                                <span className="font-mono text-foreground">
                                  {DEFAULT_LAYTIME_IANA_ZONE}
                                </span>{" "}
                                —{" "}
                                <span className="font-medium text-foreground">
                                  {layTzGmtPreview}
                                </span>{" "}
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
          </div>
        ) : null}
        {addEventSheet}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}

      <Tabs defaultValue="overview" className="w-full">
        <SofDetailTabStrip variant="mother" />

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Edit SOF</CardTitle>
              <CardDescription className="text-xs">
                Status, laytime allowance, and remarks. Closed SOF cannot be edited on the backend.
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
                  <Label>Laytime allowed</Label>
                  <Input value={layAllowed} onChange={(e) => setLayAllowed(e.target.value)} />
                  {layAllowed.trim() ? (
                    <p className="text-[11px] text-muted-foreground">
                      ≈ {formatDecimalHoursToHMin(layAllowed)} (display)
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label>Remarks</Label>
                  <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Started {formatDt(sof.startedAt)} · Completed {formatDt(sof.completedAt)}
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
                    if (
                      confirm(
                        "Delete this SOF? Events and hourly rows must be removed first on the server."
                      )
                    ) {
                      delMut.mutate();
                    }
                  }}
                >
                  Delete SOF
                </Button>
              </div>
            </CardContent>
          </Card>

          <MotherVesselOverviewPanel vesselCall={sof.vesselCall} />
        </TabsContent>

        <TabsContent value="events" className="space-y-3">
          {eventsTab}
        </TabsContent>

        <TabsContent value="discharge" className="space-y-4">
          <MotherCallDischargeSection
            motherSofId={id}
            vesselCall={sof.vesselCall}
            vesselCallId={sof.vesselCall?.id}
            motherSofStatus={sof.status}
          />
        </TabsContent>

        <TabsContent value="laytime" className="space-y-3">
          {!sof.vesselCall?.id ? (
            <Card>
              <CardContent className="py-4 text-sm text-muted-foreground">
                No vessel call is linked; contract and laytime tools need a call on this SOF.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
              {/* Main: sheets first on mobile; widest column on desktop (right) */}
              <div className="order-1 min-w-0 flex-1 space-y-2 xl:order-2">
                {laytimeSheetsStrip}

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
                        variant="mother"
                        sofId={id}
                        readOnly={sof.status === "CLOSED"}
                        snapshot={laytimeSnapshot}
                        detailQueryKey={["mother-sof", id]}
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

              {/* Setup: below sheets on mobile; narrow left rail on xl */}
              <aside className="order-2 space-y-2 xl:order-1 xl:w-[min(17rem,26vw)] xl:shrink-0 xl:rounded-lg xl:border xl:border-border xl:bg-muted/15 xl:p-2 xl:sticky xl:top-3 xl:self-start xl:max-h-[calc(100dvh-5rem)] xl:overflow-y-auto">
                {sof.vesselCall.importContract?.id ? (
                  <Card className="shadow-sm xl:shadow-none">
                    <CardHeader className="space-y-1 px-3 py-2 pb-0">
                      <CardTitle className="text-sm font-semibold">Contract &amp; week</CardTitle>
                      <CardDescription className="text-[10px] leading-snug line-clamp-2">
                        Save here before recalculate. Terms from linked import contract.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-3 pb-3 pt-2">
                      <ImportContractLaytimeForm
                        contractId={sof.vesselCall.importContract.id}
                        embedded
                        embeddedCompact
                        readOnly={sof.status === "CLOSED"}
                        vesselCallId={sof.vesselCall.id}
                        vesselCallApproxTotalWeightTon={sof.vesselCall.approxTotalWeightTon}
                        onSaved={() => void qc.invalidateQueries({ queryKey: ["mother-sof", id] })}
                        onUnlinked={() =>
                          void qc.invalidateQueries({ queryKey: ["mother-sof", id] })
                        }
                      />
                    </CardContent>
                  </Card>
                ) : (
                  <VesselCallImportContractLinkPanel
                    vesselCallId={sof.vesselCall.id}
                    readOnly={sof.status === "CLOSED"}
                    onLinked={() => void qc.invalidateQueries({ queryKey: ["mother-sof", id] })}
                  />
                )}

                <Card className="shadow-sm xl:shadow-none">
                  <CardHeader className="space-y-0 px-3 py-2 pb-0">
                    <CardTitle className="text-sm font-semibold">Calendar zone</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 px-3 pb-3 pt-2 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Label htmlFor="lay-tz" className="text-xs">
                        IANA time zone (GMT shown for reference)
                      </Label>
                      <Input
                        id="lay-tz"
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
                              now (DST can shift this).
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
      </Tabs>
      {addEventSheet}
    </div>
  );
}
