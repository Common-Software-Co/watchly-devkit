#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, 'template');

function printHelp() {
    console.log(`Usage:
  npx create-watchly-app@latest [directory] [options]

Scaffolds a new Watchly Devkit app (Next.js, TypeScript, Tailwind CSS).

Options:
  --use-npm         Install dependencies with npm
  --use-pnpm        Install dependencies with pnpm
  --use-yarn        Install dependencies with yarn
  --use-bun         Install dependencies with bun
  --skip-install    Skip installing dependencies
  --disable-git     Skip initializing a git repository
  --yes, -y         Accept all defaults (non-interactive)
  --help, -h        Show this message
`);
}

async function pathExists(p) {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

function detectPackageManager() {
    const agent = process.env.npm_config_user_agent ?? '';
    if (agent.startsWith('pnpm')) return 'pnpm';
    if (agent.startsWith('yarn')) return 'yarn';
    if (agent.startsWith('bun')) return 'bun';
    return 'npm';
}

function getPackageManager(argv) {
    if (argv.includes('--use-pnpm')) return 'pnpm';
    if (argv.includes('--use-yarn')) return 'yarn';
    if (argv.includes('--use-bun')) return 'bun';
    if (argv.includes('--use-npm')) return 'npm';
    return detectPackageManager();
}

/**
 * Copies the template tree into dest. npm renames .gitignore → gitignore in
 * published tarballs; we restore the leading dot on copy.
 */
async function copyTemplate(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destName = entry.name === 'gitignore' ? '.gitignore' : entry.name;
        const destPath = path.join(dest, destName);
        if (entry.isDirectory()) {
            await copyTemplate(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

async function copyEnvExampleToLocal(destRoot) {
    const example = path.join(destRoot, '.env.example');
    const local = path.join(destRoot, '.env.local');
    if (!(await pathExists(example))) {
        console.warn(`Warning: no .env.example in ${destRoot}; skipped creating .env.local.`);
        return;
    }
    if (await pathExists(local)) return;
    await fs.copyFile(example, local);
    console.log('Created .env.local from .env.example (edit if parent origins differ).\n');
}

function run(cmd, args, cwd) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, {
            stdio: 'inherit',
            cwd,
            shell: process.platform === 'win32',
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${cmd} exited with code ${code}`));
        });
    });
}

async function install(pm, cwd) {
    const cmds = {
        npm: ['npm', ['install']],
        pnpm: ['pnpm', ['install']],
        yarn: ['yarn', []],
        bun: ['bun', ['install']],
    };
    const [cmd, args] = cmds[pm];
    console.log(`Installing dependencies with ${pm}...\n`);
    await run(cmd, args, cwd);
}

async function initGit(cwd) {
    try {
        await run('git', ['init'], cwd);
        await run('git', ['add', '-A'], cwd);
        await run('git', ['commit', '-m', 'Initialize Watchly Devkit app', '--allow-empty'], cwd);
    } catch {
        // git may not be available; non-fatal
    }
}

function firstPositional(argv) {
    return argv.find((a) => !a.startsWith('-'));
}

async function main() {
    let argv = process.argv.slice(2);

    if (argv.includes('--help') || argv.includes('-h')) {
        printHelp();
        return;
    }

    const skipInstall = argv.includes('--skip-install');
    const disableGit = argv.includes('--disable-git');
    const yes = argv.includes('--yes') || argv.includes('-y');
    const pm = getPackageManager(argv);

    if (!firstPositional(argv)) {
        if (yes) {
            console.error('Error: project directory is required (no prompt in --yes mode).');
            process.exit(1);
        }
        const rl = readline.createInterface({ input, output });
        const answer = await rl.question('What is your project named? (e.g. my-watchly-app) ');
        rl.close();
        const name = answer.trim();
        if (!name) {
            console.error('Error: project directory is required.');
            process.exit(1);
        }
        argv = [name, ...argv];
    }

    const projectDir = firstPositional(argv);
    if (!projectDir) {
        console.error('Error: could not determine project directory.');
        process.exit(1);
    }

    const destRoot = path.resolve(process.cwd(), projectDir);

    if (await pathExists(destRoot)) {
        console.error(`Error: directory "${projectDir}" already exists.`);
        process.exit(1);
    }

    console.log(`\nCreating a new Watchly Devkit app in ${destRoot}.\n`);

    await copyTemplate(TEMPLATE_DIR, destRoot);
    await copyEnvExampleToLocal(destRoot);

    if (!disableGit) {
        await initGit(destRoot);
    }

    if (!skipInstall) {
        await install(pm, destRoot);
    }

    const rel = path.relative(process.cwd(), destRoot) || '.';
    console.log(`
Done! Created ${projectDir}.

Next steps:

  cd ${rel}
  ${pm === 'npm' ? 'npm run dev' : `${pm} dev`}

Open the printed local URL. Use /dev-kiosk in development to simulate the parent iframe.
`);
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
