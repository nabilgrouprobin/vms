import { SofEventTypeScope } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from "class-validator";

export class UpdateMasterSofEventTypeDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsEnum(SofEventTypeScope)
  scope?: SofEventTypeScope;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
