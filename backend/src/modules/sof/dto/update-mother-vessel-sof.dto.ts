import { SOFStatus } from "@prisma/client";

export class UpdateMotherVesselSofDto {
  sofNo?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  status?: SOFStatus;
  laytimeAllowedHours?: string | number | null;
  laytimeUsedHours?: string | number | null;
  laytimeExcludedHours?: string | number | null;
  laytimeBalanceHours?: string | number | null;
  /** Snapshot commence instant on the SOF (ISO string or null to clear). */
  laytimeCommenceAt?: string | null;
  demurrageAmount?: string | number | null;
  dispatchAmount?: string | number | null;
  netAmount?: string | number | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  remarks?: string | null;
}
