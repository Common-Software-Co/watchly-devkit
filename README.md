![Watchly Logo](./docs/watchly-logo.png 'Watchly DevKit')

# Watchly Devkit (`watchly-devkit`)

New here? Here’s the mental model in one breath: **Watchly hardware sits next to a TV**, watches what’s on screen, and turns that into structured signals—sport vs. not, coarse scene type, ads, sometimes teams or participants. **Your job is the companion UI**: the thing patrons actually tap or glance at on the kiosk.

This repository is a **Next.js (App Router)** kit for that companion app. In production it runs **inside an iframe** on the kiosk device; the surrounding **parent page** owns the TV pipeline and talks to your bundle over **`window.postMessage()`**. You don’t poll or scrape the iframe URL—messages arrive, get validated, and land in React as **`WatchlyContext`**.

Hardware and product story: https://watchly.ai

## Start a new project

Easiest path: [`create-watchly-app`](https://www.npmjs.com/package/create-watchly-app) copies the bundled template into your folder, installs dependencies, seeds **`.env.local`** from **`.env.example`**, and can **`git init`** for you—no GitHub checkout required at scaffold time.

```bash
npx create-watchly-app@latest my-project
cd my-project && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in the terminal).

## DevKiosk (development only)

Locally you usually **don’t** have the full kiosk stack—or a live HDMI feed—to exercise your UI. **`/dev-kiosk`** fills that gap: it behaves like the **parent** window, drops your routes into a real iframe, and lets you manually send **`watchly:context`** payloads so you can see how screens react before you ship anything.

<img src="docs/dev-kiosk.png" />

- **Right sidebar:** pretend you’re the parent—fire **`watchly:context`** messages at the iframe (same envelope production uses).
- **Left sidebar:** quick jumps between App Router pages; add **`app/foo/page.tsx`** and it shows up here while **`npm run dev`** is watching files.
- **Center:** your app, embedded like it will be on device.
- **Outside development:** this route **404s** on purpose (`NODE_ENV !== 'development'`).

## How Your App Is Embedded In The "Parent" Kiosk Window

At runtime the kiosk host owns the outer document; your bundle is just **`src`** on an iframe. When inference updates land in that host, it forwards them with **`iframe.contentWindow.postMessage(...)`** using an explicit **`targetOrigin`**—same pattern you’d use for any tightly coupled cross-origin embedding.

```html
<iframe id="watchly" src="https://your-watchly-host.example/path" title="Watchly Devkit"></iframe>
```

Then messages are sent:

```js
const iframe = document.getElementById('watchly');
const childOrigin = 'https://your-watchly-app-host.example'; // must match iframe src origin
iframe.contentWindow.postMessage(
    {
        type: 'watchly:context',
        payload: {
            frame: {
                frameSequence: 3920,
                isSport: true,
                nonSportFrameCount: 0,
                imageRoute: 'basketball',
                isCommercial: false,
                currentSport: 'Basketball',
                currentEventParticipants: ['Team A', 'Team B'],
            },
            device: {
                deviceId: 'device-123',
                locationName: 'Example Venue',
            },
        },
    },
    childOrigin,
);
```

On your side, the devkit listens on **`window`**, filters noise, validates the envelope, and feeds **`WatchlyProvider`**—components call **`useWatchlyContext()`** like any other React context.

## Parent origins (`NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS`)

Browsers tell you **`event.origin`** for every **`postMessage`**; your iframe child should **only** trust parents you expect. **`NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS`** is that allowlist as comma-separated **serialized origins** (scheme + host + port):

- Examples: `http://ui`, `http://localhost:3000`.
- **When unset or empty**, we default to **`http://ui`**—the usual production kiosk parent hostname.
- Origins **never** include a path segment; compare **`http://ui`**, not **`http://ui/`**.
- Non-default ports belong in the origin too, e.g. **`http://ui:8080`**.

When **you** call **`postMessage`** from the parent, match **`targetOrigin`** to your iframe’s actual origin (scheme + host + port). Avoid **`'*'`** outside quick hacks—the parent’s origin still has to appear on the child’s allowlist or we drop the message.

## Building new content

You’re on plain Next.js App Router conventions:

1. Add a folder under **`app/`**—that folder name becomes the URL segment (`app/scores` → **`/scores`**).
2. Drop in **`page.tsx`** with a default export (your React tree for that route).

For a tiny reference implementation that actually consumes context, skim **[`app/dev-datafetching/page.tsx`](./app/dev-datafetching/page.tsx)**.

## `WatchlyContext` (message payload)

Production traffic looks like **`{ type: 'watchly:context', payload: WatchlyContext }`**. We mirror that shape in [`lib/watchly-schema.ts`](./lib/watchly-schema.ts) and validate with **Zod** before anything touches React state—garbage-in gets ignored quietly (with a dev-only heads-up).

```ts
type WatchlyImageRoute =
    | 'football'
    | 'basketball'
    | 'commercial'
    | 'sportscast'
    | 'talkshow'
    | 'episode'
    | 'baseball'
    | 'tennis'
    | 'hockey'
    | 'golf'
    | 'boxing'
    | 'unknown';

type WatchlyContext = {
    frame: {
        /** Monotonic frame counter from the device (starts at 1 when powered on). */
        frameSequence: number;
        /** Whether the TV content is classified as sport. */
        isSport: boolean;
        /** Frames since sport was last detected. */
        nonSportFrameCount: number;
        /** Coarse visual category for the current frame (i.e. 'football', 'commercial', 'talkshow', etc). */
        imageRoute: WatchlyImageRoute;
        /** Whether or not a TV commercial is currently showing on the main screen. */
        isCommercial: boolean;
        /**
         * Sport name when applicable (i.e. "football", "baseball", etc); `null` when not sport or unknown.
         * NOTE: if the currentSport is non-null, it will retain its vlue
         */
        currentSport: string | null;
        /** Participant names (e.g. teams) when identified; otherwise `null`. */
        currentEventParticipants: string[] | null;
    };
    device: {
        deviceId: string | null;
        locationName: string | null;
    };
};
```

**How to read it:** **`frame.imageRoute`** answers “what bucket did inference pick?”—usually what you want for visuals. Ads flip **`isCommercial`** and often set **`imageRoute`** to **`'commercial'`**, but **`currentSport`** may still hint at what’s coming back after the break—whether you fade UI, freeze the last hero moment, or clear the slate is entirely your product call.

Malformed payloads never mutate context; **`npm run dev`** logs enough breadcrumbs to debug typos.

## Security behavior (iframe child)

Defense in depth stays boring on purpose:

1. **`event.origin`** must match **`NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS`** (exact serialized origin strings).
2. If we’re embedded (**`window.parent !== window`**), **`event.source`** must be **`window.parent`** so random nested frames can’t impersonate the kiosk chrome.

<!-- BEGIN:watchly-monorepo-contributors -->

## Contributing

Contributing to **this** repository (not a generated app)? Clone it, copy env from **`.env.example`**, and run **`npm run dev`** like any other Next.js checkout:

### Setup

```bash
git clone https://github.com/Common-Software-Co/watchly-devkit
cd watchly-devkit
npm install
cp .env.example .env.local
# Edit .env.local if your parent origin is not covered by the defaults
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in the terminal).

### Publishing

From `packages/create-watchly-app`, run `npm publish` (see that package’s README for what the published tarball contains).

Maintainers: after changing app files, run `npm run sync:create-template` so the committed template stays in sync before you ship a new CLI version.

<!-- END:watchly-monorepo-contributors -->
