'use client'

import { useAuth } from '@/lib/auth'
import {
    Users,
    FolderKanban,
    Clock,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react'

const stats = [
    {
        name: 'Mitarbeiter',
        value: '—',
        change: '',
        trend: 'up' as const,
        icon: Users,
        color: 'bg-blue-50 text-blue-600',
    },
    {
        name: 'Aktive Projekte',
        value: '—',
        change: '',
        trend: 'up' as const,
        icon: FolderKanban,
        color: 'bg-emerald-50 text-emerald-600',
    },
    {
        name: 'Stunden heute',
        value: '—',
        change: '',
        trend: 'up' as const,
        icon: Clock,
        color: 'bg-amber-50 text-amber-600',
    },
    {
        name: 'Umsatz (Monat)',
        value: '—',
        change: '',
        trend: 'up' as const,
        icon: TrendingUp,
        color: 'bg-violet-50 text-violet-600',
    },
]

export default function DashboardPage() {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 font-display">
                    Willkommen zurück{user?.full_name ? `, ${user.full_name}` : ''}
                </h1>
                <p className="text-gray-500 mt-1">
                    Hier ist die Übersicht Ihres Betriebs.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div
                            key={stat.name}
                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                {stat.change && (
                                    <span
                                        className={`flex items-center gap-0.5 text-xs font-medium ${stat.trend === 'up'
                                                ? 'text-emerald-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        {stat.trend === 'up' ? (
                                            <ArrowUpRight className="w-3 h-3" />
                                        ) : (
                                            <ArrowDownRight className="w-3 h-3" />
                                        )}
                                        {stat.change}
                                    </span>
                                )}
                            </div>
                            <div className="mt-3">
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500 mt-0.5">{stat.name}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 font-display mb-4">
                    Schnellzugriff
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        { label: 'Neuen Mitarbeiter anlegen', href: '/mitarbeiter', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
                        { label: 'Neues Projekt erstellen', href: '#', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' },
                        { label: 'Zeiterfassung starten', href: '#', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700' },
                    ].map((action) => (
                        <a
                            key={action.label}
                            href={action.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${action.color}`}
                        >
                            {action.label}
                            <ArrowUpRight className="w-4 h-4 ml-auto" />
                        </a>
                    ))}
                </div>
            </div>

            {/* Activity placeholder */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 font-display mb-4">
                    Letzte Aktivitäten
                </h2>
                <div className="text-center py-12 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Aktivitäten werden hier angezeigt, sobald Daten vorhanden sind.</p>
                </div>
            </div>
        </div>
    )
}
