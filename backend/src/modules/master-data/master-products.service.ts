import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { allocateUniqueCode } from "./master-code.util";
import { CreateMasterProductDto } from "./dto/create-master-product.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterProductDto } from "./dto/update-master-product.dto";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

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

@Injectable()
export class MasterProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseLimit(raw?: string): number {
    const n = parseInt(raw ?? "", 10);
    if (!Number.isFinite(n) || n < 1) {
      return DEFAULT_LIMIT;
    }
    return Math.min(n, MAX_LIMIT);
  }

  async list(query: ListMasterReferenceQueryDto) {
    const limit = this.parseLimit(query.limit);
    const includeInactive = query.includeInactive === "true";
    const search = query.search?.trim();

    const where: Prisma.ProductWhereInput = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(search
        ? {
            OR: [
              { code: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } }
            ]
          }
        : {})
    };

    const rows = await this.prisma.product.findMany({
      where,
      orderBy: [{ code: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: productSelect
    });

    const nextCursor = rows.length > limit ? rows[limit].id : null;
    return { data: rows.slice(0, limit), nextCursor, limit };
  }

  async getById(id: string) {
    return this.prisma.product.findFirst({ where: { id }, select: productSelect });
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
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new BadRequestException("Another product already uses this code.");
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateMasterProductDto) {
    const existing = await this.prisma.product.findFirst({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException("Product was not found");
    }

    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.type !== undefined) {
      data.type = dto.type;
    }
    if (dto.specification !== undefined) {
      data.specification =
        dto.specification === null || dto.specification === ""
          ? null
          : dto.specification.trim();
    }
    if (dto.hsCode !== undefined) {
      data.hsCode = dto.hsCode === null || dto.hsCode === "" ? null : dto.hsCode.trim();
    }
    if (dto.defaultUom !== undefined) {
      data.defaultUom =
        dto.defaultUom === null || dto.defaultUom === ""
          ? "MT"
          : dto.defaultUom.trim();
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (Object.keys(data).length === 0) {
      return this.getById(id);
    }

    try {
      return await this.prisma.product.update({
        where: { id },
        data,
        select: productSelect
      });
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new BadRequestException("Another product already uses this code.");
      }
      throw e;
    }
  }

  async softDelete(id: string) {
    const existing = await this.prisma.product.findFirst({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException("Product was not found");
    }
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true }
    });
  }
}
