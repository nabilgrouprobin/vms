import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        secondary: "border-transparent bg-muted text-foreground",
        outline: "text-foreground border-border",
        success:
          "border border-emerald-600/25 bg-emerald-100 text-emerald-950 shadow-sm dark:border-emerald-500/35 dark:bg-emerald-950/55 dark:text-emerald-200 dark:shadow-none",
        warning:
          "border border-amber-600/30 bg-amber-100 text-amber-950 shadow-sm dark:border-amber-500/35 dark:bg-amber-950/55 dark:text-amber-200 dark:shadow-none"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
