import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

/** Maps FK violations / missing rows from Prisma `delete` into HTTP errors. */
export function rethrowPrismaDeleteError(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2003") {
      throw new BadRequestException(
        "Cannot permanently delete: other records still reference this one."
      );
    }
    if (e.code === "P2025") {
      throw new NotFoundException("Record was not found.");
    }
  }
  throw e;
}
