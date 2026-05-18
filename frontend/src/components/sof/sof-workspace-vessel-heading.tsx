"use client";

import Link from "next/link";

import { SofStatusBadge } from "@/components/sof/sof-status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SofWorkspaceVesselHeadingProps = {
  vesselName: string;
  callNo: string | null | undefined;
  status?: string;
  kind?: "mother" | "lighter";
  lighterTripNo?: string | null;
  /** Single-line header for Events / Laytime workspace. */
  compact?: boolean;
  changeHref?: string;
  onNavigateClick?: () => void;
  className?: string;
};

/** Vessel title for Events and Laytime workspace (not SOF document id). */
export function SofWorkspaceVesselHeading({
  vesselName,
  callNo,
  status,
  kind,
  lighterTripNo,
  compact = false,
  changeHref,
  onNavigateClick,
  className
}: SofWorkspaceVesselHeadingProps) {
  const callLabel = callNo ? `Call ${callNo}` : "No call linked";
  const tripSuffix =
    kind === "lighter" && lighterTripNo ? (
      <span className="font-sans"> · Trip {lighterTripNo}</span>
    ) : null;

  if (compact) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-1",
          className
        )}
      >
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground">
            {vesselName}
          </h1>
          <span className="font-mono text-xs text-muted-foreground">
            {callLabel}
            {tripSuffix}
          </span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {status ? <SofStatusBadge status={status} className="shrink-0" /> : null}
          {changeHref ? (
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link href={changeHref} scroll={false} onClick={() => onNavigateClick?.()}>
                Change Vessel
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-2 border-b border-border/60 pb-2",
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {kind === "lighter" ? "Lighter vessel" : "Mother vessel"}
        </p>
        <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {vesselName}
        </h1>
        <p className="mt-0.5 font-mono text-sm text-muted-foreground">
          {callLabel}
          {tripSuffix}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {status ? <SofStatusBadge status={status} className="shrink-0" /> : null}
        {changeHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={changeHref} scroll={false} onClick={() => onNavigateClick?.()}>
              Change Vessel
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
