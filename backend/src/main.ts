import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import compression from "compression";

import { AppModule } from "./app.module";
import { PrismaClientExceptionFilter } from "./prisma/prisma-client-exception.filter";
import { PrismaService } from "./prisma/prisma.service";
import { securityHeaders } from "./security/security-headers.middleware";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Honour X-Forwarded-For when fronted by nginx / a load balancer so the
  // auth rate limiter keys on the real client IP, not the proxy.
  app.set("trust proxy", 1);
  // Suppress the default `X-Powered-By` header at the express level too —
  // belt-and-braces with the per-request middleware below.
  app.disable("x-powered-by");
  app.useGlobalFilters(new PrismaClientExceptionFilter());
  app.use(securityHeaders);
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
