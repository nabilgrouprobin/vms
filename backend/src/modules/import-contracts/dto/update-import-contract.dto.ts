import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

/** PATCH body for import contract operational / laytime fields */
export class UpdateImportContractDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludedDays?: string[];

  @IsOptional()
  @IsBoolean()
  holidaysExcluded?: boolean | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excludedTimePeriod?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dischargeRateMtPerDay?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  dischargeRateUnit?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  laytimeDemurrageRatePerDay?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  laytimeDispatchRatePerDay?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  dischargePort?: string | null;
}
