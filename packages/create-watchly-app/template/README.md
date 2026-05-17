![Watchly Logo](./docs/watchly-logo.png 'Watchly DevKit')

# Watchly Devkit (`watchly-devkit`)

Build your own content-aware, screen-side app for the Watchly.ai platform in 10 minutes with the devkit.

Learn more about the Watchly hardware at https://watchly.ai

> [**Watchly**](https://watchly.ai) uses an edge AI hardware device to monitor the content on a TV and feed metadata to your sidescreen app, which is typically shown on a second screen that's mounted alongside the main screen. The sidescreen app that you're building with this dev kit can use that data to choose what to display and how to act based on knowledge of what's on the adjacent "main screen".

This repository is a **Next.js (App Router)** kit for that companion app. In production, it runs **inside an iframe** on the kiosk device; the surrounding **parent page** owns the TV pipeline and talks to your bundle over **`window.postMessage()`**. You don’t poll for data - messages are exposed to your app through the React Context API as **`WatchlyContext`**.

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

## Building new content

This project is configured to use Next.js App Router conventions:

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
        /** Coarse visual category for the current frame. */
        imageRoute: WatchlyImageRoute;
        isCommercial: boolean;
        /** Sport name when applicable; `null` when not sport or unknown. */
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

1. **`event.origin`** must match **`NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS`** (exact serialized origin strings).
2. If we’re embedded (**`window.parent !== window`**), **`event.source`** must be **`window.parent`** so random nested frames can’t impersonate the kiosk chrome.

### Parent origins (`NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS`)

Browsers will include **`event.origin`** along with every **`postMessage`**. Your iframe child should **only** trust message from parents you expect.
**`NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS`** (in the `.env` file) is that allowlist as comma-separated **serialized origins** (scheme + host + port):

- Examples: `http://ui`, `http://localhost:3000`.
- **When unset or empty**, we default to **`http://ui`**—the usual production kiosk parent hostname.
- Origins **never** include a path segment; compare **`http://ui`**, not **`http://ui/`**.
- Non-default ports belong in the origin too, e.g. **`http://ui:8080`**.
