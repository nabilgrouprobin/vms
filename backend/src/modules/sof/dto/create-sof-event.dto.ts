import { IsString, MinLength } from "class-validator";

export class CreateSofEventDto {
  @IsString()
  @MinLength(1)
  eventTypeId!: string;

  eventTime!: string;
  /** Whole minutes from period start to `eventTime`; preferred over `durationHours`. */
  durationMinutes?: string | number | null;
  durationHours?: string | number | null;
  countsAsLaytime?: boolean;
  laytimeImpactHours?: string | number | null;
  location?: string;
  anchorageId?: string;
  robQuantityMt?: string | number | null;
  dischargeQuantityMt?: string | number | null;
  cumulativeDischargeMt?: string | number | null;
  isHold?: boolean;
  holdReason?: string;
  responsibleParty?: string;
  laytimeAccount?: string;
  referenceNo?: string;
  remarks?: string;
  supportingDocuments?: string[];
  createdBy!: string;
  verifiedBy?: string;
  verifiedAt?: string;
  operationBatchId?: string;
}
