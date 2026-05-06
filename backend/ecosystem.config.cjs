/**
 * PM2 process file. Requires a successful production build first:
 *   cd backend && npm run build
 * Then:
 *   pm2 start ecosystem.config.cjs
 */
module.exports = {
  apps: [
    {
      name: "vms-backend",
      cwd: __dirname,
      script: "dist/main.js",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 7700,
      },
    },
    {
      name: "vms-frontend",
      cwd: "../frontend",
      script: "npm",
      args: "run start -- -p 7701",
      interpreter: "none",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
