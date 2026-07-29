import { spawn, execFileSync } from "node:child_process";
import process from "node:process";

const port = process.env.PORT || "3000";
const host = process.env.HOST || "127.0.0.1";
const isWindows = process.platform === "win32";
const command = isWindows ? "cmd.exe" : "npx";
const args = isWindows
  ? ["/d", "/s", "/c", `npx.cmd next dev --hostname ${host} --port ${port}`]
  : ["next", "dev", "--hostname", host, "--port", port];

function getPidsUsingPort(targetPort) {
  try {
    const output = execFileSync("netstat", ["-ano"], { encoding: "utf8" });
    const matches = [...output.matchAll(/:\s*0*?\d+\s+.*?\s+(\d+)/g)];
    const pids = matches
      .map((match) => Number(match[1]))
      .filter((pid) => Number.isInteger(pid) && pid > 0);

    const uniquePids = [...new Set(pids)];
    return uniquePids.filter((pid) => {
      try {
        const details = execFileSync("tasklist", ["/FI", `PID eq ${pid}`, "/FO", "CSV"], { encoding: "utf8" });
        return details.toLowerCase().includes("node.exe");
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

function killPids(pids) {
  for (const pid of pids) {
    try {
      execFileSync("taskkill", ["/F", "/PID", String(pid)], { stdio: "ignore" });
    } catch {
      // ignore
    }
  }
}

const pids = getPidsUsingPort(Number(port));
if (pids.length) {
  console.log(`[dev-stable] Killing existing node process(es) on port ${port}: ${pids.join(", ")}`);
  killPids(pids);
}

const child = spawn(command, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    BROWSER: "none",
    NEXT_TELEMETRY_DISABLED: "1",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.log(`[dev-stable] Exited with signal ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
