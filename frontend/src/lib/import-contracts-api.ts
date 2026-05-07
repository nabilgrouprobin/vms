import { api } from "@/lib/api";

export type ImportContractDetail = {
  id: string;
  contractNo: string;
  excludedDays: string[];
  holidaysExcluded: boolean | null;
  excludedTimePeriod: string | null;
  dischargeRateMtPerDay: string | null;
  dischargeRateUnit: string | null;
  laytimeDemurrageRatePerDay: string | null;
  laytimeDispatchRatePerDay: string | null;
  currency: string | null;
  dischargePort: string | null;
  /** ISO date from API when present (commercial / LC workflow). */
  lcEstablishByDate?: string | null;
  contractDate?: string | null;
};

export type UpdateImportContractBody = {
  excludedDays?: string[];
  holidaysExcluded?: boolean | null;
  excludedTimePeriod?: string | null;
  dischargeRateMtPerDay?: number | null;
  dischargeRateUnit?: string | null;
  laytimeDemurrageRatePerDay?: number | null;
  laytimeDispatchRatePerDay?: number | null;
  currency?: string | null;
  dischargePort?: string | null;
};

export function fetchImportContract(id: string) {
  return api<ImportContractDetail>(`/import-contracts/${id}`);
}

export function patchImportContract(id: string, body: UpdateImportContractBody) {
  return api<ImportContractDetail>(`/import-contracts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
}
