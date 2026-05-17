'use client';

import { useWatchlySWR } from '@/lib/watchly-swr';
import { useWatchlyContext } from '@/lib/watchly-provider';

/**
 * https://httpbin.org/get is a public API that echoes whatever request is sent to it
 * We're using it in this example to demonstrate how to build a component that makes an outbound API call
 * whenever the `currentSport` value changes in the `WatchlyContext`.
 *
 */
type HttpBinGetResponse = {
    /** Query string parameters echoed back (values are strings). */
    args: Record<string, string>;
    url: string;
};

const POLL_MS = 5000;

export default function DevDataFetchingPage() {
    const context = useWatchlyContext();

    const { data, error, isLoading, isValidating } = useWatchlySWR<HttpBinGetResponse, string>({
        namespace: 'httpbin-sport-echo',
        select: (ctx) => {
            const sport = ctx.frame.currentSport;
            return sport && sport.trim() !== '' ? sport.trim() : null;
        },
        fetcher: async (sport) => {
            const url = `https://httpbin.org/get?sport=${encodeURIComponent(sport)}`;
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return res.json() as Promise<HttpBinGetResponse>;
        },
        swr: {
            refreshInterval: POLL_MS,
        },
    });

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
            <header>
                <h1 className="text-2xl font-semibold tracking-tight">Watchly Devkit / dev data fetching</h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 py-4">
                    This example shows how to build a component that makes an outbound API call whenever the
                    `currentSport` value changes in the `WatchlyContext`. This is a common pattern for sidescreen apps
                    that rely on live data for a specific sport or team.
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 py-4">
                    Test it out by typing "basketball" into the <code className="font-mono text-xs">currentSport</code>{' '}
                    field in the message sidebar (the right side of the dev kiosk window). This simulates the Watchly
                    hardware sending a message to this sidescreen app, telling it that "basketball" is currently being
                    shown on the main screen.
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 py-4">
                    This app will then send an outbound API request to https://httpbin.org (a public API that simply
                    echoes the request back to you) and will display an emoji that represents the sport in the API
                    response.
                </p>
            </header>

            <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Host context (current sport)</h2>
                <p className="mt-2 font-mono text-sm text-zinc-800 dark:text-zinc-200">
                    {context.frame.currentSport ?? (
                        <span className="text-zinc-500">
                            null — (send a message with a &quot;currentSport&quot; field from the message sidebar in dev
                            kiosk)
                        </span>
                    )}
                </p>
            </section>

            <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Emojified API Response</h2>
                <p className="mt-1 mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                    This section demonstrates conditional rendering based on the API response
                </p>
                <p>
                    {data?.args.sport === 'basketball' && '🏀🏀🏀🏀🏀'}
                    {data?.args.sport === 'football' && '🏈🏈🏈🏈🏈'}
                    {data?.args.sport === 'tennis' && '🎾🎾🎾🎾🎾'}
                    {data?.args.sport === 'baseball' && '⚾⚾⚾⚾⚾'}
                    {data?.args.sport === 'hockey' && '🏒🏒🏒🏒🏒'}
                    {data?.args.sport === 'golf' && '🏌️🏌️🏌️🏌️🏌️'}
                </p>
            </section>
            <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Raw API Response (polling every {POLL_MS / 1000}s)
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Endpoint:{' '}
                    <code className="font-mono">
                        GET https://httpbin.org/get?sport={context.frame.currentSport ?? ''}
                    </code>
                </p>

                {error ? (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                        {error instanceof Error ? error.message : String(error)}
                    </p>
                ) : null}

                {!context.frame.currentSport?.trim() && !error ? (
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                        No fetch is performed because <code className="font-mono text-xs">select()</code> returns{' '}
                        <code className="font-mono text-xs">null</code> until a currentSport is set.
                    </p>
                ) : null}

                {context.frame.currentSport?.trim() && isLoading && !data ? (
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
                ) : null}

                {data ? (
                    <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                ) : null}

                {isValidating && data ? <p className="mt-2 text-xs text-zinc-500">Refreshing…</p> : null}
            </section>
        </div>
    );
}
