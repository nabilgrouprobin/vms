import { Controller, Get } from "@nestjs/common";

import { Public } from "./auth/decorators/public.decorator";
import { PrismaService } from "./prisma/prisma.service";

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  getHealth() {
    return {
      name: "vms-backend",
      status: "ok"
    };
  }

  @Public()
  @Get("db/health")
  async getDatabaseHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      database: "ok"
    };
  }
}
