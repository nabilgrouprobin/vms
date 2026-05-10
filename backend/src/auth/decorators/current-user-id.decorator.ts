import { ExecutionContext, UnauthorizedException, createParamDecorator } from "@nestjs/common";
import type { Request } from "express";

type AuthedRequest = Request & { user?: { userId?: string | null } };

/**
 * Resolve the authenticated user's ID from the JWT-decoded `req.user.userId`.
 *
 * Throws `UnauthorizedException` if the request reached the handler without an
 * authenticated subject — should never happen because the global
 * `JwtAuthGuard` runs first, but we surface a clear 401 just in case to avoid
 * persisting `undefined` as an audit field.
 *
 * Usage: `create(@Body() dto: FooDto, @CurrentUserId() userId: string) { ... }`
 *
 * Replaces the boilerplate dance:
 * ```ts
 * const userId = req.user?.userId;
 * if (!userId) throw new UnauthorizedException();
 * ```
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }
    return userId;
  }
);
