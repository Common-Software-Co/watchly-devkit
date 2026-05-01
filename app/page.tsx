'use client';

import {
    appendDevKioskIframeEmbedParam,
    DEV_KIOSK_IFRAME_QUERY_KEY,
    DEV_KIOSK_IFRAME_QUERY_VALUE,
} from '@/components/dev-kiosk';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Code } from '@/components/code';

export default function HomeContent() {
    const searchParams = useSearchParams();
    const inDevKioskPreview = searchParams.get(DEV_KIOSK_IFRAME_QUERY_KEY) === DEV_KIOSK_IFRAME_QUERY_VALUE;
    const devKioskHref = inDevKioskPreview ? appendDevKioskIframeEmbedParam('/dev-kiosk') : '/dev-kiosk';

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
            {!inDevKioskPreview && (
                <>
                    <div className="text-center">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            It's no big deal 💅
                            <br /> but you just made your own Watchly app
                        </h1>
                        <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400"></p>
                    </div>
                    <Link
                        href={devKioskHref}
                        className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:opacity-90"
                    >
                        Open the /dev-kiosk
                    </Link>
                    <div className="text-center">
                        <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
                            {
                                "The /dev-kiosk page is a development tool that allows you to view your app inside a TV frame and send messages to your app to simulate the messages that it will receive about what's on the TV."
                            }
                        </p>
                    </div>
                </>
            )}
            {inDevKioskPreview && (
                <>
                    <div className="text-center">
                        <h1 className="text-3xl font-semibold tracking-tight">Next steps:</h1>
                        <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400"></p>
                    </div>
                    <div className="text-left">
                        <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
                            1. 👈 Use the left nav to look at the example components to see how they use the{' '}
                            <Code>WatchlyContext</Code> to render content based on what's on the TV.
                        </p>
                        <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
                            2. Send messages to your app to simulate the messages that it will receive about what's on
                            the TV 👉
                        </p>
                        <div className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
                            <p className="mb-2">
                                3. Create your own route in <Code>/app/my-new-route/page.tsx</Code> - it'll appear in
                                the left nav as &quot;my-new-route&quot;:
                            </p>
                            <Code className="mt-2 pl-8 pb-8">{`
import { useWatchlyContext } from '@/lib/watchly-provider';

export default function MyNewRoute() {
    const context = useWatchlyContext();
    return (
        <p>
            {JSON.stringify(context)}
        </p>
    );
}`}</Code>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
