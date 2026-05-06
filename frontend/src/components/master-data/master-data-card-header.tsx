import type { ReactNode } from "react";

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MasterDataCardHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-start justify-end gap-2">{actions}</div> : null}
    </CardHeader>
  );
}
