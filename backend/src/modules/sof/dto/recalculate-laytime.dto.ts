import { IsArray, IsOptional, IsString, MaxLength } from "class-validator";

/** Optional working week to apply immediately before laytime recalculation. */
export class RecalculateLaytimeDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  laytimeExcludedTimePeriod?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  laytimeExcludedDays?: string[];
}
