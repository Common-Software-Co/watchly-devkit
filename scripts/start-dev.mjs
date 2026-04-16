// Dev entry: regenerate dev-kiosk routes on app/ changes, run next dev.
import { execFileSync, spawn } from "child_process";
import chokidar from "chokidar";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const appDir = path.join(root, "app");
const generateScript = path.join(root, "scripts", "generate-dev-kiosk-routes.mjs");
const nextBin = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");

function generate() {
  execFileSync(process.execPath, [generateScript], { stdio: "inherit", cwd: root });
}

generate();

let debounceTimer;
function scheduleGenerate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      generate();
    } catch (e) {
      console.error(e);
    }
  }, 400);
}

chokidar
  .watch(appDir, {
    ignoreInitial: true,
    // Fewer duplicate events from editors that save in multiple steps.
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    ignored: [
      /(^|[/\\])\.DS_Store$/,
      /(^|[/\\])\.(?:git|svn|hg)(?:[/\\]|$)/,
    ],
  })
  .on("all", scheduleGenerate);

console.log(`[dev-kiosk routes] watching ${appDir}`);

const nextChild = spawn(nextBin, ["dev"], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    nextChild.kill(sig);
  });
}

nextChild.on("exit", (code) => {
  process.exit(code ?? 0);
});
