# `create-watchly-app`

Build your own content-aware, screen-side app for the Watchly.ai platform in 10 minutes with the devkit.

Learn more about the Watchly hardware at https://watchly.ai

[**Watchly**](https://watchly.ai) uses an edge AI hardware device to monitor the content on a TV and feed metadata to your sidescreen app, which is typically shown on a second screen that's mounted alongside the main screen. The sidescreen app that you're building with this dev kit can choose what to display and how to act based on knowledge of what's on the adjacent "main screen".

This package will bootstrap a React app using the [**Watchly Devkit**](https://github.com/Common-Software-Co/watchly-devkit): a Next.js Typescript project with Tailwind CSS.

## Usage

```bash
npx create-watchly-app@latest [directory] [options]
```

If you omit the directory, the CLI prompts for a project name.

### Options

| Flag             | Description                           |
| ---------------- | ------------------------------------- |
| `--use-npm`      | Install dependencies with npm         |
| `--use-pnpm`     | Install dependencies with pnpm        |
| `--use-yarn`     | Install dependencies with yarn        |
| `--use-bun`      | Install dependencies with bun         |
| `--skip-install` | Skip installing dependencies          |
| `--disable-git`  | Skip initializing a git repository    |
| `--yes`, `-y`    | Accept all defaults (non-interactive) |

By default the CLI will stick with whichever package manager invoked **`npx`** (via **`npm_config_user_agent`**); if we can’t tell, we fall back to npm.

## After install

```bash
cd your-project
npm run dev
```

Open the app in your browser -- **`/dev-kiosk`** is your playground: it emulates the Watchly browser and can simulate sending `watchly-context` messages to your app about what's on the main TV screen.

Developer documentation lives in the **[devkit README](https://github.com/Common-Software-Co/watchly-devkit/blob/main/README.md)**
and **`lib/watchly-schema.ts`** inside the generated project.

## Monorepo / publishing (maintainers)

If you maintain **`watchly-devkit`**, remember each npm release bundles the **`template/`** folder exactly as it sits beside **`index.mjs`**—release hygiene matters.

Ship checklist:

1. From the repo root, refresh **`template/`**:

```bash
npm run sync:create-template
```

2. Bump **`packages/create-watchly-app/package.json`**.

3. Publish from **`packages/create-watchly-app`**:

```bash
npm publish
```

Anyone pinning **`create-watchly-app@x.y.z`** forever receives that bundled template; fixes reach **new** projects through releases. Existing repos upgrade manually—or cherry-pick files—unless they re-run scaffolding.
