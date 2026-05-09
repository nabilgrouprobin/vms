"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { VirtualOptionPicker, type OptionRow } from "@/components/sof/virtual-option-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSofOptionsQuery } from "@/hooks/use-sof-options";
import { parseApiErr } from "@/lib/parse-api-error";
import { createLighterSof, createMotherSof, fetchLighterSofs, fetchMotherSofs } from "@/lib/sof-api";
import { vesselSofWorkspacePath } from "@/lib/workspace-paths";
import type { SofOptions } from "@/types/vms";
import { SOF_STATUS } from "@/types/vms";

function matchAvailabilityFilter(inUse: boolean, q: string): boolean {
  if (!q) return true;
  const isFreeQuery = ["free", "available", "eligible", "no sof"].some((k) => q.includes(k));
  const isUsedQuery = ["used", "in use", "occupied", "busy", "has sof", "already"].some((k) =>
    q.includes(k)
  );
  if (isFreeQuery && !isUsedQuery) return !inUse;
  if (isUsedQuery && !isFreeQuery) return inUse;
  return true;
}

function motherCallRows(
  data: SofOptions | undefined,
  filter: string,
  inUseByVesselCallId: Map<string, boolean>
): OptionRow[] {
  const calls = data?.vesselCalls ?? [];
  const q = filter.trim().toLowerCase();
  return calls
    .filter((c) => {
      const inUse = inUseByVesselCallId.get(c.id) ?? false;
      if (!matchAvailabilityFilter(inUse, q)) return false;
      if (!q) return true;
      return (
        c.callNo.toLowerCase().includes(q) ||
        c.vessel.name.toLowerCase().includes(q) ||
        (c.statementOfFacts?.sofNo.toLowerCase().includes(q) ?? false)
      );
    })
    .map((c) => {
      const inUse = inUseByVesselCallId.get(c.id) ?? false;
      return {
        id: c.id,
        label: `${c.callNo} · ${c.vessel.name}`,
        availability: inUse ? "used" : "free",
        description: c.statementOfFacts
          ? inUse
            ? `SOF ${c.statementOfFacts.sofNo} has events`
            : `SOF ${c.statementOfFacts.sofNo} has no events — still free`
          : "No SOF yet — eligible"
      };
    });
}

function lighterTripRows(
  data: SofOptions | undefined,
  filter: string,
  inUseByLighterTripId: Map<string, boolean>
): OptionRow[] {
  const trips = data?.lighterTrips ?? [];
  const q = filter.trim().toLowerCase();
  return trips
    .filter((t) => {
      const inUse = inUseByLighterTripId.get(t.id) ?? false;
      if (!matchAvailabilityFilter(inUse, q)) return false;
      if (!q) return true;
      return (
        t.tripNo.toLowerCase().includes(q) ||
        t.lighterVessel.name.toLowerCase().includes(q) ||
        t.vesselCall.callNo.toLowerCase().includes(q)
      );
    })
    .map((t) => {
      const inUse = inUseByLighterTripId.get(t.id) ?? false;
      return {
        id: t.id,
        label: `${t.tripNo} · ${t.lighterVessel.name}`,
        availability: inUse ? "used" : "free",
        description: t.statementOfFacts
          ? inUse
            ? `SOF ${t.statementOfFacts.sofNo} has events`
            : `SOF ${t.statementOfFacts.sofNo} has no events — still free`
          : "No SOF — eligible"
      };
    });
}

export function NewVesselSofPage({ variant }: { variant: "mother" | "lighter" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState<string>("DRAFT");
  const [layAllowed, setLayAllowed] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const optionsQ = useSofOptionsQuery();
  const motherSofsQ = useQuery({
    queryKey: ["mother-sof", "availability-events"],
    queryFn: () => fetchMotherSofs({ limit: 200 }),
    staleTime: 60_000
  });
  const lighterSofsQ = useQuery({
    queryKey: ["lighter-sof", "availability-events"],
    queryFn: () => fetchLighterSofs({ limit: 200 }),
    staleTime: 60_000
  });

  useEffect(() => {
    if (variant !== "lighter") return;
    const fromUrl = searchParams.get("trip");
    if (fromUrl) {
      setSelectedId((prev) => prev ?? fromUrl);
    }
  }, [searchParams, variant]);

  const motherInUseByVesselCallId = useMemo(() => {
    const out = new Map<string, boolean>();
    for (const row of motherSofsQ.data?.data ?? []) {
      const callId = row.vesselCall?.id;
      if (!callId) continue;
      const hasEvents = (row._count?.events ?? 0) > 0;
      if (hasEvents) out.set(callId, true);
      else if (!out.has(callId)) out.set(callId, false);
    }
    return out;
  }, [motherSofsQ.data]);

  const lighterInUseByTripId = useMemo(() => {
    const out = new Map<string, boolean>();
    for (const row of lighterSofsQ.data?.data ?? []) {
      const tripId = row.lighterTrip?.id;
      if (!tripId) continue;
      const hasEvents = (row._count?.events ?? 0) > 0;
      if (hasEvents) out.set(tripId, true);
      else if (!out.has(tripId)) out.set(tripId, false);
    }
    return out;
  }, [lighterSofsQ.data]);

  const rows: OptionRow[] = useMemo(
    () =>
      variant === "mother"
        ? motherCallRows(optionsQ.data, filter, motherInUseByVesselCallId)
        : lighterTripRows(optionsQ.data, filter, lighterInUseByTripId),
    [optionsQ.data, filter, variant, motherInUseByVesselCallId, lighterInUseByTripId]
  );
  const lighterTripToVesselId = useMemo(() => {
    const out = new Map<string, string>();
    for (const t of optionsQ.data?.lighterTrips ?? []) out.set(t.id, t.lighterVessel.id);
    return out;
  }, [optionsQ.data]);

  const copy =
    variant === "mother"
      ? {
          backHref: vesselSofWorkspacePath("overview", "mother"),
          pageTitle: "New mother vessel SOF",
          pageDescription: "Choose a mother vessel call. Calls that already have a SOF are marked.",
          cardTitle: "Vessel call",
          cardDescription: "Large lists use virtualized rows for smooth scrolling.",
          findLabel: "Find call",
          findPlaceholder: "Filter by call no. or vessel…",
          emptyHint: "No vessel calls or still loading…",
          selectError: "Select a vessel call",
          invalidateKey: "mother-sof" as const
        }
      : {
          backHref: vesselSofWorkspacePath("overview", "lighter"),
          pageTitle: "New lighter vessel SOF",
          pageDescription:
            "Pick an active lighter trip for this call. Rows that already have a lighter SOF are labeled.",
          cardTitle: "Lighter trip",
          cardDescription: "Virtualized list for trips returned by the API.",
          findLabel: "Find trip",
          findPlaceholder: "Trip no., lighter, mother call…",
          emptyHint: "No lighter trips available for this vessel call in API options.",
          selectError: "Select a lighter trip",
          invalidateKey: "lighter-sof" as const
        };

  const mut = useMutation({
    mutationFn: () => {
      if (!selectedId) throw new Error(copy.selectError);
      if (variant === "mother") {
        return createMotherSof({
          vesselCallId: selectedId,
          status,
          laytimeAllowedHours: layAllowed || undefined
        });
      }
      return createLighterSof({
        lighterTripId: selectedId,
        status,
        laytimeAllowedHours: layAllowed || undefined
      });
    },
    onSuccess: (data) => {
      const d = data as { id?: string };
      qc.invalidateQueries({ queryKey: [copy.invalidateKey] });
      if (d?.id) {
        if (variant === "mother") {
          router.push(
            vesselSofWorkspacePath("overview", "mother", { id: d.id, vesselCallId: selectedId })
          );
          return;
        }
        router.push(
          vesselSofWorkspacePath("overview", "lighter", {
            id: d.id,
            lighterVesselId: selectedId ? lighterTripToVesselId.get(selectedId) ?? null : null
          })
        );
        return;
      }
      router.push(vesselSofWorkspacePath("overview", variant));
    },
    onError: (e: unknown) => setErr(parseApiErr(e))
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href={copy.backHref}>← Back</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{copy.pageTitle}</h1>
        <p className="text-sm text-muted-foreground">{copy.pageDescription}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{copy.cardTitle}</CardTitle>
          <CardDescription>{copy.cardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="find">{copy.findLabel}</Label>
            <Input
              id="find"
              placeholder={copy.findPlaceholder}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="overflow-hidden rounded-md border border-border">
            <VirtualOptionPicker
              items={rows}
              selectedId={selectedId}
              onPick={setSelectedId}
              height={280}
              emptyHint={copy.emptyHint}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm"
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
              <Label htmlFor="lay">Laytime allowed (hours)</Label>
              <Input
                id="lay"
                placeholder={variant === "mother" ? "e.g. 120" : "e.g. 72"}
                value={layAllowed}
                onChange={(e) => setLayAllowed(e.target.value)}
              />
            </div>
          </div>

          {err ? (
            <p className="text-sm text-destructive" role="alert">
              {err}
            </p>
          ) : null}

          <Button
            className="w-full"
            disabled={!selectedId || mut.isPending}
            onClick={() => {
              setErr(null);
              mut.mutate();
            }}
          >
            {mut.isPending ? "Creating…" : "Create SOF"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
