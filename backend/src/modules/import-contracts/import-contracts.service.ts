import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { UpdateImportContractDto } from "./dto/update-import-contract.dto";

function toDec(v: number | null | undefined): Prisma.Decimal | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  return new Prisma.Decimal(v);
}

@Injectable()
export class ImportContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string) {
    const row = await this.prisma.importContract.findFirst({
      where: { id, deletedAt: null }
    });
    if (!row) {
      throw new NotFoundException("Import contract was not found");
    }
    return row;
  }

  async update(id: string, dto: UpdateImportContractDto) {
    await this.getById(id);

    const data: Prisma.ImportContractUpdateInput = {};

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
      data.dischargeRateMtPerDay = toDec(dto.dischargeRateMtPerDay);
    }
    if (dto.dischargeRateUnit !== undefined) {
      data.dischargeRateUnit = dto.dischargeRateUnit;
    }
    if (dto.laytimeDemurrageRatePerDay !== undefined) {
      data.laytimeDemurrageRatePerDay = toDec(dto.laytimeDemurrageRatePerDay);
    }
    if (dto.laytimeDispatchRatePerDay !== undefined) {
      data.laytimeDispatchRatePerDay = toDec(dto.laytimeDispatchRatePerDay);
    }
    if (dto.currency !== undefined) {
      data.currency = dto.currency;
    }
    if (dto.dischargePort !== undefined) {
      data.dischargePort = dto.dischargePort;
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.importContract.findUniqueOrThrow({ where: { id } });
    }

    return this.prisma.importContract.update({
      where: { id },
      data
    });
  }
}
