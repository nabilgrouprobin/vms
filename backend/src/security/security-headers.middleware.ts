import type { NextFunction, Request, Response } from "express";

/**
 * Minimal subset of the headers `helmet()` would set by default.
 *
 * We inline this instead of adding the `helmet` package because the API is
 * a JSON-only backend (no HTML rendering, no inline scripts) so we only need
 * a handful of the strict defaults. If we later add a server-rendered admin
 * UI under the same origin, swap this for the real helmet middleware.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Disable the legacy `X-Powered-By: Express` header — leaks framework info.
  res.removeHeader("X-Powered-By");

  // Block MIME-sniffing so a JSON payload can never be interpreted as JS.
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Disallow embedding the API in iframes (clickjacking defense). The browser
  // also enforces this for any HTML 4xx/5xx error pages express might emit.
  res.setHeader("X-Frame-Options", "DENY");

  // Don't leak full URLs (incl. query strings with tokens) in cross-origin
  // Referer headers. `strict-origin-when-cross-origin` is the modern default.
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Disable browser features the API never uses. Each `=()` denies the
  // capability. Add more as needed; keep the list short to avoid drift.
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()"
  );

  // Cross-origin isolation — the API serves only same-origin clients. Setting
  // these doesn't break the JSON browser fetches (CORS handles those) but
  // hardens against side-channel attacks if a future endpoint serves binary.
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  // Prevent IE from auto-detecting downloads as different content types.
  res.setHeader("X-Download-Options", "noopen");

  // HSTS only makes sense over HTTPS; the reverse proxy (nginx) usually adds
  // this header at the edge. We set it here too so direct access (e.g. CLI
  // testing through TLS) gets the same protection. 1-year max-age is the
  // commonly-recommended minimum.
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}
