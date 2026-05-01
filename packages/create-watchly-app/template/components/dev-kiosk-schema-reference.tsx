'use client';

import type { ReactNode } from 'react';
import { watchlyFrameSchema } from '@/lib/watchly-schema';

function TypeTag({ children }: { children: string }) {
    return (
        <span className="inline rounded border border-zinc-200 bg-zinc-50 px-1.5 py-px font-mono text-[10px] font-medium leading-tight text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300">
            {children}
        </span>
    );
}

function FieldBlock({ name, typeLine, children }: { name: string; typeLine: string; children: ReactNode }) {
    return (
        <div className="rounded-lg border border-zinc-200/90 bg-gradient-to-b from-white to-zinc-50/80 p-2.5 shadow-sm dark:border-zinc-700/90 dark:from-zinc-900/40 dark:to-zinc-950/60">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <code className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">{name}</code>
                <TypeTag>{typeLine}</TypeTag>
            </div>
            <p className="text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">{children}</p>
        </div>
    );
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
    return (
        <h3
            id={id}
            className="mb-2 border-b border-zinc-200 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
            {children}
        </h3>
    );
}

/**
 * In-panel reference for `lib/watchly-schema.ts` (WatchlyContext, envelope, fields).
 * Shown in Dev Kiosk right drawer only.
 */
export function DevKioskSchemaReference() {
    const imageRoutes = watchlyFrameSchema.shape.imageRoute.options;

    return (
        <div className="space-y-4 text-zinc-900 dark:text-zinc-100">
            <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-zinc-50 p-3 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-zinc-900/30 dark:to-zinc-950">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400/90">
                    lib/watchly-schema.ts
                </p>
                <h2 className="mt-0.5 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    WatchlyContext reference
                </h2>
                <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    The host sends a postMessage envelope; the iframe validates it with Zod and exposes the payload via{' '}
                    <code className="rounded bg-white/80 px-1 py-px font-mono text-[10px] dark:bg-zinc-800/80">
                        useWatchlyContext()
                    </code>
                    .
                </p>
            </div>

            <section aria-labelledby="dev-kiosk-doc-envelope">
                <SectionTitle id="dev-kiosk-doc-envelope">Message envelope</SectionTitle>
                <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-950 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-emerald-100 shadow-inner dark:border-zinc-700">
                    <div>
                        <span className="text-zinc-500">{'{ '}</span>
                        <span className="text-sky-300">type</span>
                        <span className="text-zinc-500">: </span>
                        <span className="text-amber-200">&quot;watchly:context&quot;</span>
                        <span className="text-zinc-500">, </span>
                    </div>
                    <div className="pl-2">
                        <span className="text-sky-300">payload</span>
                        <span className="text-zinc-500">: </span>
                        <span className="text-amber-200">WatchlyContext</span>
                    </div>
                    <div>
                        <span className="text-zinc-500">{'}'}</span>
                    </div>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                    Validated by{' '}
                    <code className="font-mono text-zinc-700 dark:text-zinc-300">watchlyContextMessageSchema</code> in{' '}
                    <code className="font-mono text-zinc-700 dark:text-zinc-300">lib/watchly-post-message.ts</code>.
                </p>
            </section>

            <section aria-labelledby="dev-kiosk-doc-context">
                <SectionTitle id="dev-kiosk-doc-context">WatchlyContext</SectionTitle>
                <p className="mb-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Root object: current TV/frame signal plus optional device metadata from the kiosk.
                </p>
                <div className="space-y-2">
                    <FieldBlock name="frame" typeLine="WatchlyFrame">
                        Holds what is on the connected TV right now — sport vs non-sport, commercial breaks, categorized
                        image route, and participants when known.
                    </FieldBlock>
                    <FieldBlock name="device" typeLine="WatchlyDevice">
                        Identifiers for the screen being monitored (analytics, localized copy).
                    </FieldBlock>
                </div>
            </section>

            <section aria-labelledby="dev-kiosk-doc-frame">
                <SectionTitle id="dev-kiosk-doc-frame">frame</SectionTitle>
                <div className="space-y-2">
                    <FieldBlock name="frameSequence" typeLine="number">
                        Sequential index per analyzed video frame from the hardware (starts at{' '}
                        <span className="font-mono text-zinc-800 dark:text-zinc-200">1</span> after power-on).
                    </FieldBlock>
                    <FieldBlock name="isSport" typeLine="boolean">
                        Whether the connected TV is currently showing a sporting event.
                    </FieldBlock>
                    <FieldBlock name="nonSportFrameCount" typeLine="number">
                        Frames analyzed since sport was last detected — useful when content flips away from sport.
                    </FieldBlock>
                    <FieldBlock name="imageRoute" typeLine={`enum (${imageRoutes.length})`}>
                        Coarse classification: “what’s on TV?” Values from{' '}
                        <code className="font-mono text-zinc-800 dark:text-zinc-200">watchly-schema</code>:
                    </FieldBlock>
                    <ul className="flex flex-wrap gap-1" aria-label="imageRoute enum values">
                        {imageRoutes.map((route) => (
                            <li key={route}>
                                <span className="inline-flex rounded-full border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[10px] text-zinc-800 shadow-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                                    {route}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <FieldBlock name="isCommercial" typeLine="boolean">
                        Whether a commercial break is on screen now.
                    </FieldBlock>
                    <FieldBlock name="currentSport" typeLine="string | null">
                        Sport name when applicable; <TypeTag>null</TypeTag> when not showing sport.
                    </FieldBlock>
                    <FieldBlock name="currentEventParticipants" typeLine="string[] | null">
                        Participant names when identified, e.g. team names. <TypeTag>null</TypeTag> when not sport or
                        unknown.
                    </FieldBlock>
                </div>
            </section>

            <section aria-labelledby="dev-kiosk-doc-device">
                <SectionTitle id="dev-kiosk-doc-device">device</SectionTitle>
                <div className="space-y-2">
                    <FieldBlock name="deviceId" typeLine="string | null">
                        Unique Watchly device / screen id.
                    </FieldBlock>
                    <FieldBlock name="locationName" typeLine="string | null">
                        Venue or install location label.
                    </FieldBlock>
                </div>
            </section>
        </div>
    );
}
