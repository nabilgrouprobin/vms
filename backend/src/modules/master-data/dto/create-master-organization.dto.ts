import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateMasterOrganizationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(1)
  organizationTypeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactPerson?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  contactNo?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string | null;
}
