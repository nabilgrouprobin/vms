import { IsIn, IsOptional } from "class-validator";

/** Filter types usable when logging events on a mother vs lighter SOF (includes BOTH). */
export class ListSofEventTypesQueryDto {
  @IsOptional()
  @IsIn(["MOTHER_VESSEL", "LIGHTER_VESSEL"])
  forSofScope?: "MOTHER_VESSEL" | "LIGHTER_VESSEL";
}
