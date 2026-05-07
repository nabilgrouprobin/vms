import { Module } from "@nestjs/common";

import { AuthModule } from "../../auth/auth.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { LaytimeCalculationService } from "./laytime/laytime-calculation.service";
import { SofController } from "./sof.controller";
import { SofRepository } from "./sof.repository";
import { SofService } from "./sof.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SofController],
  providers: [SofRepository, SofService, LaytimeCalculationService],
  exports: [SofService]
})
export class SofModule {}
