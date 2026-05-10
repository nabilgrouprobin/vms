import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { AppRole } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

import { bdPhoneLoginVariants } from "../lib/bd-phone-variants";
import { PrismaService } from "../prisma/prisma.service";
import { SignupDto } from "./dto/signup.dto";

export type JwtPayload = {
  sub: string;
  roles: AppRole[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async login(login: string, password: string) {
    const loginRaw = login.trim();
    const loginEmail = loginRaw.includes("@") ? loginRaw.toLowerCase() : null;
    const phoneVariants = bdPhoneLoginVariants(loginRaw);

    const candidates = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          ...(phoneVariants.length > 0 ? [{ phone: { in: phoneVariants } }] : []),
          ...(loginEmail ? [{ email: loginEmail }] : [])
        ]
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

    type Cand = (typeof candidates)[number];
    const passwordMatches: Cand[] = [];
    for (const c of candidates) {
      if (!c.passwordHash) {
        continue;
      }
      const ok = await bcrypt.compare(password, c.passwordHash);
      if (ok) {
        passwordMatches.push(c);
      }
    }

    if (passwordMatches.length === 0) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const user =
      passwordMatches.length === 1
        ? passwordMatches[0]
        : await this.pickLoginUserWhenAmbiguous(loginRaw, loginEmail, passwordMatches);

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

    const roles = [...new Set(assignments.map((a) => a.role))];
    return this.issueSession(user, roles);
  }

  /** Same logical phone may exist as `01…` and `+880…` (unique per string); prefer the account with active roles. */
  private async pickLoginUserWhenAmbiguous(
    loginRaw: string,
    loginEmail: string | null,
    passwordMatches: {
      id: string;
      email: string | null;
      phone: string;
      fullName: string;
      passwordHash: string | null;
      organizationId: string | null;
    }[]
  ) {
    const now = new Date();
    const assignRows = await this.prisma.userRoleAssignment.findMany({
      where: {
        userId: { in: passwordMatches.map((u) => u.id) },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
      },
      select: { userId: true }
    });
    const countBy = new Map<string, number>();
    for (const row of assignRows) {
      countBy.set(row.userId, (countBy.get(row.userId) ?? 0) + 1);
    }

    const scored = passwordMatches.map((u) => ({
      u,
      n: countBy.get(u.id) ?? 0,
      exactPhone: u.phone === loginRaw ? 1 : 0,
      exactEmail: loginEmail && u.email?.toLowerCase() === loginEmail ? 1 : 0
    }));

    scored.sort((a, b) => {
      if (b.n !== a.n) {
        return b.n - a.n;
      }
      if (b.exactPhone !== a.exactPhone) {
        return b.exactPhone - a.exactPhone;
      }
      if (b.exactEmail !== a.exactEmail) {
        return b.exactEmail - a.exactEmail;
      }
      return a.u.id.localeCompare(b.u.id);
    });

    return scored[0].u;
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
    const payload: JwtPayload = { sub: user.id, roles };
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
