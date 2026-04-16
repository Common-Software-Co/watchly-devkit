import { DevKiosk } from '@/components/dev-kiosk';
import { DEV_KIOSK_APP_ROUTES } from '@/lib/dev-kiosk-routes.generated';
import { notFound } from 'next/navigation';

/**
 * This page is only available in development mode (i.e. `npm run dev`)
 * Visit http://localhost:3000/dev-kiosk to use it.
 *
 * This route simulates the parent window that the rest of your app will be
 * embedded into. In production, this parent window is hosted by a Watchly
 * kiosk device that loads your app in an iframe. The dev-kiosk page gives
 * you a way to send those messages to your app without having to run
 * an actual Watchly kiosk device.
 */
export default function DevKioskPage() {
    if (process.env.NODE_ENV !== 'development') {
        notFound();
    }
    return <DevKiosk routes={DEV_KIOSK_APP_ROUTES} />;
}
