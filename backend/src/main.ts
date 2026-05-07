import { NestFactory } from "@nestjs/core";
import compression from "compression";

import { AppModule } from "./app.module";
import { PrismaService } from "./prisma/prisma.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());
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

  const prisma = app.get(PrismaService);
  let databaseStatus = "connected";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    databaseStatus = "not connected";
    console.error("[VMS] Database connection check failed:", error);
  }

  console.log(`[VMS] Server running on http://${host}:${port}`);
  console.log(`[VMS] Database is ${databaseStatus}`);
}

void bootstrap();
