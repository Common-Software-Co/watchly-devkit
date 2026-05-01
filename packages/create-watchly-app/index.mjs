#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const DEFAULT_EXAMPLE = 'https://github.com/Common-Software-Co/watchly-devkit';

/** Override for forks/tests: `WATCHLY_DEVKIT_EXAMPLE_URL=<url> node index.mjs …` */
const EXAMPLE_URL = process.env.WATCHLY_DEVKIT_EXAMPLE_URL?.trim() || DEFAULT_EXAMPLE;

function printHelp() {
    console.log(`Usage:
  npx create-watchly-app@latest [directory] [options]

Runs create-next-app using the Watchly devkit example, then copies
.env.example → .env.local in the new project.

Options:
  Any flags supported by create-next-app (e.g. --typescript, --tailwind,
  --eslint, --skip-install, --yes). Use create-next-app --help for the full list.

  --help, -h        Show this message

Environment:
  WATCHLY_DEVKIT_EXAMPLE_URL   Git archive URL passed to create-next-app --example
                               (default: ${DEFAULT_EXAMPLE})
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

/** Copies .env.example to .env.local (cross-platform; same idea as cp). */
async function copyEnvExampleToLocal(destRoot) {
    const example = path.join(destRoot, '.env.example');
    const local = path.join(destRoot, '.env.local');
    if (!(await pathExists(example))) {
        console.warn(`Warning: no .env.example in ${destRoot}; skipped creating .env.local.`);
        return;
    }
    if (await pathExists(local)) return;
    await fs.copyFile(example, local);
    console.log('\nCreated .env.local from .env.example (edit if parent origins differ).\n');
}

function firstPositional(argv) {
    return argv.find((a) => !a.startsWith('-'));
}

/**
 * Removes --example and its value so we always use the Watchly devkit URL.
 */
function stripExampleFlag(argv) {
    const out = [];
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--example' || a.startsWith('--example=')) {
            if (a.startsWith('--example=')) continue;
            i++;
            continue;
        }
        out.push(a);
    }
    return out;
}

function runCreateNextApp(cnaArgv) {
    const args = ['create-next-app@latest', '--example', EXAMPLE_URL, ...cnaArgv];
    return new Promise((resolve, reject) => {
        const child = spawn('npx', args, {
            stdio: 'inherit',
            shell: process.platform === 'win32',
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`create-next-app exited with code ${code}`));
        });
    });
}

async function main() {
    let argv = process.argv.slice(2);
    if (argv.includes('--help') || argv.includes('-h')) {
        printHelp();
        return;
    }

    argv = stripExampleFlag(argv);

    if (!firstPositional(argv)) {
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

    await runCreateNextApp(argv);

    const destRoot = path.resolve(process.cwd(), projectDir);
    await copyEnvExampleToLocal(destRoot);

    console.log(`
Done. Next steps:

  cd ${path.relative(process.cwd(), destRoot) || '.'}
  npm run dev

Open the printed local URL; use /dev-kiosk in development to simulate the parent iframe.
`);
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
