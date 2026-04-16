import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { WatchlyProvider } from '@/lib/watchly-provider';
import { WatchlySWRProvider } from '@/lib/watchly-swr';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: process.env.NEXT_PAGE_TITLE || 'Watchly Devkit',
    description: 'Embedded iframe UI with host-driven WatchlyContext',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">
                <WatchlyProvider>
                    <WatchlySWRProvider>{children}</WatchlySWRProvider>
                </WatchlyProvider>
            </body>
        </html>
    );
}
