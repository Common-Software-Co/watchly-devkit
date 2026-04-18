import React from 'react';

export type ThreePanelProps = {
    top: React.ComponentType;
    middle: React.ComponentType;
    bottom: React.ComponentType;
};

function ThreePanel({ top: Top, middle: Middle, bottom: Bottom }: ThreePanelProps) {
    return (
        <div className="box-border flex h-dvh min-h-0 w-full flex-col gap-2 p-[10px]">
            <section className="min-h-0 flex-[1] overflow-hidden rounded-[10px]">
                <Top />
            </section>
            <section className="min-h-0 flex-[2] overflow-hidden rounded-[10px]">
                <Middle />
            </section>
            <section className="min-h-0 flex-[1] overflow-hidden rounded-[10px]">
                <Bottom />
            </section>
        </div>
    );
}

export { ThreePanel };
