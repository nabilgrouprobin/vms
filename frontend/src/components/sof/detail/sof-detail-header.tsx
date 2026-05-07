"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { SofStatusBadge } from "@/components/sof/sof-status-badge";
import { Button } from "@/components/ui/button";

export function SofDetailHeader({
  listHref,
  hideWorkspaceChrome,
  title,
  subtitle,
  status
}: {
  listHref: string;
  hideWorkspaceChrome?: boolean;
  title: string;
  subtitle: ReactNode;
  status: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {!hideWorkspaceChrome ? (
          <Button variant="ghost" size="sm" asChild className="mb-1 -ml-2 h-8 px-2">
            <Link href={listHref}>← List</Link>
          </Button>
        ) : null}
        <h1
          className={
            hideWorkspaceChrome
              ? "text-lg font-semibold tracking-tight"
              : "text-2xl font-bold tracking-tight"
          }
        >
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <SofStatusBadge status={status} />
    </div>
  );
}
