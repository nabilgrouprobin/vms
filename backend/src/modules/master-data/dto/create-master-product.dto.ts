import { ProductType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";

export class CreateMasterProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsEnum(ProductType)
  type!: ProductType;

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
  @IsString()
  @MaxLength(16)
  defaultUom?: string;
}
