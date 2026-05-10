/**
 * PM2 deployment for VMS — single-process backend + frontend (prevents EADDRINUSE on :4000).
 *
 * Usage (from repo root):
 *   cd /var/www/vms
 *   ./scripts/pm2-restart-vms.sh
 *
 * Or manually:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 */
const path = require("path");

const root = __dirname;

module.exports = {
  apps: [
    {
      name: "vms-backend",
      cwd: path.join(root, "backend"),
      script: path.join(root, "backend", "dist", "main.js"),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 15,
      min_uptime: "10s",
      kill_timeout: 8_000,
      env: {
        NODE_ENV: "production",
        PORT: "4000",
        HOST: "0.0.0.0"
      }
    },
    {
      name: "vms-frontend",
      cwd: path.join(root, "frontend"),
      script: path.join(root, "frontend", "scripts", "next-with-env-port.cjs"),
      args: ["start"],
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 15,
      min_uptime: "10s",
      kill_timeout: 8_000,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOST: "0.0.0.0"
      }
    }
  ]
};
