# VMS Local Run Guide

Use this guide when running VMS on a fresh machine/server or in day-to-day development.

## Prerequisites

- Node.js LTS and npm installed
- PostgreSQL installed and running locally
- Git installed

## First-Time Setup (New Device)

### 1) Clone Project

```bash
git clone <your-repo-url>
cd VMS
```

### 2) Create Local Database

Use the same database expected by backend `.env`:
`postgresql://postgres:<your-pw>@localhost:5432/vms_db?schema=public`

```bash
createdb -U postgres vms_db
```

Alternative:

```bash
psql -U postgres -c "CREATE DATABASE vms_db;"
```

### 3) Backend Install + Database Setup

```bash
cd backend
npm install
```

Copy the env template and fill in real values:

```bash
cp .env.example .env
# then edit .env and set DATABASE_URL + JWT_SECRET (use `openssl rand -hex 48`)
```

Required keys (see `backend/.env.example` for the full list):

```env
DATABASE_URL=postgresql://postgres:YOUR_PW@localhost:5432/vms_db?schema=public
JWT_SECRET=use-`openssl rand -hex 48`-min-32-chars
JWT_EXPIRES_HOURS=8
PORT=4000
HOST=0.0.0.0
CORS_ORIGINS=*
```

Then run:

```bash
npx prisma migrate deploy
npx prisma generate
npm run build
```

Optional seed data (idempotent — safe to re-run):

```bash
npx tsx prisma/seed.ts
```

### 4) Frontend Install

```bash
cd ../frontend
npm install
npm run build
```

Copy the env template:

```bash
cp .env.example .env
```

Default contents (matches `ecosystem.config.cjs` and `pm2-restart-vms.sh`):

```env
PORT=3000
HOST=0.0.0.0
BACKEND_INTERNAL_URL=http://127.0.0.1:4000
```

## Run in Development Mode

Start backend and frontend in separate terminals.

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

## Quick Start (After Initial Setup)

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

## Production (PM2)

```bash
cd /var/www/vms
./scripts/pm2-restart-vms.sh
```

This script:
- frees ports `4000` (backend) and `3000` (frontend) of any stray listeners,
- runs `npm run build` for both apps,
- starts/reloads `vms-backend` + `vms-frontend` from `ecosystem.config.cjs`,
- prints health-check status.

## Notes for New Server

- If PostgreSQL is on the same server, `localhost` in `DATABASE_URL` is correct.
- If PostgreSQL is on another server, replace `localhost` with that DB host IP/domain.
- Frontend and backend ports are env-driven (`ecosystem.config.cjs` enforces `4000` / `3000`).

## Tests

```bash
# backend
cd backend && npm test

# frontend
cd frontend && npm test     # vitest run (requires vitest >= 4 with vite 7)
```

## Troubleshooting

- **Stale auth after JWT secret change**: rotating `JWT_SECRET` invalidates every existing token.
  Sign out and back in.
- **`prisma migrate deploy` fails with `ERR_REQUIRE_ESM`**: a known bug in some
  Prisma 7 / Node 20.x combinations. Either upgrade Node to 22.x or run with
  `node --experimental-vm-modules`.
- **`429 Too Many Requests` on /auth**: built-in rate limiter (10/min/IP) on
  `/auth/login` and `/auth/signup`. Wait 60 s and retry.

## Change Ports Using .env Only

You do not need to edit source code when changing ports.

Update only these values:

```env
# backend/.env
PORT=4000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# frontend/.env
PORT=3000
HOST=0.0.0.0
BACKEND_INTERNAL_URL=http://127.0.0.1:4000
```

Rules:

- If backend `PORT` changes, update frontend `BACKEND_INTERNAL_URL`.
- If frontend `PORT` changes, update backend `CORS_ORIGINS`.
- For PM2, also update `ecosystem.config.cjs` and `scripts/pm2-restart-vms.sh`.
- Restart both servers after env changes.
