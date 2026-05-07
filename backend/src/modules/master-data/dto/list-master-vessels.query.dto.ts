export class ListMasterVesselsQueryDto {
  cursor?: string;
  limit?: string;
  search?: string;
  /** When `"true"`, include rows with `isActive: false`. */
  includeInactive?: string;
}
