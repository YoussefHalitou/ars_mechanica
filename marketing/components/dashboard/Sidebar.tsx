'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    Clock,
    Wrench,
    Package,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useState } from 'react'

const navigation = [
    { name: 'Übersicht', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Mitarbeiter', href: '/mitarbeiter', icon: Users },
    { name: 'Projekte', href: '/projekte', icon: FolderKanban, disabled: true },
    { name: 'Zeiterfassung', href: '/zeiterfassung', icon: Clock, disabled: true },
    { name: 'Leistungen', href: '/leistungen', icon: Wrench, disabled: true },
    { name: 'Materialien', href: '/materialien', icon: Package, disabled: true },
]

interface SidebarProps {
    collapsed: boolean
    onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname()
    const { user, logout } = useAuth()

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar-bg transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'
                }`}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">A</span>
                        </div>
                        <span className="text-white font-display font-semibold text-lg tracking-tight">
                            Ars Mechanica
                        </span>
                    </Link>
                )}
                {collapsed && (
                    <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center mx-auto">
                        <span className="text-white font-bold text-sm">A</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + '/')
                    const Icon = item.icon

                    if (item.disabled) {
                        return (
                            <div
                                key={item.name}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-text/40 cursor-not-allowed ${collapsed ? 'justify-center' : ''
                                    }`}
                                title={collapsed ? item.name : undefined}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                {!collapsed && (
                                    <span className="text-sm">
                                        {item.name}
                                        <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
                                            Bald
                                        </span>
                                    </span>
                                )}
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${collapsed ? 'justify-center' : ''
                                } ${isActive
                                    ? 'bg-sidebar-active text-sidebar-text-active'
                                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
                                }`}
                            title={collapsed ? item.name : undefined}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={onToggle}
                className="mx-3 mb-2 flex items-center justify-center rounded-lg py-2 text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active transition-colors"
            >
                {collapsed ? (
                    <ChevronRight className="w-5 h-5" />
                ) : (
                    <ChevronLeft className="w-5 h-5" />
                )}
            </button>

            {/* User section */}
            <div className="border-t border-white/10 p-3">
                <div
                    className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
                >
                    <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center shrink-0">
                        <span className="text-primary-300 text-sm font-medium">
                            {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-text-active truncate">
                                {user?.full_name || 'Benutzer'}
                            </p>
                            <p className="text-xs text-sidebar-text truncate">{user?.email}</p>
                        </div>
                    )}
                    {!collapsed && (
                        <button
                            onClick={logout}
                            className="text-sidebar-text hover:text-red-400 transition-colors"
                            title="Abmelden"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    )
}
