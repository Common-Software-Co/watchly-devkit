'use client';

import type { ReactNode } from 'react';
import { ThreePanel } from '../../components/three-panel';

type PanelContentProps = {
    children: ReactNode;
};

function PanelContent({ children }: PanelContentProps) {
    return (
        <div className={`box-border flex h-full items-center justify-center bg-blue-200 p-2 text-neutral-800`}>
            {children}
        </div>
    );
}

function TopPanel() {
    return (
        <PanelContent>
            This view just demonstrates the included `ThreePanel` component, which is a simple wrapper around three
            child components.
        </PanelContent>
    );
}

function MiddlePanel() {
    return <PanelContent>This layout is popular for sidescreen apps</PanelContent>;
}

function BottomPanel() {
    return <PanelContent>Each panel can contain a completely independent view</PanelContent>;
}

export default function DevThreePanelPage() {
    return <ThreePanel top={TopPanel} middle={MiddlePanel} bottom={BottomPanel} />;
}
