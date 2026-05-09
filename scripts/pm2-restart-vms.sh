#!/usr/bin/env bash
# Stop duplicate Nest/Next processes, free both ports, rebuild, start PM2 once.
# Run from repo root: ./scripts/pm2-restart-vms.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# DO NOT source any .env here. PM2 inherits the shell env, and a leaked
# `PORT=4000` from backend/.env was making Next.js bind to 4000 before the
# backend could. Each app's port is enforced by ecosystem.config.cjs instead.
unset PORT HOST

BACKEND_PORT=4000
FRONTEND_PORT=3000

echo "[pm2-restart-vms] repo: $ROOT"
echo "[pm2-restart-vms] backend=${BACKEND_PORT}, frontend=${FRONTEND_PORT}"

free_port() {
  local p="$1"
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${p}/tcp" 2>/dev/null || true
  fi
  if command -v lsof >/dev/null 2>&1; then
    for pid in $(lsof -t -iTCP:"${p}" -sTCP:LISTEN 2>/dev/null || true); do
      kill "$pid" 2>/dev/null || true
    done
  fi
}

port_busy() {
  local p="$1"
  ss -ltn "( sport = :${p} )" 2>/dev/null | grep -q ":${p}\\b"
}

wait_for_port_free() {
  local p="$1"
  local attempts="${2:-20}" # ~10s with 0.5s sleep
  local i
  for i in $(seq 1 "$attempts"); do
    if ! port_busy "$p"; then
      return 0
    fi
    free_port "$p"
    sleep 0.5
  done
  return 1
}

# Remove PM2 apps so restarts don't stack listeners
pm2 delete vms-backend 2>/dev/null || true
pm2 delete vms-frontend 2>/dev/null || true

# Free any stray listeners (Nest watch / Next dev / orphaned PM2 child)
free_port "$BACKEND_PORT"
free_port "$FRONTEND_PORT"

if ! wait_for_port_free "$BACKEND_PORT" || ! wait_for_port_free "$FRONTEND_PORT"; then
  echo "[pm2-restart-vms] ERROR: one or more required ports are still busy."
  echo "  backend:${BACKEND_PORT} busy=$(port_busy "$BACKEND_PORT" && echo yes || echo no)"
  echo "  frontend:${FRONTEND_PORT} busy=$(port_busy "$FRONTEND_PORT" && echo yes || echo no)"
  echo "Run once as root to force clear listeners:"
  echo "  fuser -k ${BACKEND_PORT}/tcp ${FRONTEND_PORT}/tcp"
  echo "Then rerun:"
  echo "  ./scripts/pm2-restart-vms.sh"
  exit 1
fi

echo "[pm2-restart-vms] building backend..."
cd "$ROOT/backend"
sudo chown -R "$(whoami):$(whoami)" build node_modules 2>/dev/null || true
npm run build

echo "[pm2-restart-vms] building frontend..."
cd "$ROOT/frontend"
sudo chown -R "$(whoami):$(whoami)" .next node_modules 2>/dev/null || true
npm run build

cd "$ROOT"
echo "[pm2-restart-vms] starting PM2 from ecosystem.config.cjs ..."
pm2 start ecosystem.config.cjs --update-env
pm2 save

# Give Nest a moment to actually bind before health-checking
sleep 3

echo "[pm2-restart-vms] status:"
pm2 status

echo "[pm2-restart-vms] listeners:"
ss -ltnp 2>/dev/null | awk -v b=":$BACKEND_PORT" -v f=":$FRONTEND_PORT" '$0 ~ b || $0 ~ f' || true

echo "[pm2-restart-vms] curl backend:"
curl -sS -o /dev/null -w "  HTTP %{http_code}\n" "http://127.0.0.1:${BACKEND_PORT}/" || echo "  (curl failed)"
echo "[pm2-restart-vms] curl frontend:"
curl -sS -o /dev/null -w "  HTTP %{http_code}\n" "http://127.0.0.1:${FRONTEND_PORT}/" || echo "  (curl failed)"

echo "[pm2-restart-vms] done."
echo "Reload nginx if needed: sudo nginx -t && sudo systemctl reload nginx"
