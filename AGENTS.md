# watchlySdk — agent / contributor notes

## What this project is

**watchlySdk** (`watchly-sdk/`) is a **standalone** Next.js (App Router) app meant to run **inside an `<iframe>`** on a Watchly device. It includes an opinionated messaging layer to receive messages from the the Watchly host page and updates a React context object with details about what's on the main TV (the one that Watchly is monitoring).

## How it is loaded and how it gets “host” state

### Embedding model

1. A **parent page** (the “host”, e.g. a thin React app wrapper on a Watchly kiosk device) loads this app by setting the iframe’s **`src`** to this app's URL.
2. The iframe document is **this Next.js app**. It is typically **cross-origin** from the parent in production.
3. **Live data updates** from parent to iframe use **`window.postMessage`**, not repeatedly changing or refreshing `iframe.src`. Rewriting the iframe URL for every update forces full navigations and is the wrong model for high-frequency context.

### Message flow (parent → iframe)

- The parent obtains a reference to the iframe’s window (e.g. `iframe.contentWindow`) and calls:
    - `contentWindow.postMessage(message, targetOrigin)`
- **`targetOrigin`** must be this app’s **serialized origin** (e.g. `https://watchly.example.com`), matching the iframe `src` origin—not `*` in production.
- The child (**this app**) listens on `window` for `message` events. Only messages that pass **origin allowlisting** and **schema validation** update UI state.

### Envelope and payload

- Expected shape: `{ type: "watchly:context", payload: WatchlyContext }`.
- **`WatchlyContext`** is defined in [`lib/watchly-schema.ts`](lib/watchly-schema.ts) and validated with **Zod** (`watchlyContextMessageSchema` in [`lib/watchly-post-message.ts`](lib/watchly-post-message.ts)).
- The React tree reads the latest validated payload from **`WatchlyProvider`** / **`useWatchlyContext()`** ([`lib/watchly-provider.tsx`](lib/watchly-provider.tsx)).

### Security (non-negotiable)

- **`NEXT_PUBLIC_ALLOWED_PARENT_ORIGINS`**: comma-separated list of **parent** origins that may send messages. If unset or empty, parsing defaults to **`http://ui`** (production kiosk parent hostname). Compare **`event.origin`** to this allowlist exactly (serialized origins have **no** path; use `http://ui`, not `http://ui/`).
- When embedded (`window.parent !== window`), require **`event.source === window.parent`** so only the direct parent can drive context.
- **Do not** `console.warn` or run Zod on every `message` event: unrelated same-origin traffic (e.g. dev HMR) exists. **Gate on `event.data?.type === "watchly:context"`** before parsing; see [`lib/watchly-provider.tsx`](lib/watchly-provider.tsx).

## Dev-only tooling

- **`/dev-kiosk`**: simulates the **parent** window (iframe + form + `postMessage`). Available only when `NODE_ENV === "development"` (otherwise `notFound()`).
- Route list for the left sidebar is **generated** by `npm run generate:dev-kiosk-routes` → [`lib/dev-kiosk-routes.generated.ts`](lib/dev-kiosk-routes.generated.ts) (`predev` / `prebuild` run it when dev server first starts + file watcher re-runs it if routes are modified).

## Implementation constraints

- **No imports** from `../frontend`, `../backend`, or other monorepo packages.
- Prefer extending **`WatchlyProvider`**, **`watchly-schema`**, and the postMessage envelope rather than ad hoc globals.
- Keep README and `.env.example` aligned when changing env vars or the host contract.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
