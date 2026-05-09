import { SofEventTypeScope } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf
} from "class-validator";

import type { SofEventTypeCategoryDto } from "./create-master-sof-event-type.dto";

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
  @IsIn(["NORMAL", "HOLD_DELAY"])
  category?: SofEventTypeCategoryDto;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
