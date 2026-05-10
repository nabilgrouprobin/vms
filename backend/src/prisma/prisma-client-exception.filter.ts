import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";

/**
 * Turns unhandled Prisma client errors into JSON responses with a clear `message`
 * instead of a generic 500 "Internal server error".
 *
 * Catches every Prisma error class so a malformed query / connection blip /
 * Rust-side panic doesn't slip through as an opaque 500.
 */
@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientRustPanicError,
  Prisma.PrismaClientInitializationError
)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { status, message } = this.mapKnownError(exception);
      res.status(status).json({
        statusCode: status,
        message,
        code: exception.code
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.warn(`PrismaClientValidationError: ${exception.message}`);
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "The request contains invalid or missing fields.",
        code: "PRISMA_VALIDATION"
      });
      return;
    }

    if (
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      this.logger.error(
        `${exception.constructor.name}: ${(exception as Error).message}`,
        (exception as Error).stack
      );
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: "The database is unavailable. Please try again shortly.",
        code: "PRISMA_DB_UNAVAILABLE"
      });
      return;
    }

    this.logger.error("Unhandled Prisma exception", exception as never);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Database request failed.",
      code: "PRISMA_UNKNOWN"
    });
  }

  private mapKnownError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (exception.code) {
      case "P2002": {
        const target = (exception.meta as { target?: string[] | string } | undefined)?.target;
        const fields = Array.isArray(target) ? target.join(", ") : (target ?? "");
        return {
          status: HttpStatus.CONFLICT,
          message: fields
            ? `A record with the same ${fields} already exists.`
            : "A unique field would be duplicated."
        };
      }
      case "P2003":
        return {
          status: HttpStatus.BAD_REQUEST,
          message:
            "This action conflicts with existing data (a required link is missing or invalid). If the database was reset recently, sign out and sign in again."
        };
      case "P2025":
        return {
          status: HttpStatus.NOT_FOUND,
          message: "The record was not found."
        };
      default:
        this.logger.warn(`Prisma ${exception.code}: ${exception.message}`);
        return {
          status: HttpStatus.BAD_REQUEST,
          message: "Database request failed."
        };
    }
  }
}
