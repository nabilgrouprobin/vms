import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger
} from "@nestjs/common";
import type { Request } from "express";

/**
 * Lightweight in-process sliding-window rate limiter for the auth routes.
 *
 * Avoids adding a dependency on @nestjs/throttler — adequate for a single
 * PM2 fork. If the deployment ever scales horizontally (multiple Node
 * processes / hosts), swap the Map for Redis or pull in @nestjs/throttler.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const FORWARDED_FOR_HEADER = "x-forwarded-for";

type Bucket = { hits: number[]; warned: boolean };

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AuthRateLimitGuard.name);
  private readonly buckets = new Map<string, Bucket>();
  private lastSweep = 0;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = this.clientKey(req);
    const now = Date.now();

    this.maybeSweep(now);

    const bucket = this.buckets.get(key) ?? { hits: [], warned: false };
    bucket.hits = bucket.hits.filter((t) => now - t < WINDOW_MS);

    if (bucket.hits.length >= MAX_REQUESTS_PER_WINDOW) {
      const retryAfterMs = WINDOW_MS - (now - bucket.hits[0]!);
      const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
      if (!bucket.warned) {
        this.logger.warn(`Auth rate limit hit for ${key}`);
        bucket.warned = true;
        this.buckets.set(key, bucket);
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: "Too many auth requests. Please slow down and try again.",
          retryAfterSec
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    bucket.hits.push(now);
    bucket.warned = false;
    this.buckets.set(key, bucket);
    return true;
  }

  private clientKey(req: Request): string {
    const fwd = req.headers[FORWARDED_FOR_HEADER];
    if (typeof fwd === "string" && fwd.length > 0) {
      return fwd.split(",")[0]!.trim();
    }
    return req.ip ?? req.socket?.remoteAddress ?? "unknown";
  }

  private maybeSweep(now: number) {
    if (now - this.lastSweep < WINDOW_MS) return;
    this.lastSweep = now;
    for (const [key, bucket] of this.buckets) {
      bucket.hits = bucket.hits.filter((t) => now - t < WINDOW_MS);
      if (bucket.hits.length === 0) {
        this.buckets.delete(key);
      }
    }
  }
}
