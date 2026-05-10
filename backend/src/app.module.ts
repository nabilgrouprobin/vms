import { Module, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./auth/guards/roles.guard";
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
    // Global auth guards. JwtAuthGuard runs first and short-circuits via
    // @Public() on routes that should be anonymous (auth/login, auth/signup,
    // health checks). RolesGuard then enforces @Roles(...) when present.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        // Strip unknown fields silently and reject obvious typos (e.g. a
        // request setting `isAdmin: true` on a DTO that has no such field
        // gets a 400 instead of being silently ignored).
        whitelist: true,
        forbidNonWhitelisted: true,
        // Surface DTO-level errors as a single 400 with a concise message
        // rather than the verbose default that leaks property names.
        stopAtFirstError: false
      })
    }
  ]
})
export class AppModule {}
