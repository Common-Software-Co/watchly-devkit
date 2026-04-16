import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">watchlySdk</h1>
        <p className="mt-2 max-w-md text-zinc-600 dark:text-zinc-400">
          Next.js embed for iframe hosts. Context is driven by{" "}
          <code className="font-mono text-sm">postMessage</code> from allowed
          parent origins.
        </p>
      </div>
      <Link
        href="/example"
        className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:opacity-90"
      >
        Open /example
      </Link>
    </div>
  );
}
