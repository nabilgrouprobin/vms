"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type SofLaytimeSidebarSectionProps = {
  id: string;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
};

export function SofLaytimeSidebarSection({
  title,
  description,
  defaultOpen = false,
  children,
  className
}: SofLaytimeSidebarSectionProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn(
        "group overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-card to-muted/20 shadow-sm transition-all duration-200 hover:border-border hover:shadow",
        className
      )}
    >
      <CollapsibleTrigger
        type="button"
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground/80 transition-transform duration-300 ease-out group-data-[state=open]:rotate-90"
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-foreground">{title}</span>
          {description ? (
            <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground/90">
              {description}
            </span>
          ) : null}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden border-t border-border/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
        <div className="space-y-2 bg-muted/5 px-3 py-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SofLaytimeSidebarNav({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-col gap-1.5", className)} aria-label="Laytime setup">
      {children}
    </nav>
  );
}
