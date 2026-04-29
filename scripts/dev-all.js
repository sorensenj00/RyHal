const { spawn } = require("child_process");
const path = require("path");
const readline = require("readline");

const rootDir = path.resolve(__dirname, "..");

const services = [
  {
    name: "api",
    cwd: "SportCenter.Api",
    command: "dotnet",
    args: ["run"],
  },
  {
    name: "admin",
    cwd: "admin-dashboard",
    command: "npm",
    args: ["start"],
  },
  {
    name: "employee",
    cwd: "employee-app",
    command: "npm",
    args: ["run", "dev"],
  },
];

const children = [];
let shuttingDown = false;

function toCommandString(command, args) {
  const parts = [command, ...args];
  return parts.join(" ");
}

function prefixStream(stream, name) {
  const rl = readline.createInterface({ input: stream });
  rl.on("line", (line) => {
    process.stdout.write(`[${name}] ${line}\n`);
  });
}

function startService(service) {
  const child = spawn(toCommandString(service.command, service.args), [], {
    cwd: path.join(rootDir, service.cwd),
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  prefixStream(child.stdout, service.name);
  prefixStream(child.stderr, service.name);

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code}`;
    process.stderr.write(`[${service.name}] exited with ${reason}\n`);

    const exitCode = Number.isInteger(code) ? code : 1;
    shutdown(exitCode);
  });

  children.push(child);
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
    process.exit(exitCode);
  }, 5000).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

process.stdout.write("Starter alle tre services...\n");
process.stdout.write("API: http://localhost:5172\n");
process.stdout.write("Admin: http://localhost:3000\n");
process.stdout.write("Employee: http://localhost:5173\n");
process.stdout.write("Tryk Ctrl+C for at stoppe dem alle.\n");

for (const service of services) {
  startService(service);
}
