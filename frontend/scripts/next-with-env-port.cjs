const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function readPortFromEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const match = line.match(/^PORT\s*=\s*(.+)$/);
    if (!match) {
      continue;
    }

    const value = match[1].trim().replace(/^['"]|['"]$/g, "");
    if (!value) {
      return undefined;
    }
    return value;
  }

  return undefined;
}

function resolvePort() {
  if (process.env.PORT) {
    return process.env.PORT;
  }

  const cwd = process.cwd();
  const fromEnvLocal = readPortFromEnvFile(path.join(cwd, ".env.local"));
  if (fromEnvLocal) {
    return fromEnvLocal;
  }

  const fromEnv = readPortFromEnvFile(path.join(cwd, ".env"));
  if (fromEnv) {
    return fromEnv;
  }

  return "7701";
}

const mode = process.argv[2] === "start" ? "start" : "dev";
const port = resolvePort();

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, mode, "-p", String(port)], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: String(port)
  }
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
