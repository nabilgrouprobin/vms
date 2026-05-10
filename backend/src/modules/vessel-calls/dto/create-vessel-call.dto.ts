import { MotherVesselStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateVesselCallDto {
  /** `mother` (default): active mother hull. `lighter`: active lighter hull. */
  @IsOptional()
  @IsIn(["mother", "lighter"])
  hullKind?: "mother" | "lighter";

  /** Master hull id — must match `hullKind` (mother vs lighter registry row). */
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  vesselId!: string;

  /**
   * Optional override. When omitted, `callNo` is generated as `YY-MM-DD-{hull}-{seq}`
   * (Asia/Dhaka calendar day, 3-digit hull registry id, daily sequence per hull).
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const t = String(value).trim();
    return t.length ? t : undefined;
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  callNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  cargoNameSnapshot?: string | null;

  /** ISO 8601 date-time string */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  eta?: string | null;

  @IsOptional()
  @IsEnum(MotherVesselStatus)
  status?: MotherVesselStatus;
}
