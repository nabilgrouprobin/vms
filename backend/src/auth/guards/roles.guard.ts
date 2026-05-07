import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AppRole } from "@prisma/client";

import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!required?.length) {
      return true;
    }

    const req = context
      .switchToHttp()
      .getRequest<{ user?: { userId: string; roles?: AppRole[] } }>();
    const userId = req.user?.userId;
    if (!userId) {
      throw new ForbiddenException("Authentication required");
    }

    const roles = new Set(req.user?.roles ?? []);
    if (roles.has(AppRole.SUPER_ADMIN) || roles.has(AppRole.SYSTEM_ADMIN)) {
      return true;
    }
    const allowed = required.some((r) => roles.has(r));
    if (!allowed) {
      throw new ForbiddenException("Insufficient role for this action");
    }
    return true;
  }
}
