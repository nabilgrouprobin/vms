"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { createLighterSof, createMotherSof } from "@/lib/sof-api";
import type { SofOptions } from "@/types/vms";
import { SOF_STATUS } from "@/types/vms";

function motherCallRows(data: SofOptions | undefined, filter: string): OptionRow[] {
  const calls = data?.vesselCalls ?? [];
  const q = filter.trim().toLowerCase();
  return calls
    .filter((c) => {
      if (!q) return true;
      return (
        c.callNo.toLowerCase().includes(q) ||
        c.vessel.name.toLowerCase().includes(q) ||
        (c.statementOfFacts?.sofNo.toLowerCase().includes(q) ?? false)
      );
    })
    .map((c) => ({
      id: c.id,
      label: `${c.callNo} · ${c.vessel.name}`,
      description: c.statementOfFacts
        ? `Already has ${c.statementOfFacts.sofNo}`
        : "No SOF yet — eligible"
    }));
}

function lighterTripRows(data: SofOptions | undefined, filter: string): OptionRow[] {
  const trips = data?.lighterTrips ?? [];
  const q = filter.trim().toLowerCase();
  return trips
    .filter((t) => {
      if (!q) return true;
      return (
        t.tripNo.toLowerCase().includes(q) ||
        t.lighterVessel.name.toLowerCase().includes(q) ||
        t.vesselCall.callNo.toLowerCase().includes(q)
      );
    })
    .map((t) => ({
      id: t.id,
      label: `${t.tripNo} · ${t.lighterVessel.name}`,
      description: t.statementOfFacts ? `Has ${t.statementOfFacts.sofNo}` : "No SOF — eligible"
    }));
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

  useEffect(() => {
    if (variant !== "lighter") return;
    const fromUrl = searchParams.get("trip");
    if (fromUrl) {
      setSelectedId((prev) => prev ?? fromUrl);
    }
  }, [searchParams, variant]);

  const rows: OptionRow[] = useMemo(
    () =>
      variant === "mother"
        ? motherCallRows(optionsQ.data, filter)
        : lighterTripRows(optionsQ.data, filter),
    [optionsQ.data, filter, variant]
  );

  const copy =
    variant === "mother"
      ? {
          backHref: "/mother-sof",
          pageTitle: "New mother vessel SOF",
          pageDescription: "Choose a mother vessel call. Calls that already have a SOF are marked.",
          cardTitle: "Vessel call",
          cardDescription: "Large lists use virtualized rows for smooth scrolling.",
          findLabel: "Find call",
          findPlaceholder: "Filter by call no. or vessel…",
          emptyHint: "No vessel calls or still loading…",
          selectError: "Select a vessel call",
          invalidateKey: "mother-sof" as const,
          listHref: "/mother-sof",
          detailHref: (id: string) => `/mother-sof/${id}`
        }
      : {
          backHref: "/lighter-sof",
          pageTitle: "New lighter vessel SOF",
          pageDescription:
            "Pick an active lighter trip for this call. Rows that already have a lighter SOF are labeled.",
          cardTitle: "Lighter trip",
          cardDescription: "Virtualized list for trips returned by the API.",
          findLabel: "Find trip",
          findPlaceholder: "Trip no., lighter, mother call…",
          emptyHint: "No lighter trips available for this vessel call in API options.",
          selectError: "Select a lighter trip",
          invalidateKey: "lighter-sof" as const,
          listHref: "/lighter-sof",
          detailHref: (id: string) => `/lighter-sof/${id}`
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
      if (d?.id) router.push(copy.detailHref(d.id));
      else router.push(copy.listHref);
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
