'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard,
    FolderKanban,
    Clock,
    Users,
    Wrench,
    Package,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const COMPANY = {
    name: 'Müller Sanitärtechnik GmbH',
    user: 'Thomas Müller',
    role: 'Geschäftsführer',
    initials: 'TM',
};

const MENU_ITEMS = [
    { href: '/demo', label: 'Übersicht', icon: LayoutDashboard, exact: true },
    { href: '/demo/planning', label: 'Einsatzplanung', icon: Calendar },
    { href: '/demo/projects', label: 'Projekte', icon: FolderKanban },
    { href: '/demo/time', label: 'Zeiterfassung', icon: Clock },
    { href: '/demo/employees', label: 'Mitarbeiter', icon: Users },
    { href: '/demo/services', label: 'Leistungen', icon: Wrench },
    { href: '/demo/materials', label: 'Materialien', icon: Package },
];

export function DemoSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                'relative flex flex-col border-r border-slate-200 bg-slate-900 text-slate-300 transition-all duration-300',
                collapsed ? 'w-[72px]' : 'w-64'
            )}
        >
            {/* Brand */}
            <div className="flex h-16 items-center px-4 border-b border-white/10">
                {!collapsed ? (
                    <Link href="/demo" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">AM</span>
                        </div>
                        <span className="text-white font-display font-semibold text-lg tracking-tight">
                            Ars Mechanica
                        </span>
                    </Link>
                ) : (
                    <div className="mx-auto w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">AM</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {MENU_ITEMS.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname?.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 group',
                                isActive
                                    ? 'bg-slate-800 text-white shadow-inner'
                                    : 'hover:bg-slate-800 hover:text-white',
                                collapsed && 'justify-center'
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon
                                className={cn(
                                    'w-5 h-5 shrink-0 transition-colors',
                                    isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-orange-400'
                                )}
                            />
                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="mx-3 mb-2 flex items-center justify-center rounded-lg py-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            {/* User Profile */}
            <div className="border-t border-white/10 p-3">
                <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
                    <div className="w-8 h-8 rounded-full bg-orange-600/30 flex items-center justify-center shrink-0">
                        <span className="text-orange-300 text-sm font-medium">{COMPANY.initials}</span>
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{COMPANY.user}</p>
                            <p className="text-xs text-slate-400 truncate">{COMPANY.role}</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
