import { Allow, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateMotherVesselDailyDischargeDto {
  @IsOptional()
  @IsString()
  reportDate?: string;

  @Allow()
  quantity24hMt?: string | number;

  @Allow()
  cumulativeMt?: string | number | null;

  @Allow()
  remainingMt?: string | number | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  enteredById?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string | null;
}
