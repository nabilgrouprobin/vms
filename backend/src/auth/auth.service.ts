import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AppRole } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";
import { SignupDto } from "./dto/signup.dto";

export type JwtPayload = {
  sub: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async login(login: string, password: string) {
    const loginRaw = login.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        isActive: true,
        phone: loginRaw
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        passwordHash: true,
        organizationId: true
      }
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const now = new Date();
    const assignments = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId: user.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
      },
      select: { role: true }
    });

    if (assignments.length === 0) {
      throw new UnauthorizedException("No roles assigned; contact administrator");
    }

    return this.issueSession(user, assignments.map((a) => a.role));
  }

  async signup(dto: SignupDto) {
    const phone = dto.phone.trim();
    const fullName = dto.fullName.trim();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = await this.prisma.$transaction(async (tx) => {
      const dup = await tx.user.findFirst({
        where: {
          phone
        },
        select: { id: true }
      });

      if (dup) {
        throw new ConflictException("Phone number is already in use");
      }

      const user = await tx.user.create({
        data: {
          email: null,
          phone,
          fullName,
          passwordHash,
          isActive: true
        },
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          organizationId: true
        }
      });

      await tx.userRoleAssignment.create({
        data: {
          userId: user.id,
          role: AppRole.REPORT_VIEWER
        }
      });

      return user;
    });

    return this.issueSession(created, [AppRole.REPORT_VIEWER]);
  }

  private async issueSession(
    user: {
      id: string;
      email: string | null;
      phone: string;
      fullName: string;
      organizationId: string | null;
    },
    roles: AppRole[]
  ) {
    const payload: JwtPayload = { sub: user.id };
    const accessToken = await this.jwt.signAsync(payload);

    void this.prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
      .catch(() => undefined);

    const decoded = this.jwt.decode(accessToken) as { exp?: number } | null;

    return {
      accessToken,
      tokenType: "Bearer" as const,
      expiresAtUnix: decoded?.exp ?? null,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        organizationId: user.organizationId,
        roles
      }
    };
  }
}
