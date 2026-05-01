# `create-watchly-app`

Build your own content-aware, screen-side app for the Watchly.ai platform in 10 minutes with the devkit.
Learn more about the Watchly hardware at https://watchly.ai

This CLI will scaffold a [**Watchly Devkit**](https://github.com/Common-Software-Co/watchly-devkit) app: it runs [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) with `--example` pointing at the devkit repository, then copies `.env.example` → `.env.local` when that file is not already present.

## Usage

```bash
npx create-watchly-app@latest [directory] [options]
```

If you omit the directory, the CLI prompts for a project name.

Any extra flags are forwarded to `create-next-app` (for example `--typescript`, `--eslint`, `--skip-install`, `--yes`). Run `npx create-next-app@latest --help` for the full list.

## Environment

| Variable                     | Description                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WATCHLY_DEVKIT_EXAMPLE_URL` | Git archive URL passed to `create-next-app --example`. Defaults to `https://github.com/Common-Software-Co/watchly-devkit`. Set this when using a fork or a pinned ref. |

## After install

```bash
cd your-project
npm run dev
```

Open the URL printed in the terminal. In development, use **`/dev-kiosk`** to simulate the parent window and send `watchly:context` messages to the iframe.

For the host contract, embedding model, and **`WatchlyContext`** shape, see the [devkit README](https://github.com/Common-Software-Co/watchly-devkit/blob/main/README.md) and `lib/watchly-schema.ts` in the generated app.

## Monorepo / publishing (maintainers)

This directory lives inside the **`watchly-devkit`** repo. The **`template/`** subtree is a full copy of the app used for packaging workflows; the **npm package** published from here currently ships the CLI entrypoint (`index.mjs`) as declared in `"files"` in `package.json`.

Before releasing a new CLI version, refresh `template/` from the repo root with:

```bash
npm run sync:create-template
```

(from the repository root), then bump the version and publish from `packages/create-watchly-app`.
