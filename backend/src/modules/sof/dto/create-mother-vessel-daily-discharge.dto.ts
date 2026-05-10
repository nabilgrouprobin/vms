import { Allow, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateMotherVesselDailyDischargeDto {
  @IsString()
  reportDate!: string;

  @Allow()
  quantity24hMt!: string | number;

  @Allow()
  cumulativeMt?: string | number;

  @Allow()
  remainingMt?: string | number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  enteredById?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}
