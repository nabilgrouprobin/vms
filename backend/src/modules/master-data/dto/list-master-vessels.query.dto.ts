import { IsOptional, IsString, MaxLength } from "class-validator";

export class ListMasterVesselsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  cursor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  limit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  /** When `"true"`, include rows with `isActive: false`. */
  @IsOptional()
  @IsString()
  @MaxLength(8)
  includeInactive?: string;
}
