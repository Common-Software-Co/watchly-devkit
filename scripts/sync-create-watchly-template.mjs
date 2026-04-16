/**
 * Copies this repo’s Next app into packages/create-watchly-app/template for publishing.
 * Run from the repository root: node scripts/sync-create-watchly-template.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const TEMPLATE_ROOT = path.join(
  REPO_ROOT,
  "packages",
  "create-watchly-app",
  "template",
);

/** Directory names to skip anywhere under the repo root. */
const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  "coverage",
  "out",
  "build",
  ".vercel",
  "packages",
  ".cursor",
]);

const SKIP_FILES = new Set([
  ".env",
  "next-env.d.ts",
  "tsconfig.tsbuildinfo",
]);

function shouldCopyEntry(relPosix) {
  if (!relPosix) return true;
  const segments = relPosix.split("/").filter(Boolean);
  if (segments.some((s) => SKIP_DIR_NAMES.has(s))) return false;
  const base = path.posix.basename(relPosix);
  if (SKIP_FILES.has(base)) return false;
  if (relPosix === "scripts/sync-create-watchly-template.mjs") return false;
  if (base.endsWith(".tsbuildinfo")) return false;
  return true;
}

async function rmrf(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function copyTree(srcDir, destDir, relBase = "") {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const ent of entries) {
    const rel = relBase ? `${relBase}/${ent.name}` : ent.name;
    const relPosix = rel.split(path.sep).join("/");
    if (!shouldCopyEntry(relPosix)) continue;

    const from = path.join(srcDir, ent.name);
    const to = path.join(destDir, ent.name);
    if (ent.isDirectory()) {
      await fs.mkdir(to, { recursive: true });
      await copyTree(from, to, rel);
    } else if (ent.isFile() || ent.isSymbolicLink()) {
      if (ent.isSymbolicLink()) {
        // Skip symlinks (e.g. tooling); template should be plain files.
        continue;
      }
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.copyFile(from, to);
    }
  }
}

function normalizeTemplatePackageJson(text) {
  const pkg = JSON.parse(text);
  pkg.name = "watchly-app";
  delete pkg.private;
  if (pkg.scripts && typeof pkg.scripts === "object") {
    delete pkg.scripts["sync:create-template"];
  }
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

async function patchTemplatePackageFiles() {
  const pkgPath = path.join(TEMPLATE_ROOT, "package.json");
  const raw = await fs.readFile(pkgPath, "utf8");
  await fs.writeFile(pkgPath, normalizeTemplatePackageJson(raw), "utf8");

  const lockPath = path.join(TEMPLATE_ROOT, "package-lock.json");
  try {
    const lockRaw = await fs.readFile(lockPath, "utf8");
    const lock = JSON.parse(lockRaw);
    if (lock && typeof lock === "object" && "name" in lock) {
      lock.name = "watchly-app";
      const rootPkg = lock.packages?.[""];
      if (rootPkg && typeof rootPkg === "object" && "name" in rootPkg) {
        rootPkg.name = "watchly-app";
      }
      await fs.writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8");
    }
  } catch {
    // optional
  }
}

async function main() {
  await rmrf(TEMPLATE_ROOT);
  await fs.mkdir(TEMPLATE_ROOT, { recursive: true });
  await copyTree(REPO_ROOT, TEMPLATE_ROOT, "");
  await patchTemplatePackageFiles();
  console.log(`Template synced to ${path.relative(REPO_ROOT, TEMPLATE_ROOT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
