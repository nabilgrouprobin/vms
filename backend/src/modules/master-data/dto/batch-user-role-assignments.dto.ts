import { AppRole } from "@prisma/client";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class BatchUserRoleAssignmentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(48)
  @IsEnum(AppRole, { each: true })
  roles!: AppRole[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  locationId?: string | null;
}
