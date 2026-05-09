import { SofEventTypeScope } from "@prisma/client";
import { IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

/** Mirrors `SofEventTypeCategory` enum (declared in Prisma schema). */
export const SOF_EVENT_TYPE_CATEGORY = {
  NORMAL: "NORMAL",
  HOLD_DELAY: "HOLD_DELAY"
} as const;
export type SofEventTypeCategoryDto =
  (typeof SOF_EVENT_TYPE_CATEGORY)[keyof typeof SOF_EVENT_TYPE_CATEGORY];

export class CreateMasterSofEventTypeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsEnum(SofEventTypeScope)
  scope!: SofEventTypeScope;

  /** Defaults to `NORMAL` when omitted. */
  @IsOptional()
  @IsIn(["NORMAL", "HOLD_DELAY"])
  category?: SofEventTypeCategoryDto;
}
