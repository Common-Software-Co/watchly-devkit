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

function NeoPanel() {
    return <PanelContent>Neo</PanelContent>;
}

function MorpheusPanel() {
    return <PanelContent>Morpheus</PanelContent>;
}

function TrinityPanel() {
    return <PanelContent>Trinity</PanelContent>;
}

export default function DevThreePanelPage() {
    return <ThreePanel top={NeoPanel} middle={MorpheusPanel} bottom={TrinityPanel} />;
}
