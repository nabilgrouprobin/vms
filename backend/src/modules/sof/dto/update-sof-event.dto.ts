import {
  Allow,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from "class-validator";

export class UpdateSofEventDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  eventTypeId?: string;

  @IsOptional()
  @IsString()
  eventTime?: string;

  @Allow()
  durationMinutes?: string | number | null;

  @Allow()
  durationHours?: string | number | null;

  @IsOptional()
  @IsBoolean()
  countsAsLaytime?: boolean;

  @Allow()
  laytimeImpactHours?: string | number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  anchorageId?: string;

  @Allow()
  robQuantityMt?: string | number | null;

  @Allow()
  dischargeQuantityMt?: string | number | null;

  @Allow()
  cumulativeDischargeMt?: string | number | null;

  @IsOptional()
  @IsBoolean()
  isHold?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  holdReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  responsibleParty?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  laytimeAccount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  referenceNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supportingDocuments?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  verifiedBy?: string;

  @IsOptional()
  @IsString()
  verifiedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  operationBatchId?: string;
}
