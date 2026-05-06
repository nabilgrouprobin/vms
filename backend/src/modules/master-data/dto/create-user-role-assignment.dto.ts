import { AppRole } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateUserRoleAssignmentDto {
  @IsEnum(AppRole)
  role!: AppRole;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  locationId?: string | null;
}
