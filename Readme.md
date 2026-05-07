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
`postgresql://postgres:14789@localhost:5432/vms_db?schema=public`

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

Create `backend/.env` and set at least:

```env
DATABASE_URL=postgresql://postgres:14789@localhost:5432/vms_db?schema=public
JWT_SECRET=replace-with-long-random-secret-min-16-chars
JWT_EXPIRES_HOURS=8
PORT=7700
CORS_ORIGINS=http://localhost:7701,http://127.0.0.1:7701
```

Then run:

```bash
npx prisma migrate deploy
npx prisma generate
npm run build
```

Optional seed data (recommended for first run):

```bash
npx tsx prisma/seed.ts
```

### 4) Frontend Install

```bash
cd ../frontend
npm install
npm run build
```

Create `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:7700
PORT=7701
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

## Notes for New Server

- If PostgreSQL is on the same server, `localhost` in `DATABASE_URL` is correct.
- If PostgreSQL is on another server, replace `localhost` with that DB host IP/domain.
- Frontend and backend ports are now env-driven.

## Deploy Frontend on Vercel

This repository is a monorepo (`frontend` + `backend`), so Vercel must build the Next.js app from `frontend`.

### 1) Vercel Project Settings

- Framework Preset: `Next.js`
- Root Directory: `frontend` (or keep root and use `vercel.json` in this repo)
- Build Command: `npm run build`

### 2) Add Vercel Environment Variables

Set at least:

```env
NEXT_PUBLIC_API_URL=https://your-backend-public-url
```

Do not use `localhost` in production env vars.

### 3) Backend Hosting

Current backend is NestJS and should be hosted separately (for example Railway/Render/Fly.io/VM).
After backend deployment, copy its public URL into `NEXT_PUBLIC_API_URL` in Vercel and redeploy frontend.

## Change Ports Using .env Only

You do not need to edit source code when changing ports.

Update only these values:

```env
# backend/.env
PORT=7700
CORS_ORIGINS=http://localhost:7701,http://127.0.0.1:7701

# frontend/.env (or frontend/.env)
PORT=7701
NEXT_PUBLIC_API_URL=http://localhost:7700
```

Rules:

- If backend `PORT` changes, update frontend `NEXT_PUBLIC_API_URL`.
- If frontend `PORT` changes, update backend `CORS_ORIGINS`.
- Restart both servers after env changes.
