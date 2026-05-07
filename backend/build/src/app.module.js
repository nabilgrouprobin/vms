"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const auth_module_1 = require("./auth/auth.module");
const import_contracts_module_1 = require("./modules/import-contracts/import-contracts.module");
const lighter_trips_module_1 = require("./modules/lighter-trips/lighter-trips.module");
const master_data_module_1 = require("./modules/master-data/master-data.module");
const sof_module_1 = require("./modules/sof/sof.module");
const vessel_calls_module_1 = require("./modules/vessel-calls/vessel-calls.module");
const prisma_module_1 = require("./prisma/prisma.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            sof_module_1.SofModule,
            import_contracts_module_1.ImportContractsModule,
            lighter_trips_module_1.LighterTripsModule,
            vessel_calls_module_1.VesselCallsModule,
            master_data_module_1.MasterDataModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            {
                provide: core_1.APP_PIPE,
                useValue: new common_1.ValidationPipe({
                    transform: true,
                    transformOptions: { enableImplicitConversion: true },
                    whitelist: false,
                    forbidNonWhitelisted: false
                })
            }
        ]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map