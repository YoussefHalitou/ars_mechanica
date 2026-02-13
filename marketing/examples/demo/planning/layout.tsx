import { DemoSidebar } from '@/components/demo-sidebar';

export default function PlanningLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen w-full bg-slate-50">
            {/* <DemoSidebar /> */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {children}
            </div>
        </div>
    );
}
