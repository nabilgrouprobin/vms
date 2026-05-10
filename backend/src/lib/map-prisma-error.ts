import { BadRequestException, ConflictException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

/**
 * If `e` is a Prisma `P2002` (unique constraint violation), throw a 409 with
 * the supplied human-friendly `message`. Otherwise, rethrow the original error.
 *
 * Use inside `try / catch` blocks where you want a custom resource-specific
 * message instead of the generic one produced by the global
 * `PrismaClientExceptionFilter`.
 */
export function mapUniqueConflict(e: unknown, message: string): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    throw new ConflictException(message);
  }
  throw e;
}

/** Same as {@link mapUniqueConflict} but throws a 400 to preserve legacy behaviour. */
export function mapUniqueConflictAsBadRequest(e: unknown, message: string): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    throw new BadRequestException(message);
  }
  throw e;
}
