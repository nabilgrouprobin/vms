"use client";

import type { QueryClient } from "@tanstack/react-query";

import {
  ImportContractLaytimeForm,
  VesselCallImportContractLinkPanel
} from "@/components/sof/import-contract-laytime-form";
import { SofLaytimeSetupSidebarCard } from "@/components/sof/sof-laytime-setup-sidebar-card";
import {
  SofLaytimeSidebarNav,
  SofLaytimeSidebarSection
} from "@/components/sof/sof-laytime-sidebar-nav";
import { SofEventsVesselLaytimeSetupCard } from "@/components/sof/sof-events-vessel-laytime-setup-card";
import { SofLaytimeStatementParamsCard } from "@/components/sof/sof-laytime-statement-params-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMotherSof } from "@/lib/sof-api";
import {
  DEFAULT_LAYTIME_IANA_ZONE,
  formatIanaZoneSuggestionLabel,
  LAYTIME_TIMEZONE_SUGGESTIONS
} from "@/lib/timezone-gmt";
import { cn } from "@/lib/utils";
import type { MotherVesselCallDetail } from "@/components/sof/mother-vessel-panels";

type MotherLaytimeSetupAsideProps = {
  className?: string;
  sofId: string;
  readOnly: boolean;
  vesselCall: MotherVesselCallDetail;
  sofUpdatedAt: string;
  laytimePartialCargoMt: string | null | undefined;
  laytimeHolidays: Parameters<typeof SofLaytimeStatementParamsCard>[0]["laytimeHolidays"];
  cargo: Parameters<typeof SofLaytimeSetupSidebarCard>[0]["cargo"];
  week: Parameters<typeof SofLaytimeSetupSidebarCard>[0]["week"];
  layTz: string;
  setLayTz: (v: string) => void;
  layTzInputId: string;
  layTzDatalistId: string;
  layTzPreviewIana: string;
  layTzGmtPreview: string | null;
  patchVcLayTzPending: boolean;
  onSaveLayTz: () => void;
  qc: QueryClient;
  onNorSaved: () => void;
};

export function MotherLaytimeSetupAside({
  className,
  sofId,
  readOnly,
  vesselCall,
  sofUpdatedAt,
  laytimePartialCargoMt,
  laytimeHolidays,
  cargo,
  week,
  layTz,
  setLayTz,
  layTzInputId,
  layTzDatalistId,
  layTzPreviewIana,
  layTzGmtPreview,
  patchVcLayTzPending,
  onSaveLayTz,
  qc,
  onNorSaved
}: MotherLaytimeSetupAsideProps) {
  const invalidateMother = () => void qc.invalidateQueries({ queryKey: ["mother-sof", sofId] });

  return (
    <aside
      className={cn(
        "order-2 xl:order-1 xl:w-56 xl:shrink-0 xl:sticky xl:top-1 xl:self-start xl:max-h-[calc(100dvh-3.5rem)] xl:overflow-y-auto xl:overflow-x-hidden",
        className
      )}
    >
      <SofLaytimeSidebarNav>
        <SofLaytimeSidebarSection
          id="cargo"
          title="Cargo"
          description="Qty, rate, allowed hours"
          defaultOpen
        >
          <SofLaytimeSetupSidebarCard cargo={cargo} week={week} />
        </SofLaytimeSidebarSection>

        <SofLaytimeSidebarSection
          id="contract"
          title="Contract"
          description="CP demurrage & dispatch"
        >
          {vesselCall.importContract?.id ? (
            <ImportContractLaytimeForm
              contractId={vesselCall.importContract.id}
              embedded
              embeddedCompact
              showCargoFields={false}
              showWeekFields={false}
              readOnly={readOnly}
              vesselCallId={vesselCall.id}
              vesselCallApproxTotalWeightTon={vesselCall.approxTotalWeightTon}
              onSaved={invalidateMother}
              onUnlinked={invalidateMother}
            />
          ) : (
            <VesselCallImportContractLinkPanel
              vesselCallId={vesselCall.id}
              readOnly={readOnly}
              onLinked={invalidateMother}
            />
          )}
        </SofLaytimeSidebarSection>

        <SofLaytimeSidebarSection
          id="nor"
          title="NOR"
          description="Commence time"
        >
          <SofEventsVesselLaytimeSetupCard
            vesselCall={vesselCall}
            readOnly={readOnly}
            invalidateQueryKeys={[["mother-sof", sofId]]}
            showContractLink={false}
            showWeek={false}
            showNor
            onNorSaved={onNorSaved}
          />
        </SofLaytimeSidebarSection>

        <SofLaytimeSidebarSection
          id="holidays"
          title="Holidays"
          description="Excluded days"
        >
          <SofLaytimeStatementParamsCard
            readOnly={readOnly}
            serverSyncToken={sofUpdatedAt}
            laytimePartialCargoMt={laytimePartialCargoMt}
            laytimeHolidays={laytimeHolidays}
            patchSof={(body) => updateMotherSof(sofId, body)}
            invalidateQueryKeys={[["mother-sof", sofId]]}
            showPartialCargo={false}
          />
        </SofLaytimeSidebarSection>

        <SofLaytimeSidebarSection
          id="timezone"
          title="Time zone"
          description="Daily sheet calendar"
        >
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor={layTzInputId} className="text-xs">
                IANA time zone
              </Label>
              <Input
                id={layTzInputId}
                className="h-8 font-mono text-sm"
                list={layTzDatalistId}
                value={layTz}
                onChange={(e) => setLayTz(e.target.value)}
                placeholder={DEFAULT_LAYTIME_IANA_ZONE}
                autoComplete="off"
                disabled={readOnly}
              />
              <datalist id={layTzDatalistId}>
                {LAYTIME_TIMEZONE_SUGGESTIONS.map((z) => (
                  <option key={z} value={z}>
                    {formatIanaZoneSuggestionLabel(z)}
                  </option>
                ))}
              </datalist>
              {layTzGmtPreview ? (
                <p className="text-[10px] leading-snug text-muted-foreground">
                  {layTz.trim() ? (
                    <>
                      <span className="font-mono text-foreground">{layTzPreviewIana}</span> —{" "}
                      <span className="font-medium text-foreground">{layTzGmtPreview}</span> now
                    </>
                  ) : (
                    <>
                      Default{" "}
                      <span className="font-mono text-foreground">{DEFAULT_LAYTIME_IANA_ZONE}</span>{" "}
                      — <span className="font-medium text-foreground">{layTzGmtPreview}</span> now
                    </>
                  )}
                </p>
              ) : layTz.trim() ? (
                <p className="text-[10px] text-destructive">Unknown zone; check spelling.</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={readOnly || patchVcLayTzPending}
              onClick={onSaveLayTz}
            >
              Save zone
            </Button>
          </div>
        </SofLaytimeSidebarSection>
      </SofLaytimeSidebarNav>
    </aside>
  );
}
