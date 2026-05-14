#!/usr/bin/env bash
# Free ports 3000/4000 (requires privilege when listeners are owned by root or
# other users), then run the normal PM2 build + restart as the repo owner.
# Usage from repo root: ./deploy/restart-stack.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OWNER="${SUDO_USER:-$(logname 2>/dev/null || true)}"
OWNER="${OWNER:-$(id -un)}"
if [[ "$OWNER" == "root" ]]; then
  echo "[restart-stack] need a normal user context (ssh as ngi, then run this script)." >&2
  exit 1
fi

if [[ "$(id -u)" -ne 0 ]]; then
  exec sudo PATH="$PATH" bash "$ROOT/deploy/restart-stack.sh"
fi

port_busy() {
  local p="$1"
  ss -ltn "( sport = :${p} )" 2>/dev/null | grep -q ":${p}\\b"
}

aggressive_free_tcp() {
  local p="$1"
  local i
  for i in $(seq 1 40); do
    if ! port_busy "$p"; then
      return 0
    fi
    if command -v fuser >/dev/null 2>&1; then
      # fuser prints PIDs to stdout with no newline — keep logs clean
      fuser -k "${p}/tcp" >/dev/null 2>&1 || true
    fi
    sleep 0.25
  done
  if port_busy "$p"; then
    return 1
  fi
  return 0
}

if ! command -v fuser >/dev/null 2>&1; then
  echo "[restart-stack] install psmisc (fuser) or clear ports manually" >&2
fi

for p in 3000 4000; do
  if ! aggressive_free_tcp "$p"; then
    echo "[restart-stack] port ${p} still has a listener after repeated kills — another supervisor is respawning it (often systemd or Docker)." >&2
    echo "[restart-stack] Inspect: sudo ss -tlnp | grep ':${p}'" >&2
    echo "[restart-stack] Then stop the unit/container, e.g.:" >&2
    echo "    sudo systemctl list-units --type=service --state=running | grep -iE 'vms|next|node'" >&2
    echo "    sudo systemctl stop <that-service>" >&2
    exit 1
  fi
done

sleep 0.5

sudo -H -u "$OWNER" bash -ce "cd \"$ROOT\" && ./scripts/pm2-restart-vms.sh"
