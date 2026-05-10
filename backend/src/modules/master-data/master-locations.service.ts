import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { MAX_OPTION_LIST_ROWS } from "../../lib/limits";
import { PrismaService } from "../../prisma/prisma.service";
import { allocateUniqueCode } from "./master-code.util";
import { CreateMasterLocationDto } from "./dto/create-master-location.dto";
import { ListMasterReferenceQueryDto } from "./dto/list-master-reference.query.dto";
import { UpdateMasterLocationDto } from "./dto/update-master-location.dto";
import {
  getMasterById,
  hardDeleteMasterRecord,
  listMasterPaginated,
  softDeleteMasterRecord,
  throwIfUniqueConflict
} from "./utils/master-crud.helpers";

const locationSelect = {
  id: true,
  code: true,
  name: true,
  type: true,
  address: true,
  district: true,
  division: true,
  country: true,
  postalCode: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true
} as const;

type LocationRow = Prisma.LocationGetPayload<{ select: typeof locationSelect }>;

const LOCATION_LABEL = "Location";
const LOCATION_CONFLICT_MSG = "Another location already uses this code for the same type.";

@Injectable()
export class MasterLocationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** For dropdowns (e.g. ghats). */
  listOptions() {
    return this.prisma.location.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ name: "asc" }],
      take: MAX_OPTION_LIST_ROWS,
      select: { id: true, code: true, name: true, type: true }
    });
  }

  list(query: ListMasterReferenceQueryDto) {
    return listMasterPaginated<LocationRow, typeof locationSelect, Prisma.LocationWhereInput>({
      delegate: this.prisma.location,
      query,
      select: locationSelect,
      softDeletable: true
    });
  }

  getById(id: string) {
    return getMasterById<LocationRow, typeof locationSelect>({
      delegate: this.prisma.location,
      id,
      select: locationSelect,
      softDeletable: true
    });
  }

  async create(dto: CreateMasterLocationDto) {
    const code = await allocateUniqueCode(
      async (c) =>
        !!(await this.prisma.location.findFirst({ where: { code: c }, select: { id: true } })),
      "LOC"
    );

    try {
      return await this.prisma.location.create({
        data: {
          code,
          name: dto.name.trim(),
          type: dto.type,
          address: dto.address?.trim() || null,
          district: dto.district?.trim() || null,
          division: dto.division?.trim() || null,
          country: dto.country?.trim() || "Bangladesh",
          postalCode: dto.postalCode?.trim() || null
        },
        select: locationSelect
      });
    } catch (e) {
      throwIfUniqueConflict(e, LOCATION_CONFLICT_MSG);
      throw e;
    }
  }

  async update(id: string, dto: UpdateMasterLocationDto) {
    const existing = await this.prisma.location.findFirst({
      where: { id, deletedAt: null },
      select: { id: true }
    });
    if (!existing) {
      throw new NotFoundException("Location was not found");
    }

    const data: Prisma.LocationUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.address !== undefined) {
      data.address = dto.address === null || dto.address === "" ? null : dto.address.trim();
    }
    if (dto.district !== undefined) {
      data.district = dto.district === null || dto.district === "" ? null : dto.district.trim();
    }
    if (dto.division !== undefined) {
      data.division = dto.division === null || dto.division === "" ? null : dto.division.trim();
    }
    if (dto.country !== undefined) {
      data.country =
        dto.country === null || dto.country === "" ? "Bangladesh" : dto.country.trim();
    }
    if (dto.postalCode !== undefined) {
      data.postalCode =
        dto.postalCode === null || dto.postalCode === "" ? null : dto.postalCode.trim();
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
      if (dto.isActive === true) {
        data.deletedAt = null;
      }
    }

    if (Object.keys(data).length === 0) {
      return this.getById(id);
    }

    try {
      return await this.prisma.location.update({ where: { id }, data, select: locationSelect });
    } catch (e) {
      throwIfUniqueConflict(e, LOCATION_CONFLICT_MSG);
      throw e;
    }
  }

  softDelete(id: string) {
    return softDeleteMasterRecord({
      delegate: this.prisma.location,
      id,
      label: LOCATION_LABEL,
      softDeletable: true
    });
  }

  hardDelete(id: string) {
    return hardDeleteMasterRecord({
      delegate: this.prisma.location,
      id,
      label: LOCATION_LABEL,
      softDeletable: true
    });
  }
}
