'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { ToastProvider } from '@/components/ui/toast';

export default function AppsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToastProvider>
            <div className="flex h-screen w-full bg-slate-50">
                <AppSidebar />
                <div className="flex-1 overflow-hidden flex flex-col">
                    {children}
                </div>
            </div>
        </ToastProvider>
    );
}
