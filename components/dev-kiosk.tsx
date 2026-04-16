'use client';

import { useCallback, useRef, useState } from 'react';
import type { DevKioskAppRoute } from '@/lib/dev-kiosk-routes.generated';
import type { WatchlyContext } from '@/lib/watchly-schema';

function pickDefaultIframePath(routes: readonly string[]): string {
    if (routes.includes('/example')) {
        return '/example';
    }
    return routes[0] ?? '/';
}

export type DevKioskProps = {
    routes: readonly DevKioskAppRoute[];
};

function parseParticipants(text: string): string[] | null {
    const t = text.trim();
    if (!t) return null;
    return t
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

export function DevKiosk({ routes }: DevKioskProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeReady, setIframeReady] = useState(false);

    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(false);

    const [iframePath, setIframePath] = useState(() => pickDefaultIframePath(routes));
    const [manualPath, setManualPath] = useState(() => pickDefaultIframePath(routes));

    const [nextFrameSequence, setNextFrameSequence] = useState(1);

    const [isSport, setIsSport] = useState(false);
    const [nonSportFrameCount, setNonSportFrameCount] = useState(0);
    const [imageRoute, setImageRoute] = useState('');
    const [isCommercial, setIsCommercial] = useState(false);
    const [currentSport, setCurrentSport] = useState('');
    const [participantsText, setParticipantsText] = useState('');

    const sendToIframe = useCallback(() => {
        const win = iframeRef.current?.contentWindow;
        if (!win || typeof window === 'undefined') return;

        const targetOrigin = window.location.origin;

        const seq = nextFrameSequence;
        const payload: WatchlyContext = {
            frame: {
                frameSequence: seq,
                isSport,
                nonSportFrameCount,
                imageRoute,
                isCommercial,
                currentSport: currentSport.trim() === '' ? null : currentSport.trim(),
                currentEventParticipants: parseParticipants(participantsText),
            },
        };

        const message = {
            type: 'watchly:context' as const,
            payload,
        };

        win.postMessage(message, targetOrigin);
        setNextFrameSequence(n => n + 1);
    }, [nextFrameSequence, isSport, nonSportFrameCount, imageRoute, isCommercial, currentSport, participantsText]);

    const applyManualPath = useCallback(() => {
        const p = manualPath.trim() || '/';
        const normalized = p.startsWith('/') ? p : `/${p}`;
        setIframeReady(false);
        setIframePath(normalized);
    }, [manualPath]);

    return (
        <div className="flex h-[100dvh] min-h-0 flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
            <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
                <h1 className="text-sm font-semibold tracking-tight">DevKiosk</h1>
                <p className="max-w-xl text-xs text-zinc-500 dark:text-zinc-400">
                    Parent simulator (dev only). Iframe loads watchlySdk routes; postMessage uses{' '}
                    <code className="font-mono" suppressHydrationWarning title="Origin is only known in the browser">
                        {typeof window !== 'undefined' ? window.location.origin : '…'}
                    </code>
                    .
                </p>
            </header>

            <div className="flex min-h-0 min-w-0 flex-1">
                {/* Left: routes */}
                <aside
                    className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-900 ${
                        leftCollapsed ? 'w-10' : 'w-56'
                    }`}
                >
                    <button
                        type="button"
                        onClick={() => setLeftCollapsed(c => !c)}
                        className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        aria-expanded={!leftCollapsed}
                    >
                        <span className={leftCollapsed ? 'sr-only' : ''}>Routes</span>
                        <span aria-hidden>{leftCollapsed ? '»' : '«'}</span>
                    </button>
                    {!leftCollapsed && (
                        <nav className="min-h-0 flex-1 overflow-y-auto p-2">
                            <ul className="space-y-1">
                                {routes.map(route => (
                                    <li key={route}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIframeReady(false);
                                                setIframePath(route);
                                                setManualPath(route);
                                            }}
                                            className={`w-full rounded-md px-2 py-1.5 text-left font-mono text-xs ${
                                                iframePath === route
                                                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            {route}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}
                </aside>

                {/* Center: portrait TV frame + iframe (1080×1920 / 9:16) */}
                <div className="flex min-w-0 flex-1 flex-col bg-zinc-200/80 dark:bg-zinc-950">
                    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <label className="flex min-w-0 flex-1 items-center gap-2 text-xs">
                            <span className="shrink-0 text-zinc-500">Manual path</span>
                            <input
                                value={manualPath}
                                onChange={e => setManualPath(e.target.value)}
                                className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
                                placeholder="/example"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={applyManualPath}
                            className="shrink-0 rounded bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                        >
                            Apply
                        </button>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-gray-300">
                        <div className="flex min-h-full flex-1 items-center justify-center p-4">
                            <div
                                className="relative box-border shrink-0 rounded-md border-[10px] border-zinc-950 bg-zinc-950 shadow-[0_24px_64px_rgba(0,0,0,0.38)] dark:border-black dark:bg-black dark:shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
                                style={{
                                    aspectRatio: '9 / 16',
                                    width: 'min(100%, calc((100dvh - 7.5rem) * 9 / 16), calc(100vw * 0.92))',
                                }}
                            >
                                <iframe
                                    ref={iframeRef}
                                    title="watchlySdk embed"
                                    className="absolute inset-0 block size-full border-0 bg-white"
                                    src={iframePath}
                                    onLoad={() => setIframeReady(true)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: payload */}
                <aside
                    className={`flex shrink-0 flex-col border-l border-zinc-200 bg-white transition-[width] duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-900 ${
                        rightCollapsed ? 'w-10' : 'w-80'
                    }`}
                >
                    <button
                        type="button"
                        onClick={() => setRightCollapsed(c => !c)}
                        className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        aria-expanded={!rightCollapsed}
                    >
                        <span className={rightCollapsed ? 'sr-only' : ''}>Payload</span>
                        <span aria-hidden>{rightCollapsed ? '«' : '»'}</span>
                    </button>
                    {!rightCollapsed && (
                        <div className="min-h-0 flex-1 overflow-y-auto p-3">
                            <p className="mb-3 font-mono text-xs text-zinc-500">
                                Next <code className="text-zinc-800 dark:text-zinc-200">frameSequence</code>:{' '}
                                <strong className="text-zinc-900 dark:text-zinc-100">{nextFrameSequence}</strong>
                            </p>

                            <div className="space-y-3 text-xs">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isSport}
                                        onChange={e => setIsSport(e.target.checked)}
                                    />
                                    isSport
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-zinc-500">nonSportFrameCount</span>
                                    <input
                                        type="number"
                                        value={nonSportFrameCount}
                                        onChange={e => setNonSportFrameCount(Number(e.target.value) || 0)}
                                        className="rounded border border-zinc-300 bg-white px-2 py-1 font-mono dark:border-zinc-700 dark:bg-zinc-950"
                                    />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-zinc-500">imageRoute</span>
                                    <input
                                        value={imageRoute}
                                        onChange={e => setImageRoute(e.target.value)}
                                        className="rounded border border-zinc-300 bg-white px-2 py-1 font-mono dark:border-zinc-700 dark:bg-zinc-950"
                                    />
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isCommercial}
                                        onChange={e => setIsCommercial(e.target.checked)}
                                    />
                                    isCommercial
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-zinc-500">currentSport (empty → null)</span>
                                    <input
                                        value={currentSport}
                                        onChange={e => setCurrentSport(e.target.value)}
                                        className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                                    />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-zinc-500">
                                        currentEventParticipants (comma-separated, empty → null)
                                    </span>
                                    <textarea
                                        value={participantsText}
                                        onChange={e => setParticipantsText(e.target.value)}
                                        rows={3}
                                        className="rounded border border-zinc-300 bg-white px-2 py-1 font-mono dark:border-zinc-700 dark:bg-zinc-950"
                                    />
                                </label>
                            </div>

                            <button
                                type="button"
                                disabled={!iframeReady}
                                onClick={sendToIframe}
                                className="mt-4 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Send to iframe
                            </button>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
