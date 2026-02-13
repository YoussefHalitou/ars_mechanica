'use client'

import { Bell, Search, Menu } from 'lucide-react'
import { useAuth } from '@/lib/auth'

interface TopbarProps {
    onMenuClick: () => void
    title?: string
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
    const { user } = useAuth()

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6">
            {/* Mobile menu */}
            <button
                onClick={onMenuClick}
                className="lg:hidden text-gray-600 hover:text-gray-900"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Title */}
            {title && (
                <h1 className="text-lg font-semibold text-gray-900 font-display">
                    {title}
                </h1>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <div className="hidden md:flex items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Suchen..."
                        className="w-64 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                    />
                </div>
            </div>

            {/* Notifications */}
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-medium text-white flex items-center justify-center">
                    3
                </span>
            </button>

            {/* User */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 text-sm font-medium">
                        {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                </div>
                <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                        {user?.full_name || 'Benutzer'}
                    </p>
                    <p className="text-xs text-gray-500">{user?.role || 'Admin'}</p>
                </div>
            </div>
        </header>
    )
}
