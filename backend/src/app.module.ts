import { Module, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_PIPE } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { ImportContractsModule } from "./modules/import-contracts/import-contracts.module";
import { LighterTripsModule } from "./modules/lighter-trips/lighter-trips.module";
import { MasterDataModule } from "./modules/master-data/master-data.module";
import { SofModule } from "./modules/sof/sof.module";
import { VesselCallsModule } from "./modules/vessel-calls/vessel-calls.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    PrismaModule,
    AuthModule,
    SofModule,
    ImportContractsModule,
    LighterTripsModule,
    VesselCallsModule,
    MasterDataModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        whitelist: false,
        forbidNonWhitelisted: false
      })
    }
  ]
})
export class AppModule {}
