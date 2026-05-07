import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AppRole } from "@prisma/client";

import { JwtPayload } from "../auth.service";

export type AuthedRequestUser = { userId: string; roles: AppRole[] };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService) {
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

  validate(payload: JwtPayload): AuthedRequestUser {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, roles: payload.roles ?? [] };
  }
}
