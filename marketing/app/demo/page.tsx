'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    LayoutDashboard, Users, FolderKanban, Clock, Wrench, Package,
    ChevronLeft, ChevronRight, Bell, Search, Menu, X,
    ArrowUpRight, ArrowDownRight, TrendingUp, MoreHorizontal,
    CheckCircle2, Timer, AlertCircle, Calendar,
} from 'lucide-react'

// ============================================================================
// Sample Data
// ============================================================================

const COMPANY = { name: 'Müller Sanitärtechnik GmbH', user: 'Thomas Müller', role: 'Geschäftsführer', initials: 'TM' }

const STATS = [
    { name: 'Mitarbeiter', value: '12', change: '+2', trend: 'up' as const, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { name: 'Aktive Projekte', value: '8', change: '+3', trend: 'up' as const, icon: FolderKanban, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Stunden heute', value: '47,5', change: '+12%', trend: 'up' as const, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { name: 'Umsatz (Monat)', value: '38.450€', change: '+8%', trend: 'up' as const, icon: TrendingUp, color: 'bg-violet-50 text-violet-600' },
]

const PROJECTS = [
    { name: 'Badsanierung Villa Grünwald', client: 'Fam. Hoffmann', status: 'In Bearbeitung', statusColor: 'bg-blue-100 text-blue-700', team: ['MK', 'JL', 'PW'], progress: 65 },
    { name: 'Heizungsanlage Neubau', client: 'Bauträger Schmidt', status: 'In Bearbeitung', statusColor: 'bg-blue-100 text-blue-700', team: ['AS', 'RB'], progress: 40 },
    { name: 'Gasleitung Gewerbepark', client: 'Gewerbepark Süd', status: 'Geplant', statusColor: 'bg-amber-100 text-amber-700', team: ['MK', 'TH'], progress: 10 },
    { name: 'Wartung Fußbodenheizung', client: 'Praxis Dr. Klein', status: 'Abgeschlossen', statusColor: 'bg-emerald-100 text-emerald-700', team: ['JL'], progress: 100 },
    { name: 'Trinkwasserinstallation Schule', client: 'Stadt München', status: 'In Bearbeitung', statusColor: 'bg-blue-100 text-blue-700', team: ['PW', 'AS', 'RB', 'TH'], progress: 80 },
]

const ACTIVITIES = [
    { text: 'Max Krüger hat Zeiterfassung für "Badsanierung Villa Grünwald" gestoppt', time: 'vor 12 Min.', icon: Timer, color: 'text-amber-500' },
    { text: 'Julia Lehmann hat Prüfprotokoll für "Trinkwasserinstallation Schule" erstellt', time: 'vor 34 Min.', icon: CheckCircle2, color: 'text-emerald-500' },
    { text: 'Peter Wagner hat Material "Kupferrohr 22mm" nachbestellt', time: 'vor 1 Std.', icon: Package, color: 'text-blue-500' },
    { text: 'Andreas Schreiber hat Projekt "Gasleitung Gewerbepark" kommentiert', time: 'vor 2 Std.', icon: FolderKanban, color: 'text-violet-500' },
    { text: 'Termin "Wartung Fußbodenheizung" wurde als abgeschlossen markiert', time: 'vor 3 Std.', icon: CheckCircle2, color: 'text-emerald-500' },
    { text: 'Neue Materialdaten importiert: 14 Positionen aktualisiert', time: 'vor 5 Std.', icon: Package, color: 'text-blue-500' },
]

const EMPLOYEES = [
    { name: 'Max Krüger', role: 'Geselle', hours: '8:12', status: 'Aktiv', statusColor: 'bg-emerald-100 text-emerald-700', project: 'Badsanierung Villa Grünwald' },
    { name: 'Julia Lehmann', role: 'Meisterin', hours: '7:45', status: 'Aktiv', statusColor: 'bg-emerald-100 text-emerald-700', project: 'Trinkwasserinstallation Schule' },
    { name: 'Peter Wagner', role: 'Geselle', hours: '6:30', status: 'Pause', statusColor: 'bg-amber-100 text-amber-700', project: 'Badsanierung Villa Grünwald' },
    { name: 'Andreas Schreiber', role: 'Auszubildender', hours: '5:15', status: 'Aktiv', statusColor: 'bg-emerald-100 text-emerald-700', project: 'Heizungsanlage Neubau' },
    { name: 'Robert Becker', role: 'Geselle', hours: '7:00', status: 'Aktiv', statusColor: 'bg-emerald-100 text-emerald-700', project: 'Heizungsanlage Neubau' },
    { name: 'Tim Hoffmann', role: 'Geselle', hours: '—', status: 'Frei', statusColor: 'bg-gray-100 text-gray-600', project: '—' },
]

const TIME_CHART_DATA = [
    { day: 'Mo', hours: 89 },
    { day: 'Di', hours: 94 },
    { day: 'Mi', hours: 87 },
    { day: 'Do', hours: 91 },
    { day: 'Fr', hours: 78 },
    { day: 'Sa', hours: 24 },
    { day: 'So', hours: 0 },
]

const TABS = [
    { id: 'overview', name: 'Übersicht', icon: LayoutDashboard },
    { id: 'projects', name: 'Projekte', icon: FolderKanban },
    { id: 'time', name: 'Zeiterfassung', icon: Clock },
    { id: 'employees', name: 'Mitarbeiter', icon: Users },
    { id: 'services', name: 'Leistungen', icon: Wrench },
    { id: 'materials', name: 'Materialien', icon: Package },
]

// ============================================================================
// Sub-components
// ============================================================================

function DemoBanner() {
    return (
        <div className="bg-orange-600 text-white text-center py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-3 z-50 relative">
            <span className="hidden sm:inline">🔍 Dies ist eine interaktive Demo mit Beispieldaten.</span>
            <span className="sm:hidden">🔍 Interaktive Demo</span>
            <Link
                href="/register"
                className="bg-white text-orange-600 px-4 py-1 rounded-lg font-bold text-xs hover:bg-orange-50 transition-colors"
            >
                Kostenlos starten →
            </Link>
        </div>
    )
}

function DemoSidebar({ activeTab, onTabChange, collapsed, onToggle }: {
    activeTab: string
    onTabChange: (tab: string) => void
    collapsed: boolean
    onToggle: () => void
}) {
    return (
        <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#0f172a] transition-all duration-300 top-[42px] ${collapsed ? 'w-[72px]' : 'w-64'}`}>
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
                {!collapsed && (
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">A</span>
                        </div>
                        <span className="text-white font-display font-semibold text-lg tracking-tight">
                            Ars Mechanica
                        </span>
                    </Link>
                )}
                {collapsed && (
                    <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center mx-auto">
                        <span className="text-white font-bold text-sm">A</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${collapsed ? 'justify-center' : ''
                                } ${isActive
                                    ? 'bg-[#334155] text-[#f8fafc]'
                                    : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f8fafc]'
                                }`}
                            title={collapsed ? tab.name : undefined}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            {!collapsed && <span className="text-sm font-medium">{tab.name}</span>}
                        </button>
                    )
                })}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={onToggle}
                className="mx-3 mb-2 flex items-center justify-center rounded-lg py-2 text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f8fafc] transition-colors"
            >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

            {/* User section */}
            <div className="border-t border-white/10 p-3">
                <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-orange-600/30 flex items-center justify-center shrink-0">
                        <span className="text-orange-300 text-sm font-medium">{COMPANY.initials}</span>
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#f8fafc] truncate">{COMPANY.user}</p>
                            <p className="text-xs text-[#94a3b8] truncate">{COMPANY.role}</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    )
}

function DemoTopbar({ onMenuClick }: { onMenuClick: () => void }) {
    return (
        <header className="sticky top-[42px] z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6">
            <button onClick={onMenuClick} className="lg:hidden text-gray-600 hover:text-gray-900">
                <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1" />

            {/* Search */}
            <div className="hidden md:flex items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Suchen..."
                        className="w-64 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                        readOnly
                    />
                </div>
            </div>

            {/* Notifications */}
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-medium text-white flex items-center justify-center">3</span>
            </button>

            {/* User */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-700 text-sm font-medium">{COMPANY.initials}</span>
                </div>
                <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{COMPANY.user}</p>
                    <p className="text-xs text-gray-500">{COMPANY.role}</p>
                </div>
            </div>
        </header>
    )
}

// ============================================================================
// Tab Views
// ============================================================================

function OverviewTab() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 font-display">
                    Willkommen zurück, {COMPANY.user}
                </h1>
                <p className="text-gray-500 mt-1">Hier ist die Übersicht Ihres Betriebs.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {STATS.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div key={stat.name} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={`flex items-center gap-0.5 text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {stat.change}
                                </span>
                            </div>
                            <div className="mt-3">
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500 mt-0.5">{stat.name}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Projects preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 font-display">Aktuelle Projekte</h2>
                    <span className="text-xs text-gray-400 font-medium">5 Projekte</span>
                </div>
                <div className="space-y-3">
                    {PROJECTS.slice(0, 3).map((p) => (
                        <div key={p.name} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                                <p className="text-xs text-gray-500">{p.client}</p>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.statusColor}`}>{p.status}</span>
                            <div className="hidden sm:flex items-center">
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${p.progress}%` }} />
                                </div>
                                <span className="text-xs text-gray-400 ml-2 w-8">{p.progress}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 font-display mb-4">Letzte Aktivitäten</h2>
                <div className="space-y-4">
                    {ACTIVITIES.map((a, i) => {
                        const Icon = a.icon
                        return (
                            <div key={i} className="flex items-start gap-3">
                                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${a.color}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700">{a.text}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function ProjectsTab() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">Projekte</h1>
                    <p className="text-gray-500 mt-1">Alle laufenden und geplanten Projekte im Überblick.</p>
                </div>
                <button className="btn-primary text-sm">+ Neues Projekt</button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Projekt</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Kunde</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Team</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Fortschritt</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {PROJECTS.map((p) => (
                            <tr key={p.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <p className="text-sm text-gray-500">{p.client}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.statusColor}`}>{p.status}</span>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <div className="flex -space-x-2">
                                        {p.team.map((t) => (
                                            <div key={t} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                                                <span className="text-[10px] font-medium text-gray-600">{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden sm:table-cell">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-400 w-8">{p.progress}%</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function TimeTab() {
    const maxHours = Math.max(...TIME_CHART_DATA.map(d => d.hours))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 font-display">Zeiterfassung</h1>
                <p className="text-gray-500 mt-1">Arbeitsstunden der laufenden Woche.</p>
            </div>

            {/* Weekly chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 font-display">Wochenübersicht</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>KW 7 — Feb 2026</span>
                    </div>
                </div>
                <div className="flex items-end gap-3 h-48">
                    {TIME_CHART_DATA.map((d) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">{d.hours}h</span>
                            <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '160px' }}>
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-orange-500 rounded-t-lg transition-all"
                                    style={{ height: `${maxHours ? (d.hours / maxHours) * 100 : 0}%` }}
                                />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{d.day}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Gesamt diese Woche: <strong className="text-gray-900">463h</strong></span>
                    <span className="text-gray-500">Ø pro Tag: <strong className="text-gray-900">77,2h</strong></span>
                </div>
            </div>

            {/* Live time entries */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 font-display">Aktive Zeiterfassungen</h2>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        5 aktiv
                    </span>
                </div>
                <div className="space-y-3">
                    {EMPLOYEES.filter(e => e.status === 'Aktiv').map((e) => (
                        <div key={e.name} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-orange-700 text-xs font-medium">{e.name.split(' ').map(n => n[0]).join('')}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{e.name}</p>
                                <p className="text-xs text-gray-500">{e.project}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm font-mono font-medium text-gray-900">
                                <Timer className="w-4 h-4 text-orange-500" />
                                {e.hours}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function EmployeesTab() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">Mitarbeiter</h1>
                    <p className="text-gray-500 mt-1">Ihr Team im Überblick.</p>
                </div>
                <button className="btn-primary text-sm">+ Mitarbeiter anlegen</button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Rolle</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Stunden heute</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Aktuelles Projekt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {EMPLOYEES.map((e) => (
                            <tr key={e.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                            <span className="text-orange-700 text-xs font-medium">{e.name.split(' ').map(n => n[0]).join('')}</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{e.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <span className="text-sm text-gray-500">{e.role}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${e.statusColor}`}>{e.status}</span>
                                </td>
                                <td className="px-6 py-4 hidden sm:table-cell">
                                    <span className="text-sm font-mono text-gray-700">{e.hours}</span>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <span className="text-sm text-gray-500">{e.project}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function ComingSoonTab({ title }: { title: string }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 font-display">{title}</h1>
                <p className="text-gray-500 mt-1">Dieses Modul wird in der Demo nicht angezeigt.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm mb-6">
                    Dieses Modul ist in der vollständigen Version verfügbar.
                </p>
                <Link href="/register" className="btn-primary text-sm">
                    Kostenlos testen — alle Module freischalten
                </Link>
            </div>
        </div>
    )
}

// ============================================================================
// Main Demo Page
// ============================================================================

export default function DemoPage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />
            case 'projects': return <ProjectsTab />
            case 'time': return <TimeTab />
            case 'employees': return <EmployeesTab />
            case 'services': return <ComingSoonTab title="Leistungen" />
            case 'materials': return <ComingSoonTab title="Materialien" />
            default: return <OverviewTab />
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DemoBanner />

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`lg:block ${mobileMenuOpen ? 'block' : 'hidden'}`}>
                <DemoSidebar
                    activeTab={activeTab}
                    onTabChange={(tab) => { setActiveTab(tab); setMobileMenuOpen(false) }}
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
            </div>

            {/* Main content */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
                <DemoTopbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
                <main className="p-6">
                    {renderTab()}
                </main>
            </div>
        </div>
    )
}
