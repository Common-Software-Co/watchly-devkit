import type { ComponentPropsWithoutRef } from 'react';

export type CodeProps = ComponentPropsWithoutRef<'code'>;

const baseClass =
    'inline-block max-w-full whitespace-pre-wrap rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.9em] text-zinc-900 tabular-nums dark:bg-zinc-800 dark:text-zinc-100';

/** Monospace snippet styling; pass a template literal child to keep source newlines (`white-space: pre-wrap`). */
export function Code({ className, children, ...props }: CodeProps) {
    return (
        <code className={className ? `${baseClass} ${className}` : baseClass} {...props}>
            {children}
        </code>
    );
}
