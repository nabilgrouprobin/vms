export class ListMasterUsersQueryDto {
  cursor?: string;
  limit?: string;
  search?: string;
  /** When `"true"`, include soft-deleted users. */
  includeInactive?: string;
}
