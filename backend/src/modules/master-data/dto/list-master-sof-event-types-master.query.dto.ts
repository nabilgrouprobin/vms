import { IsIn, IsOptional } from "class-validator";

import { ListMasterReferenceQueryDto } from "./list-master-reference.query.dto";

/** Admin list filters for SOF event type definitions. */
export class ListMasterSofEventTypesMasterQueryDto extends ListMasterReferenceQueryDto {
  @IsOptional()
  @IsIn(["MOTHER_VESSEL", "LIGHTER_VESSEL", "BOTH", "ALL"])
  scope?: "MOTHER_VESSEL" | "LIGHTER_VESSEL" | "BOTH" | "ALL";
}
