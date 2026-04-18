# Watchly Devkit (`watchly-devkit`)

A starter app, built with Next.js (App Router), that's intended to build dynamic content for Watchly kiosk displays.
Watchly apps are loaded in an iframe that's hosted on the kiosk device itself and receive data from the host device
via messages (**`window.postMessage()`**) from the parent page to the iframe;
The app that you build with this devkit is intended to be the iframe content and it will be able to access all of the kiosk's image inference data through the **`WatchlyContext`**.

## Start a New project with `create-watchly-app`

Bootstrap a new app in a new directory:

```bash
npx create-watchly-app@latest
# or: npx create-watchly-app@latest my-watchly-app
```

The CLI copies `.env.example` to `.env.local` for you (edit if parent origins differ).

### Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local if your parent origin is not covered by the defaults
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in the terminal).

## Contributors

### Publishing

From `packages/create-watchly-app`, run `npm publish` (or your registry workflow).
The `prepublishOnly` script refreshes `template/` from this repo so the published tarball always matches the app sources.

Maintainers: after changing app files, run `npm run sync:create-template` so the committed template stays in sync before you ship a new CLI version.

## DevKiosk (development only)

<img src="docs/dev-kiosk.png" />

**`/dev-kiosk`** simulates the **parent** window: a collapsible **left** sidebar lists detected App Router pages (from `lib/dev-kiosk-routes.generated.ts`, updated by **`npm run generate:dev-kiosk-routes`**). During **`npm run dev`**, `scripts/start-dev.mjs` runs that generator once at startup and again whenever files under **`app/`** change (no dev-server restart). **`prebuild`** runs the same generator before **`npm run build`**. The **center** shows an iframe; the collapsible **right** sidebar builds `watchly:context` payloads. **`frameSequence`** auto-increments on each **Send to iframe**. Same **`npm run dev`** as the rest of the app — open **`/dev-kiosk`** in the browser.

- **Production:** this route returns **404** (`NODE_ENV !== 'development'`).
- **Allowlist:** the iframe is same-origin in local dev; ensure **`NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS`** includes your dev origin (e.g. `http://localhost:3000`), as in [`.env.example`](.env.example).
- **Manual path:** override the iframe URL (paths or query strings) without regenerating routes.
- **Terminal noise:** the route watcher only observes **`app/`** (writes under **`lib/`** do not retrigger it). Alternating **`GET /dev-kiosk`** and **`GET /example`** (or your iframe path) are the page and its iframe. After the generator updates `lib/dev-kiosk-routes.generated.ts`, Next may log several refetches while dev mode settles.

## Parent origins (`NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS`)

- Comma-separated list of **serialized origins** (scheme + host + port), e.g. `http://ui`, `http://localhost:3000`.
- **When unset or empty**, the app defaults to **`http://ui`** only (production kiosk parent hostname).
- Browsers report `event.origin` **without** a path: use **`http://ui`**, not `http://ui/`.
- If kiosks use a non-default port, include it explicitly, e.g. `http://ui:8080`.

## Embedding

Host page loads this app in an iframe whose `src` is the deployed Watchly Devkit URL (HTTPS in production).

```html
<iframe id="watchly" src="https://your-watchly-host.example/path" title="Watchly Devkit"></iframe>
```

From the parent (same document that owns the iframe):

```js
const iframe = document.getElementById('watchly');
const childOrigin = 'https://your-watchly-host.example'; // must match iframe src origin

iframe.contentWindow.postMessage(
    {
        type: 'watchly:context',
        payload: {
            frame: {
                frameSequence: 1,
                isSport: true,
                nonSportFrameCount: 0,
                imageRoute: '/assets/frame.png',
                isCommercial: false,
                currentSport: 'Basketball',
                currentEventParticipants: ['Team A', 'Team B'],
            },
        },
    },
    childOrigin,
);
```

- **`targetOrigin`** (second argument) should be the iframe’s **origin** (scheme + host + port), not `*` in production.
- The parent’s origin must appear in **`NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS`** on the child so the iframe accepts the message.

## Message shape

| Field     | Type                | Description        |
| --------- | ------------------- | ------------------ |
| `type`    | `"watchly:context"` | Discriminator      |
| `payload` | `WatchlyContext`    | Validated with Zod |

`WatchlyContext`:

```ts
type WatchlyContext = {
    frame: {
        frameSequence: number;
        isSport: boolean;
        nonSportFrameCount: number;
        imageRoute: string;
        isCommercial: boolean;
        currentSport: string | null;
        currentEventParticipants: string[] | null;
    };
};
```

Invalid messages are ignored; in development, a warning is logged.

## Security behavior (iframe child)

1. **`event.origin`** must be in the allowlist.
2. When the page is embedded (`window.parent !== window`), **`event.source`** must be **`window.parent`**.
