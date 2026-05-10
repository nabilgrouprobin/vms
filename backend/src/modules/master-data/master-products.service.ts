import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { allocateUniqueCode } from "./master-code.util";
import { CreateMasterProductDto } from "./dto/create-master-product.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterProductDto } from "./dto/update-master-product.dto";
import {
  getMasterById,
  hardDeleteMasterRecord,
  listMasterPaginated,
  softDeleteMasterRecord,
  throwIfUniqueConflict
} from "./utils/master-crud.helpers";

const productSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  specification: true,
  defaultUom: true,
  hsCode: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} as const;

type ProductRow = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

const PRODUCT_LABEL = "Product";
const PRODUCT_CONFLICT_MSG = "Another product already uses this code.";

@Injectable()
export class MasterProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListMasterReferenceQueryDto) {
    return listMasterPaginated<ProductRow, typeof productSelect, Prisma.ProductWhereInput>({
      delegate: this.prisma.product,
      query,
      select: productSelect
    });
  }

  getById(id: string) {
    return getMasterById<ProductRow, typeof productSelect>({
      delegate: this.prisma.product,
      id,
      select: productSelect
    });
  }

  async create(dto: CreateMasterProductDto) {
    const code = await allocateUniqueCode(
      async (c) =>
        !!(await this.prisma.product.findFirst({ where: { code: c }, select: { id: true } })),
      "PRD"
    );

    try {
      return await this.prisma.product.create({
        data: {
          code,
          name: dto.name.trim(),
          type: dto.type,
          specification: dto.specification?.trim() || null,
          hsCode: dto.hsCode?.trim() || null,
          defaultUom: dto.defaultUom?.trim() || "MT"
        },
        select: productSelect
      });
    } catch (e) {
      throwIfUniqueConflict(e, PRODUCT_CONFLICT_MSG);
      throw e;
    }
  }

  async update(id: string, dto: UpdateMasterProductDto) {
    const existing = await this.prisma.product.findFirst({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException("Product was not found");
    }

    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.specification !== undefined) {
      data.specification =
        dto.specification === null || dto.specification === "" ? null : dto.specification.trim();
    }
    if (dto.hsCode !== undefined) {
      data.hsCode = dto.hsCode === null || dto.hsCode === "" ? null : dto.hsCode.trim();
    }
    if (dto.defaultUom !== undefined) {
      data.defaultUom =
        dto.defaultUom === null || dto.defaultUom === "" ? "MT" : dto.defaultUom.trim();
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    if (Object.keys(data).length === 0) {
      return this.getById(id);
    }

    try {
      return await this.prisma.product.update({ where: { id }, data, select: productSelect });
    } catch (e) {
      throwIfUniqueConflict(e, PRODUCT_CONFLICT_MSG);
      throw e;
    }
  }

  softDelete(id: string) {
    return softDeleteMasterRecord({
      delegate: this.prisma.product,
      id,
      label: PRODUCT_LABEL
    });
  }

  /** Permanent remove — only allowed when inactive and unused. */
  hardDelete(id: string) {
    return hardDeleteMasterRecord({
      delegate: this.prisma.product,
      id,
      label: PRODUCT_LABEL
    });
  }
}
