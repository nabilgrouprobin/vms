#!/usr/bin/env bash
# One-shot: disable root systemd PM2, clear root's saved apps, rebuild + start under ngi.
#
# Usage (SSH on the server):
#   cd /var/www/vms && sudo bash deploy/migrate-pm2-root-to-ngi.sh
#
# Removes ALL apps from root PM2's saved snapshot (wiping /root/.pm2/dump.pm2).

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OWNER="${SUDO_USER:-ngi}"
PM2_BIN="${PM2_BIN:-/root/.nvm/versions/node/v24.15.0/bin/pm2}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run with sudo, e.g.:  sudo bash $REPO/deploy/migrate-pm2-root-to-ngi.sh" >&2
  exit 1
fi

if ! id "$OWNER" &>/dev/null; then
  echo "User '$OWNER' does not exist. Set SUDO_USER or edit OWNER in this script." >&2
  exit 1
fi

echo "[migrate-pm2] repo=$REPO owner=$OWNER"

if [[ ! -x "$PM2_BIN" ]]; then
  PM2_BIN="$(HOME=/root bash -lc 'command -v pm2' || true)"
fi

if [[ -z "${PM2_BIN:-}" || ! -x "$PM2_BIN" ]]; then
  echo "[migrate-pm2] ERROR: pm2 not found under root. Install or set PM2_BIN=..." >&2
  exit 1
fi

echo "[migrate-pm2] stopping + disabling systemd pm2-root ..."
systemctl stop pm2-root.service 2>/dev/null || true
systemctl disable pm2-root.service 2>/dev/null || true

echo "[migrate-pm2] clearing root PM2 snapshot (${PM2_BIN}; PM2_HOME=/root/.pm2) ..."
HOME=/root PM2_HOME=/root/.pm2 "$PM2_BIN" delete all 2>/dev/null || true
rm -f /root/.pm2/dump.pm2
HOME=/root PM2_HOME=/root/.pm2 "$PM2_BIN" save --force 2>/dev/null || true

echo "[migrate-pm2] freeing TCP 3000 and 4000 ..."
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp 4000/tcp >/dev/null 2>&1 || true
fi
sleep 1

echo "[migrate-pm2] npm build + pm2 start as ${OWNER} ..."
sudo -H -u "$OWNER" bash -ce "cd \"$REPO\" && ./scripts/pm2-restart-vms.sh"

echo "[migrate-pm2] pm2 (${OWNER}):"
sudo -H -u "$OWNER" bash -ce 'export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  [[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh"
  pm2 list'

echo "[migrate-pm2] Done."
echo "[migrate-pm2] Boot persistence (optional):  sudo -u $OWNER bash -lc 'pm2 save && pm2 startup'  # then run printed sudo command."
