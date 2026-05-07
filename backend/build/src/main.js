"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const compression_1 = __importDefault(require("compression"));
const app_module_1 = require("./app.module");
const prisma_service_1 = require("./prisma/prisma.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, compression_1.default)());
    const originList = process.env.CORS_ORIGINS?.split(",")
        .map((o) => o.trim())
        .filter(Boolean) ?? [];
    const allowAllCors = originList.includes("*");
    app.enableCors({
        origin: allowAllCors || originList.length === 0 ? true : originList,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept"]
    });
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const host = process.env.HOST?.trim() || "0.0.0.0";
    await app.listen(port, host);
    const prisma = app.get(prisma_service_1.PrismaService);
    let databaseStatus = "connected";
    try {
        await prisma.$queryRaw `SELECT 1`;
    }
    catch (error) {
        databaseStatus = "not connected";
        console.error("[VMS] Database connection check failed:", error);
    }
    console.log(`[VMS] Server running on http://${host}:${port}`);
    console.log(`[VMS] Database is ${databaseStatus}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map