import { MotherVesselStatus } from "@prisma/client";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf
} from "class-validator";

export class PatchVesselCallDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  laytimeTimeZone?: string | null;

  /** Set to an import contract id to link, or null to unlink from this call. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  importContractId?: string | null;

  /** Approximate total cargo (MT) on the call — drives contract laytime when discharge rate is set. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  approxTotalWeightTon?: number | null;

  @IsOptional()
  @IsEnum(MotherVesselStatus)
  status?: MotherVesselStatus;

  /** Unique port-call reference; must stay unique across all vessel calls. */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  callNo?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(400)
  cargoNameSnapshot?: string | null;

  /** ISO 8601 date-time, or null to clear ETA. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(80)
  norTenderedAt?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(80)
  norAcceptedAt?: string | null;
}
