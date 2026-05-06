import { NestFactory } from "@nestjs/core";
import compression from "compression";

import { AppModule } from "./app.module";
import { PrismaService } from "./prisma/prisma.service";

const defaultBrowserOrigins = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:7701",
  "http://127.0.0.1:7701",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());
  const fromEnv = process.env.CORS_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const originList = [...new Set([...(fromEnv ?? []), ...defaultBrowserOrigins])];
  app.enableCors({
    origin: originList,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);

  const prisma = app.get(PrismaService);
  let databaseStatus = "connected";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    databaseStatus = "not connected";
    console.error("[VMS] Database connection check failed:", error);
  }

  console.log(`[VMS] Server running on http://localhost:${port}`);
  console.log(`[VMS] Database is ${databaseStatus}`);
}

void bootstrap();
