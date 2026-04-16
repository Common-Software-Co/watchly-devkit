'use client';

import { useMemo, type ReactNode } from 'react';
import useSWR, { SWRConfig, type SWRConfiguration } from 'swr';
import { useWatchlyContext } from './watchly-provider';
import type { WatchlyContext } from './watchly-schema';

/** Default SWR options tuned for iframe embeds (focus/reconnect behavior differs from a normal tab). */
export const defaultWatchlySWRConfig: SWRConfiguration = {
    revalidateOnFocus: false,
};

export type UseWatchlySWROptions<Data, Selected> = {
    /**
     * Short, static label for **this** request (e.g. `"sport-metadata"`). Don't include dynamic values
     * here (e.g. currentSport).  It is part of the SWR cache key together with the serialized result
     * of the `select` function, so the "select" result acts as the dynamic portion of the cache key.
     */
    namespace: string;
    /**
     * A function that receives the new WatchlyContext object and returns the piece of it that should
     * trigger a fetch. Return only the fields (or a small object) that should
     * **change when you need a new fetch**—smaller inputs mean fewer accidental refetches.
     * Return `null` or `undefined` to **disable** fetching. If this function uses other props besides the
     * WatchlyContext, wrap it in `useCallback` so the key does not churn every render.
     */
    select: (ctx: WatchlyContext) => Selected | null | undefined;
    /**
     * Async load for the current `select` output. The input argument is **only** the non-nullish value returned by
     * `select` — not the full `WatchlyContext`.
     */
    fetcher: (selected: Selected) => Promise<Data>;
    /**
     * Optional SWR options for this hook only. If you use {@link WatchlySWRProvider}, each layer merges:
     * {@link defaultWatchlySWRConfig} defaults, then the provider’s `value`, then this `swr` object (last wins).
     */
    swr?: SWRConfiguration;
};

function serializeSelected(selected: unknown): string {
    return JSON.stringify(selected);
}

/**
 * This hook provides the standard way to load data from an async API in reaction to a new message from
 * the **parent page** (that sends data into this iframe).
 *
 * **The flow of data:**
 *   1. The parent page (which loads this app in an iframe) pushes TV image recognition state through
 *      `postMessage` and this app exposes it as `WatchlyContext`.
 *   2. This hook runs the `select` function, passing the new `WatchlyContext` as an argument.  The return value is a subset of
 *      the WatchlyContext that should trigger a fetch. If the piece of WatchlyContext returned by the `select` function is
 *      different from the last time the hook ran, the hook executes the `fetcher` function.
 *      (e.g. the "currentSport" field of WatchlyContext changes from "basketball" to "football")
 *   3. The hook fetches data from the specified endpoint and caches the result.
 *      You avoid hand-written `useEffect` + fetch logic wrapped around every outbound request.
 *
 * **When not to use:**
 *   1. If you only need to read "host state" (e.g. the current sport), use {@link useWatchlyContext} directly
 *   2. If the fetch is not triggered by a change to Watchly context, use `useSWR` directly with your own cache key.
 *
 * **Pattern:**
 *   1. Implement `select` to return the piece of `WatchlyContext` that should trigger a fetch (e.g. "ctx.frame.currentSport").
 *   2. When that value changes, SWR runs the `fetcher` function. Return `null` or `undefined` from `select` to skip fetching.
 *      (e.g. wait until a sport is known).
 *   3. Stabilize `select` with `useCallback` when it closes over props or other values, so the key does not change every render.
 *
 * @example
 * Fetch metadata whenever the currentSport changes; do nothing until `currentSport` is set:
 *
 * ```tsx
 * const { data, error, isLoading } = useWatchlySWR({
 *   namespace: "sport-metadata", // fixed label for this query—not the sport string
 *   select: (ctx) => ctx.frame.currentSport, // sport is already part of the SWR key via `select`
 *   fetcher: (sport) =>
 *     fetch(`/api/sport-metadata?sport=${encodeURIComponent(sport)}`).then((res) => res.json()),
 * });
 * ```
 */
export function useWatchlySWR<Data, Selected>(options: UseWatchlySWROptions<Data, Selected>) {
    const { namespace, select, fetcher, swr: swrOptions } = options;
    const context = useWatchlyContext();

    const selected = select(context);

    const swrKey = useMemo((): readonly ['watchly', string, string] | null => {
        if (selected == null) {
            return null;
        }
        return ['watchly', namespace, serializeSelected(selected)] as const;
    }, [namespace, selected]);

    return useSWR<Data>(swrKey, () => fetcher(selected as Selected), swrOptions);
}

export type WatchlySWRProviderProps = {
    children: ReactNode;
    /** Merged over {@link defaultWatchlySWRConfig}. */
    value?: SWRConfiguration;
};

/** App-wide SWR defaults; wrap inside {@link WatchlyProvider} so `useWatchlySWR` can read context. */
export function WatchlySWRProvider({ children, value }: WatchlySWRProviderProps) {
    return <SWRConfig value={{ ...defaultWatchlySWRConfig, ...value }}>{children}</SWRConfig>;
}
