import { IsInt, IsOptional, IsString, Matches, MaxLength, MinLength, Min, ValidateIf } from "class-validator";

/** One SOF-specific laytime holiday wall (replaces full-calendar slice overlapping the interval). */
export class SofLaytimeHolidayRowDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  holidayStartAt!: string;

  @IsString()
  holidayEndAt!: string;

  @IsOptional()
  @ValidateIf((o) => o.eveContactEndHm != null && String(o.eveContactEndHm).trim() !== "")
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "eveContactEndHm must be HH:mm" })
  eveContactEndHm?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.postContactStartHm != null && String(o.postContactStartHm).trim() !== "")
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "postContactStartHm must be HH:mm" })
  postContactStartHm?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
