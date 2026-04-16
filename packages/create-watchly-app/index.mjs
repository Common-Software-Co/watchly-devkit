#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, "template");

function printHelp() {
  console.log(`Usage:
  npx create-watchly-app@latest [directory] [options]

Options:
  --skip-install    Do not run npm install
  --help, -h        Show this message

Creates a new directory with the Watchly Next.js app template.
`);
}

function toPackageName(dirName) {
  const base = path.basename(dirName);
  const slug = base
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
  if (!slug || slug === "." || slug === "..") {
    throw new Error(`Invalid project directory: ${dirName}`);
  }
  if (!/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-._~]+$/.test(slug)) {
    return slug.replace(/[^a-z0-9._@-]/g, "") || "watchly-app";
  }
  return slug;
}

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyTemplate(destRoot) {
  await fs.cp(TEMPLATE_DIR, destRoot, {
    recursive: true,
    errorOnExist: false,
  });
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function writeJson(file, data) {
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function applyPackageName(destRoot, name) {
  const pkgPath = path.join(destRoot, "package.json");
  const pkg = await readJson(pkgPath);
  pkg.name = name;
  await writeJson(pkgPath, pkg);

  const lockPath = path.join(destRoot, "package-lock.json");
  if (await pathExists(lockPath)) {
    try {
      const lock = await readJson(lockPath);
      if (lock && typeof lock === "object") lock.name = name;
      await writeJson(lockPath, lock);
    } catch {
      // ignore malformed lockfile
    }
  }
}

/** Copies .env.example to .env.local (cross-platform; same as cp). */
async function copyEnvExampleToLocal(destRoot) {
  const example = path.join(destRoot, ".env.example");
  const local = path.join(destRoot, ".env.local");
  if (!(await pathExists(example))) return;
  if (await pathExists(local)) return;
  await fs.copyFile(example, local);
}

function runNpmInstall(cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["install"], {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`npm install exited with code ${code}`));
    });
  });
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }

  const skipInstall = argv.includes("--skip-install");
  const positional = argv.filter((a) => !a.startsWith("-"));

  let targetDir = positional[0];
  if (!targetDir) {
    const rl = readline.createInterface({ input, output });
    const answer = await rl.question(
      "What is your project named? (e.g. my-watchly-app) ",
    );
    rl.close();
    targetDir = answer.trim();
  }

  if (!targetDir) {
    console.error("Error: project directory is required.");
    process.exit(1);
  }

  const destRoot = path.resolve(process.cwd(), targetDir);
  const pkgName = toPackageName(targetDir);

  if (await pathExists(destRoot)) {
    const entries = await fs.readdir(destRoot);
    if (entries.length > 0) {
      console.error(`Error: destination is not empty: ${destRoot}`);
      process.exit(1);
    }
  }

  if (!(await pathExists(TEMPLATE_DIR))) {
    console.error(
      "Error: template directory is missing. If you are developing create-watchly-app locally, run:\n  node scripts/sync-create-watchly-template.mjs",
    );
    process.exit(1);
  }

  await copyTemplate(destRoot);
  await applyPackageName(destRoot, pkgName);
  await copyEnvExampleToLocal(destRoot);

  if (!skipInstall) {
    console.log("\nInstalling dependencies with npm…\n");
    await runNpmInstall(destRoot);
  }

  console.log(`
Done. Next steps:

  cd ${path.relative(process.cwd(), destRoot) || "."}
  # .env.local was created from .env.example — edit if parent origins differ
  npm run dev

Open the printed local URL; use /dev-kiosk in development to simulate the parent iframe.
`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
