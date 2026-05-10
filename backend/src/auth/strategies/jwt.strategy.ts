import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AppRole } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { JwtPayload } from "../auth.service";

export type AuthedRequestUser = { userId: string; roles: AppRole[] };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const secret = config.get<string>("JWT_SECRET");
    if (!secret || secret.length < 16) {
      throw new Error("JWT_SECRET must be set to a strong value (min 16 chars)");
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret
    });
  }

  /**
   * Ensures `sub` still refers to a live user row. Stale JWTs after DB resets otherwise
   * cause random Prisma P2003 failures (500) on any write that FKs `users.id`.
   */
  async validate(payload: JwtPayload): Promise<AuthedRequestUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true }
    });
    if (!user) {
      throw new UnauthorizedException(
        "Your session does not match any active user in this database (often after a data reset). Sign out and sign in again."
      );
    }
    const roles = payload.roles?.length ? [...new Set(payload.roles)] : [];
    return { userId: payload.sub, roles };
  }
}
