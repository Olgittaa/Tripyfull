// Starts the backend for Claude Code's Browser pane (.claude/launch.json → "backend").
// Launched with `node` on purpose: on macOS the pane's runner lets a node-rooted
// process tree read the project, while a plain `bash -c` gets "Operation not permitted".
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const backend = join(root, "backend");

// Java 25 via SDKMAN unless the environment already points somewhere.
const sdkmanJava = join(
  process.env.HOME || "",
  ".sdkman/candidates/java/25.0.2-tem",
);
const env = { ...process.env };
if (!env.JAVA_HOME && existsSync(sdkmanJava)) env.JAVA_HOME = sdkmanJava;

spawnSync("docker", ["compose", "up", "-d", "db"], {
  cwd: root,
  stdio: "inherit",
});

const mvn = spawn("./mvnw", ["-q", "spring-boot:run"], {
  cwd: backend,
  env,
  stdio: "inherit",
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => mvn.kill(sig));
mvn.on("exit", (code) => process.exit(code ?? 1));
