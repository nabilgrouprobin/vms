"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Fixed scroll viewport — outer size never grows with item count; only the inner pane scrolls. */
const scrollViewportClass =
  "flex h-[14.5rem] max-h-[14.5rem] min-h-[14.5rem] w-full shrink-0 flex-col overflow-hidden";

/** Taller viewport for dense tables (reports, etc.) inside the same picker card chrome. */
const panelScrollViewportClass =
  "flex h-[min(70vh,32rem)] max-h-[min(70vh,32rem)] min-h-[16rem] w-full shrink-0 flex-col overflow-hidden";

const tabsListClass = "!grid h-auto w-full grid-cols-2 gap-1 lg:!inline-flex lg:h-10 lg:w-auto";

type Kind = "mother" | "lighter";

function MotherLighterKindTabs({
  value,
  onKindChange
}: {
  value: Kind;
  onKindChange: (next: Kind) => void;
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onKindChange(v === "lighter" ? "lighter" : "mother")}
      className="w-full lg:w-auto lg:shrink-0"
    >
      <TabsList className={tabsListClass}>
        <TabsTrigger value="mother" className="lg:px-6">
          Mother vessel
        </TabsTrigger>
        <TabsTrigger value="lighter" className="lg:px-6">
          Lighter
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function PickerSearchField({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0 flex-1 py-0.5">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        placeholder={placeholder}
        className="h-10 w-full pl-10 pr-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** Search row + optional leading/trailing (e.g. New SOF) — no Mother/Lighter tabs (list pages). */
export function PickerListToolbar({
  search,
  onSearchChange,
  placeholder,
  leading,
  trailing
}: {
  search: string;
  onSearchChange: (v: string) => void;
  placeholder: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
      {leading ? <div className="w-full shrink-0 pt-0.5 lg:w-auto lg:pt-0">{leading}</div> : null}
      <PickerSearchField value={search} onChange={onSearchChange} placeholder={placeholder} />
      {trailing ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 pt-0.5 lg:w-auto lg:pt-0">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

/** Toolbar row: kind tabs + search + optional actions (e.g. New SOF). */
export function MotherLighterPickerToolbar({
  kind,
  onKindChange,
  search,
  onSearchChange,
  placeholderMother,
  placeholderLighter,
  trailing
}: {
  kind: Kind;
  onKindChange: (next: Kind) => void;
  search: string;
  onSearchChange: (v: string) => void;
  placeholderMother: string;
  placeholderLighter: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-4">
      <div className="w-full shrink-0 pt-0.5 lg:w-auto lg:pt-0">
        <MotherLighterKindTabs value={kind} onKindChange={onKindChange} />
      </div>
      <PickerSearchField
        value={search}
        onChange={onSearchChange}
        placeholder={kind === "mother" ? placeholderMother : placeholderLighter}
      />
      {trailing ? (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 pt-0.5 lg:w-auto lg:pt-0">
          {trailing}
        </div>
      ) : null}
    </div>
  );
}

function pickerTileClass(selected?: boolean, disabled?: boolean) {
  return cn(
    "flex h-[4.75rem] w-full flex-col justify-center rounded-lg border bg-card px-2.5 py-2 text-left shadow-sm transition-colors",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    disabled && "cursor-not-allowed opacity-50",
    selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:bg-muted/60"
  );
}

/**
 * Fixed-height tile: title + details. Use `href` for navigation (e.g. trip detail); otherwise `onClick`.
 */
export function SelectablePickerCard({
  title,
  details,
  selected,
  disabled,
  onClick,
  href
}: {
  title: string;
  details: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const body = (
    <>
      <span className="line-clamp-1 text-sm font-medium leading-tight">{title}</span>
      <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
        {details}
      </span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} prefetch className={pickerTileClass(selected, false)}>
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(pickerTileClass(selected, !!disabled), "disabled:pointer-events-none")}
    >
      {body}
    </button>
  );
}

const pickerGridClass =
  "grid content-start items-start gap-2 [grid-template-columns:repeat(auto-fill,minmax(11.5rem,1fr))]";

export function PickerScrollArea({
  children,
  variant = "tiles"
}: {
  children: ReactNode;
  /** `tiles`: compact height for picker cards. `panel`: larger scroll region for wide tables. */
  variant?: "tiles" | "panel";
}) {
  const outer = variant === "tiles" ? scrollViewportClass : panelScrollViewportClass;
  const inner =
    variant === "tiles"
      ? "min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-2"
      : "min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain p-2";
  return (
    <div className={cn("rounded-md border border-border bg-muted/20", outer)}>
      <div className={inner}>{children}</div>
    </div>
  );
}

export function PickerCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className={pickerGridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[4.75rem] w-full shrink-0 rounded-lg" />
      ))}
    </div>
  );
}

export function PickerCardGrid({ children }: { children: ReactNode }) {
  return <div className={pickerGridClass}>{children}</div>;
}

export function PickerEmptyState({ message }: { message: string }) {
  return <p className="px-1 py-6 text-center text-sm text-muted-foreground">{message}</p>;
}

export function PickerErrorState({ message }: { message: string }) {
  return <p className="px-1 py-2 text-sm text-destructive">{message}</p>;
}

/** Compact row shown after an SOF is chosen (mother/lighter workspace + reports discharge). */
export function SelectedSofChip({
  kind,
  title,
  details,
  changeLabel = "Change SOF",
  onChange
}: {
  kind: "mother" | "lighter";
  title: string;
  details?: string;
  changeLabel?: string;
  onChange: () => void;
}) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Badge variant={kind === "mother" ? "default" : "secondary"} className="shrink-0">
            {kind === "mother" ? "Mother" : "Lighter"}
          </Badge>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{title}</div>
            {details ? (
              <div className="truncate text-xs text-muted-foreground">{details}</div>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onChange}
        >
          {changeLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

/** Shell card wrapping toolbar + optional body + optional footer (e.g. load more). */
export function MotherLighterPickerCard({
  toolbar,
  children,
  footer
}: {
  toolbar: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <CardContent className="flex min-h-0 min-w-0 flex-col gap-4 px-4 pb-4 pt-5 sm:px-5 sm:pb-5 sm:pt-6">
        <div className="shrink-0">{toolbar}</div>
        {children != null ? <div className="min-h-0 min-w-0 shrink-0">{children}</div> : null}
        {footer != null ? <div className="shrink-0 pt-1">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
