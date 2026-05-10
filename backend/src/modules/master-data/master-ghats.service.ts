import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { allocateUniqueCode } from "./master-code.util";
import { CreateMasterGhatDto } from "./dto/create-master-ghat.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterGhatDto } from "./dto/update-master-ghat.dto";
import { decString, toDecimalOrNull } from "./utils/decimal-json";
import {
  getMasterById,
  hardDeleteMasterRecord,
  listMasterPaginated,
  softDeleteMasterRecord,
  throwIfUniqueConflict
} from "./utils/master-crud.helpers";

const ghatSelect = {
  id: true,
  code: true,
  name: true,
  locationId: true,
  unloadingCapacityMtPerDay: true,
  numberOfJetties: true,
  hasWarehouseStorage: true,
  warehouseCapacityMt: true,
  hasTruckScale: true,
  workingStartHour: true,
  workingEndHour: true,
  contactPerson: true,
  contactNo: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  location: { select: { id: true, code: true, name: true, type: true } }
} as const;

type GhatRow = Prisma.GhatGetPayload<{ select: typeof ghatSelect }>;

const GHAT_LABEL = "Ghat";
const GHAT_CONFLICT_MSG = "Another ghat already uses this code.";

function mapGhat(row: GhatRow): GhatRow {
  return {
    ...row,
    unloadingCapacityMtPerDay: decString(row.unloadingCapacityMtPerDay) as never,
    warehouseCapacityMt: decString(row.warehouseCapacityMt) as never
  };
}

@Injectable()
export class MasterGhatsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListMasterReferenceQueryDto) {
    return listMasterPaginated<GhatRow, typeof ghatSelect, Prisma.GhatWhereInput>({
      delegate: this.prisma.ghat,
      query,
      select: ghatSelect,
      mapRow: mapGhat
    });
  }

  getById(id: string) {
    return getMasterById<GhatRow, typeof ghatSelect>({
      delegate: this.prisma.ghat,
      id,
      select: ghatSelect,
      mapRow: mapGhat
    });
  }

  async create(dto: CreateMasterGhatDto) {
    const loc = await this.prisma.location.findFirst({
      where: { id: dto.locationId, deletedAt: null, isActive: true },
      select: { id: true }
    });
    if (!loc) {
      throw new BadRequestException("Location was not found or is inactive.");
    }

    const code = await allocateUniqueCode(
      async (c) =>
        !!(await this.prisma.ghat.findFirst({ where: { code: c }, select: { id: true } })),
      "GHT"
    );

    try {
      const row = await this.prisma.ghat.create({
        data: {
          code,
          name: dto.name.trim(),
          locationId: dto.locationId,
          numberOfJetties: dto.numberOfJetties ?? 1,
          hasWarehouseStorage: dto.hasWarehouseStorage ?? false,
          hasTruckScale: dto.hasTruckScale ?? false,
          workingStartHour: dto.workingStartHour?.trim() || null,
          workingEndHour: dto.workingEndHour?.trim() || null,
          contactPerson: dto.contactPerson?.trim() || null,
          contactNo: dto.contactNo?.trim() || null,
          unloadingCapacityMtPerDay: toDecimalOrNull(dto.unloadingCapacityMtPerDay),
          warehouseCapacityMt: toDecimalOrNull(dto.warehouseCapacityMt)
        },
        select: ghatSelect
      });
      return mapGhat(row);
    } catch (e) {
      throwIfUniqueConflict(e, GHAT_CONFLICT_MSG);
      throw e;
    }
  }

  async update(id: string, dto: UpdateMasterGhatDto) {
    const existing = await this.prisma.ghat.findFirst({ where: { id }, select: { id: true } });
    if (!existing) {
      throw new NotFoundException("Ghat was not found");
    }

    if (dto.locationId) {
      const loc = await this.prisma.location.findFirst({
        where: { id: dto.locationId, deletedAt: null, isActive: true },
        select: { id: true }
      });
      if (!loc) {
        throw new BadRequestException("Location was not found or is inactive.");
      }
    }

    const data: Prisma.GhatUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.locationId !== undefined) data.location = { connect: { id: dto.locationId } };
    if (dto.numberOfJetties !== undefined) data.numberOfJetties = dto.numberOfJetties;
    if (dto.hasWarehouseStorage !== undefined) data.hasWarehouseStorage = dto.hasWarehouseStorage;
    if (dto.hasTruckScale !== undefined) data.hasTruckScale = dto.hasTruckScale;
    if (dto.workingStartHour !== undefined) {
      data.workingStartHour =
        dto.workingStartHour === null || dto.workingStartHour === ""
          ? null
          : dto.workingStartHour.trim();
    }
    if (dto.workingEndHour !== undefined) {
      data.workingEndHour =
        dto.workingEndHour === null || dto.workingEndHour === ""
          ? null
          : dto.workingEndHour.trim();
    }
    if (dto.contactPerson !== undefined) {
      data.contactPerson =
        dto.contactPerson === null || dto.contactPerson === "" ? null : dto.contactPerson.trim();
    }
    if (dto.contactNo !== undefined) {
      data.contactNo =
        dto.contactNo === null || dto.contactNo === "" ? null : dto.contactNo.trim();
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.unloadingCapacityMtPerDay !== undefined) {
      data.unloadingCapacityMtPerDay = toDecimalOrNull(dto.unloadingCapacityMtPerDay);
    }
    if (dto.warehouseCapacityMt !== undefined) {
      data.warehouseCapacityMt = toDecimalOrNull(dto.warehouseCapacityMt);
    }

    if (Object.keys(data).length === 0) {
      return this.getById(id);
    }

    try {
      const row = await this.prisma.ghat.update({ where: { id }, data, select: ghatSelect });
      return mapGhat(row);
    } catch (e) {
      throwIfUniqueConflict(e, GHAT_CONFLICT_MSG);
      throw e;
    }
  }

  softDelete(id: string) {
    return softDeleteMasterRecord({ delegate: this.prisma.ghat, id, label: GHAT_LABEL });
  }

  hardDelete(id: string) {
    return hardDeleteMasterRecord({ delegate: this.prisma.ghat, id, label: GHAT_LABEL });
  }
}
