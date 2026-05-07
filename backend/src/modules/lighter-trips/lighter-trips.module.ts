import { Module } from "@nestjs/common";

import { SofModule } from "../sof/sof.module";
import { LighterTripsController } from "./lighter-trips.controller";
import { LighterTripsService } from "./lighter-trips.service";

@Module({
  imports: [SofModule],
  controllers: [LighterTripsController],
  providers: [LighterTripsService],
  exports: [LighterTripsService]
})
export class LighterTripsModule {}
