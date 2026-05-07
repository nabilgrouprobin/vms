import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SofStatus } from "@/types/vms";

export function SofStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = status as SofStatus;
  if (s === "CLOSED" || s === "APPROVED") {
    return (
      <Badge variant="success" className={cn(className)}>
        {status}
      </Badge>
    );
  }
  if (s === "PENDING_VERIFICATION" || s === "VERIFIED" || s === "DISPUTED") {
    return (
      <Badge variant="warning" className={cn(className)}>
        {status}
      </Badge>
    );
  }
  if (s === "DRAFT") {
    return (
      <Badge variant="secondary" className={cn(className)}>
        {status}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn(className)}>
      {status}
    </Badge>
  );
}
