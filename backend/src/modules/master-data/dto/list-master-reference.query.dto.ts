export class ListMasterReferenceQueryDto {
  cursor?: string;
  limit?: string;
  search?: string;
  /** When `"true"`, include inactive rows. */
  includeInactive?: string;
}
