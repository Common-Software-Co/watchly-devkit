'use client';

import { useWatchlyContext } from '@/lib/watchly-provider';

export default function MessageDebugPage() {
    const context = useWatchlyContext();

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
            <header>
                <h1 className="text-2xl font-semibold tracking-tight">watchlySdk / message debugger</h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Displays the <code>watchlyContext</code> object which is updated by every incoming{' '}
                    <code className="font-mono text-xs">WatchlyContext</code> messages from the iframe parent via{' '}
                    <code className="font-mono text-xs">postMessage</code>
                </p>
            </header>

            <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Context (JSON)</h2>
                <pre className="mt-3 overflow-x-auto font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200">
                    {JSON.stringify(context, null, 2)}
                </pre>
            </section>

            <section>
                <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Frame fields</h2>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <Field label="frameSequence" value={String(context.frame.frameSequence)} />
                    <Field label="isSport" value={String(context.frame.isSport)} />
                    <Field label="nonSportFrameCount" value={String(context.frame.nonSportFrameCount)} />
                    <Field label="imageRoute" value={context.frame.imageRoute || '—'} />
                    <Field label="isCommercial" value={String(context.frame.isCommercial)} />
                    <Field label="currentSport" value={context.frame.currentSport ?? '—'} />
                    <Field
                        label="currentEventParticipants"
                        value={context.frame.currentEventParticipants?.join(', ') ?? '—'}
                    />
                </dl>
            </section>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
            <dt className="font-mono text-xs text-zinc-500">{label}</dt>
            <dd className="mt-0.5 break-all font-mono text-zinc-900 dark:text-zinc-100">{value}</dd>
        </div>
    );
}
