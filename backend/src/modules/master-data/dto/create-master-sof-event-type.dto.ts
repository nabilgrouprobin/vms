import { SofEventTypeScope } from "@prisma/client";
import { IsEnum, IsString, MaxLength, MinLength } from "class-validator";

export class CreateMasterSofEventTypeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsEnum(SofEventTypeScope)
  scope!: SofEventTypeScope;
}
