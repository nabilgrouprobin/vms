import { Module } from "@nestjs/common";

import { AuthModule } from "../../auth/auth.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { VesselCallsController } from "./vessel-calls.controller";
import { VesselCallsService } from "./vessel-calls.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [VesselCallsController],
  providers: [VesselCallsService],
  exports: [VesselCallsService]
})
export class VesselCallsModule {}
