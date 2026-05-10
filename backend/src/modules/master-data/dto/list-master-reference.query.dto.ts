import { IsOptional, IsString, MaxLength } from "class-validator";

/**
 * Shared list-query shape for the simpler master-data endpoints (products,
 * locations, ghats, organizations, organization-types).
 *
 * Every field needs at least one class-validator decorator — the global
 * `ValidationPipe` runs with `whitelist: true, forbidNonWhitelisted: true`,
 * which strips undecorated properties and then 400s with "should not exist".
 */
export class ListMasterReferenceQueryDto {
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

  /** When `"true"`, include inactive rows. */
  @IsOptional()
  @IsString()
  @MaxLength(8)
  includeInactive?: string;
}
