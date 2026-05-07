import { ProductType } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";

export class UpdateMasterProductDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(2000)
  specification?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(32)
  hsCode?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(16)
  defaultUom?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
