import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateMasterUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string;

  /** Optional tenant scope */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  organizationId?: string | null;
}
