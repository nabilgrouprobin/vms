# Production deployment (Linux)

This repo contains:
- `backend` (NestJS + Prisma)
- `frontend` (Next.js)

Recommended production setup:
- Backend listens on `127.0.0.1:7700`
- Frontend listens on `127.0.0.1:7701`
- Nginx listens on `80/443` and proxies:
  - `/` -> frontend `7701`
  - `/api` -> backend `7700`

## 1) Create env files (on the Linux server)

### Backend

Copy `backend/.env.production.example` to `backend/.env` and set real values:
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS` (prefer your domain origin when you have one)

### Frontend

Copy `frontend/.env.production.example` to `frontend/.env.production` and set:
- `NEXT_PUBLIC_API_URL` (recommended: `https://your-domain.com/api`)

## 2) Install + build

From repo root:

```bash
cd backend
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run build

cd ../frontend
npm ci
npm run build
```

## 3) Run with PM2

The PM2 config lives at `backend/ecosystem.config.cjs` and starts:
- `vms-backend` on `7700`
- `vms-frontend` on `7701`

```bash
cd backend
npm i -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 4) Configure Nginx

Use the sample config at `deploy/nginx/vms.conf`.

Typical enable steps:

```bash
sudo cp deploy/nginx/vms.conf /etc/nginx/sites-available/vms
sudo ln -s /etc/nginx/sites-available/vms /etc/nginx/sites-enabled/vms
sudo nginx -t
sudo systemctl restart nginx
```

## 5) Firewall / ports

Expose publicly:
- `80` and `443`

Keep internal (not exposed publicly when using Nginx):
- `7700` (backend)
- `7701` (frontend)

