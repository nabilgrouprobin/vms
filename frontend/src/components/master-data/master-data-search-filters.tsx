"use client";

import type { ReactNode } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MasterDataSearchFilters({
  idPrefix,
  searchLabel = "Search",
  search,
  onSearchChange,
  placeholder = "Search…",
  includeInactive,
  onIncludeInactiveChange,
  inactiveLabel,
  children
}: {
  idPrefix: string;
  searchLabel?: string;
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  includeInactive: boolean;
  onIncludeInactiveChange: (value: boolean) => void;
  inactiveLabel: string;
  children?: ReactNode;
}) {
  const searchId = `${idPrefix}-search`;
  const inactiveId = `${idPrefix}-inactive`;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor={searchId}>{searchLabel}</Label>
          <Input
            id={searchId}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>
        <div className="flex items-center gap-2 sm:pb-2">
          <Checkbox
            id={inactiveId}
            checked={includeInactive}
            onCheckedChange={(v) => onIncludeInactiveChange(v === true)}
          />
          <Label htmlFor={inactiveId} className="cursor-pointer text-sm font-normal text-muted-foreground">
            {inactiveLabel}
          </Label>
        </div>
      </div>
      {children}
    </div>
  );
}
