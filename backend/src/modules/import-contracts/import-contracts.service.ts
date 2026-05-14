import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { toDecimalOrNull } from "../../lib/decimal-json";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateImportContractDto } from "./dto/update-import-contract.dto";

// Only laytime + display columns leave the API. Commercial fields (price,
// total qty, supplier, approvals) stay server-side; SOF viewers must not see
// them just because they can read the contract id.
const importContractSelect = {
  id: true,
  contractNo: true,
  excludedDays: true,
  holidaysExcluded: true,
  excludedTimePeriod: true,
  dischargeRateMtPerDay: true,
  dischargeRateUnit: true,
  laytimeDemurrageRatePerDay: true,
  laytimeDispatchRatePerDay: true,
  laytimeCountingFraction: true,
  workableHatches: true,
  totalHatches: true,
  currency: true,
  dischargePort: true,
  lcEstablishByDate: true,
  contractDate: true
} as const;

@Injectable()
export class ImportContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const row = await this.prisma.importContract.findFirst({
      where: { id, deletedAt: null },
      select: importContractSelect as unknown as Prisma.ImportContractSelect
    });
    if (!row) {
      throw new NotFoundException("Import contract was not found");
    }
    return row;
  }

  async update(id: string, dto: UpdateImportContractDto) {
    await this.getById(id);

    const data: Record<string, unknown> = {};

    if (dto.excludedDays !== undefined) {
      data.excludedDays = dto.excludedDays;
    }
    if (dto.holidaysExcluded !== undefined) {
      data.holidaysExcluded = dto.holidaysExcluded;
    }
    if (dto.excludedTimePeriod !== undefined) {
      data.excludedTimePeriod = dto.excludedTimePeriod;
    }
    if (dto.dischargeRateMtPerDay !== undefined) {
      data.dischargeRateMtPerDay = toDecimalOrNull(dto.dischargeRateMtPerDay);
    }
    if (dto.dischargeRateUnit !== undefined) {
      data.dischargeRateUnit = dto.dischargeRateUnit;
    }
    if (dto.laytimeDemurrageRatePerDay !== undefined) {
      data.laytimeDemurrageRatePerDay = toDecimalOrNull(dto.laytimeDemurrageRatePerDay);
    }
    if (dto.laytimeDispatchRatePerDay !== undefined) {
      data.laytimeDispatchRatePerDay = toDecimalOrNull(dto.laytimeDispatchRatePerDay);
    }
    if (dto.laytimeCountingFraction !== undefined) {
      data.laytimeCountingFraction = toDecimalOrNull(dto.laytimeCountingFraction);
    }
    if (dto.workableHatches !== undefined) {
      data.workableHatches = dto.workableHatches;
    }
    if (dto.totalHatches !== undefined) {
      data.totalHatches = dto.totalHatches;
    }
    if (dto.currency !== undefined) {
      data.currency = dto.currency;
    }
    if (dto.dischargePort !== undefined) {
      data.dischargePort = dto.dischargePort;
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.importContract.findUniqueOrThrow({
        where: { id },
        select: importContractSelect as unknown as Prisma.ImportContractSelect
      });
    }

    return this.prisma.importContract.update({
      where: { id },
      data: data as Prisma.ImportContractUpdateInput,
      select: importContractSelect as unknown as Prisma.ImportContractSelect
    });
  }
}
