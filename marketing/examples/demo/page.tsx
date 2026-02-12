'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard, Users, FolderKanban, Clock, Wrench, Package,
    ChevronLeft, ChevronRight, Bell, Search, Menu, X,
    ArrowUpRight, ArrowDownRight, TrendingUp, MoreHorizontal,
    CheckCircle2, Timer, AlertCircle, Calendar, Plus, Filter,
    FileText, Phone, Mail, MapPin, Gauge, DollarSign,
    PieChart, BarChart3, Activity, XCircle, Trash2, Edit, MoreVertical
} from 'lucide-react'

// ============================================================================
// Sample Data
// ============================================================================

const COMPANY = { name: 'Müller Sanitärtechnik GmbH', user: 'Thomas Müller', role: 'Geschäftsführer', initials: 'TM' }

const PROJECTS = [
    {
        id: 1, name: 'Badsanierung Villa Grünwald', client: 'Fam. Hoffmann', status: 'In Bearbeitung', statusColor: 'bg-blue-100 text-blue-700',
        team: ['MK', 'JL', 'PW'], progress: 65, budget: 15000, cost: 8450, deadline: '2026-03-15',
        description: 'Komplettsanierung Badezimmer OG inkl. Fußbodenheizung und begehbarer Dusche.',
        activities: ['Fliesen entfernt', 'Rohinstallation abgeschlossen', 'Fußbodenheizung verlegt']
    },
    {
        id: 2, name: 'Heizungsanlage Neubau', client: 'Bauträger Schmidt', status: 'In Bearbeitung', statusColor: 'bg-blue-100 text-blue-700',
        team: ['AS', 'RB'], progress: 40, budget: 35000, cost: 12200, deadline: '2026-04-01',
        description: 'Installation Wärmepumpe und Verrohrung für 6 Wohneinheiten.',
        activities: ['Genehmigung erhalten', 'Material geliefert', 'Montage begonnen']
    },
    {
        id: 3, name: 'Gasleitung Gewerbepark', client: 'Gewerbepark Süd', status: 'Geplant', statusColor: 'bg-amber-100 text-amber-700',
        team: ['MK', 'TH'], progress: 10, budget: 8500, cost: 450, deadline: '2026-05-10',
        description: 'Erweiterung der Gaszuleitung für Halle 3 und 4.',
        activities: ['Planung erstellt', 'Angebot bestätigt']
    },
    {
        id: 4, name: 'Wartung Fußbodenheizung', client: 'Praxis Dr. Klein', status: 'Abgeschlossen', statusColor: 'bg-emerald-100 text-emerald-700',
        team: ['JL'], progress: 100, budget: 450, cost: 420, deadline: '2026-02-10',
        description: 'Jährliche Wartung und Spülung der Heizkreise.',
        activities: ['Wartung durchgeführt', 'Protokoll erstellt', 'Rechnung gestellt']
    },
    {
        id: 5, name: 'Trinkwasserinstallation Schule', client: 'Stadt München', status: 'In Bearbeitung', statusColor: 'bg-blue-100 text-blue-700',
        team: ['PW', 'AS', 'RB', 'TH'], progress: 80, budget: 28000, cost: 24500, deadline: '2026-02-28',
        description: 'Sanierung der Sanitäranlagen im Sporthallenbereich.',
        activities: ['Demontage alt', 'Rohrleitungen neu', 'Druckprüfung erfolgreich']
    },
]


const EMPLOYEES = [
    { name: 'Max Krüger', role: 'Geselle', hours: '8:12', status: 'Aktiv', statusColor: 'bg-emerald-100 text-emerald-700', project: 'Badsanierung Villa Grünwald', email: 'm.krueger@mueller-sanitaer.de' },
    { name: 'Julia Lehmann', role: 'Meisterin', hours: '7:45', status: 'Aktiv', statusColor: 'bg-emerald-100 text-emerald-700', project: 'Trinkwasserinstallation Schule', email: 'j.lehmann@mueller-sanitaer.de' },
    { name: 'Peter Wagner', role: 'Geselle', hours: '6:30', status: 'Pause', statusColor: 'bg-amber-100 text-amber-700', project: 'Badsanierung Villa Grünwald', email: 'p.wagner@mueller-sanitaer.de' },
    { name: 'Andreas Schreiber', role: 'Auszubildender', hours: '5:15', status: 'Aktiv', statusColor: 'bg-emerald-100 text-emerald-700', project: 'Heizungsanlage Neubau', email: 'a.schreiber@mueller-sanitaer.de' },
    { name: 'Robert Becker', role: 'Geselle', hours: '7:00', status: 'Aktiv', statusColor: 'bg-emerald-100 text-emerald-700', project: 'Heizungsanlage Neubau', email: 'r.becker@mueller-sanitaer.de' },
    { name: 'Tim Hoffmann', role: 'Geselle', hours: '—', status: 'Frei', statusColor: 'bg-gray-100 text-gray-600', project: '—', email: 't.hoffmann@mueller-sanitaer.de' },
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

const SERVICES = [
    { id: 101, name: 'Anfahrtspauschale Zone 1', category: 'Allgemein', price: '45,00 €', unit: 'pauschal' },
    { id: 102, name: 'Meisterstunde', category: 'Lohnleistung', price: '85,00 €', unit: 'pro Stunde' },
    { id: 103, name: 'Gesellenstunde', category: 'Lohnleistung', price: '68,00 €', unit: 'pro Stunde' },
    { id: 104, name: 'Azubi-Stunde', category: 'Lohnleistung', price: '45,00 €', unit: 'pro Stunde' },
    { id: 201, name: 'Wartung Gastherme', category: 'Pauschale', price: '180,00 €', unit: 'Stück' },
    { id: 202, name: 'Dichtheitsprüfung Gasleitung', category: 'Prüfung', price: '120,00 €', unit: 'pauschal' },
    { id: 301, name: 'Kamerabefahrung Abwasser', category: 'Diagnose', price: '150,00 €', unit: 'pro Stunde' },
]

const MATERIALS = [
    { id: 'M-1001', name: 'Kupferrohr 15mm', stock: 154, unit: 'm', reorder: 50, price: '8,50 €' },
    { id: 'M-1002', name: 'Kupferrohr 22mm', stock: 42, unit: 'm', reorder: 60, price: '12,90 €' },
    { id: 'M-2045', name: 'Eckventil 1/2 Zoll', stock: 85, unit: 'Stk', reorder: 20, price: '6,40 €' },
    { id: 'M-3012', name: 'Dichtungsset Siphon', stock: 12, unit: 'Set', reorder: 15, price: '3,20 €' },
    { id: 'M-4001', name: 'Wärmepumpe Vitocal 200', stock: 2, unit: 'Stk', reorder: 2, price: '8.400,00 €' },
    { id: 'M-5005', name: 'Fliesenkleber 25kg', stock: 34, unit: 'Sack', reorder: 10, price: '24,50 €' },
]

const NOTIFICATIONS = [
    { id: 1, text: 'Materialbestellung M-3012 ist eingetroffen', time: 'vor 10 Min', read: false },
    { id: 2, text: 'Neuer Terminanfrage von Fam. Weber', time: 'vor 1 Std', read: false },
    { id: 3, text: 'Wartungsvertrag läuft in 30 Tagen aus', time: 'vor 4 Std', read: true },
]

// const TABS = ...

// ============================================================================
// Helper Components
// ============================================================================

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        const duration = 1000
        const steps = 60
        const stepTime = duration / steps
        let current = 0
        const increment = value / steps
        const timer = setInterval(() => {
            current += increment
            if (current >= value) {
                setCount(value)
                clearInterval(timer)
            } else {
                setCount(current)
            }
        }, stepTime)
        return () => clearInterval(timer)
    }, [value])
    return <span>{count.toLocaleString('de-DE', { maximumFractionDigits: 1 })}{suffix}</span>
}

function LiveClock() {
    const [time, setTime] = useState<string>('')

    useEffect(() => {
        setTime(new Date().toLocaleTimeString('de-DE'))
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString('de-DE')), 1000)
        return () => clearInterval(timer)
    }, [])

    if (!time) return <span className="font-mono">--:--:--</span>

    return <span className="font-mono">{time}</span>
}

function StatusBadge({ status, color }: { status: string; color: string }) {
    return (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${color}`}>
            {status}
        </span>
    )
}

function Sparkline({ data, color }: { data: number[], color: string }) {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - ((d - min) / range) * 100
        return `${x},${y}`
    }).join(' ')

    return (
        <div className="h-8 w-24">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    points={points}
                    className={color.replace('bg-', 'text-').replace('50', '500')}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    )
}

function ProjectDetailModal({ project, onClose }: { project: any, onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end"
            onClick={onClose}
        >
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold font-display text-gray-900">Projektdetails</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="flex items-start justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                            <StatusBadge status={project.status} color={project.statusColor} />
                        </div>
                        <p className="text-gray-500 text-sm mt-1">{project.client}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Beschreibung</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{project.description || 'Keine Beschreibung verfügbar.'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white border border-gray-200 rounded-xl">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Budget</span>
                            <div className="text-lg font-bold text-gray-900 mt-1">{project.budget ? project.budget.toLocaleString('de-DE') + '€' : '-'}</div>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 rounded-xl">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Kosten aktuell</span>
                            <div className={`text-lg font-bold mt-1 ${project.cost > project.budget ? 'text-red-600' : 'text-emerald-600'}`}>
                                {project.cost ? project.cost.toLocaleString('de-DE') + '€' : '-'}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Fortschritt</span>
                            <span className="text-sm font-bold text-gray-900">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }} />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Team</h4>
                        <div className="flex items-center gap-2">
                            {project.team && project.team.map((t: string) => (
                                <div key={t} className="w-10 h-10 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center shadow-sm">
                                    <span className="text-xs font-bold text-orange-700">{t}</span>
                                </div>
                            ))}
                            <button className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors">
                                <Plus className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Letzte Aktivitäten</h4>
                        <ul className="space-y-3">
                            {project.activities && project.activities.map((act: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0" />
                                    {act}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

function DropdownMenu({ onEdit, onDelete }: { onEdit?: () => void, onDelete?: () => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}
                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 z-10 overflow-hidden"
                    >
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); onEdit() }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Edit className="w-3 h-3" /> Bearbeiten
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); onDelete() }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-3 h-3" /> Löschen
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function ToastContainer({ toasts }: { toasts: any[] }) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 min-w-[300px]"
                    >
                        <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <p className="text-sm font-medium">{toast.message}</p>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

// ============================================================================
// Main Components
// ============================================================================

function DemoBanner() {
    return (
        <div className="bg-orange-600 text-white text-center py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-3 z-50 relative shadow-sm">
            <span className="hidden sm:inline">🔍 Dies ist eine interaktive Demo mit Beispieldaten.</span>
            <span className="sm:hidden">🔍 Interaktive Demo</span>
            <Link
                href="/register"
                className="bg-white text-orange-600 px-4 py-1 rounded-lg font-bold text-xs hover:bg-orange-50 transition-colors shadow-sm"
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
    const TABS = [
        { id: 'overview', name: 'Übersicht', icon: 'LayoutDashboard' },
        { id: 'projects', name: 'Projekte', icon: 'FolderKanban' },
        { id: 'time', name: 'Zeiterfassung', icon: 'Clock' },
        { id: 'employees', name: 'Mitarbeiter', icon: 'Users' },
        { id: 'services', name: 'Leistungen', icon: 'Wrench' },
        { id: 'materials', name: 'Materialien', icon: 'Package' },
    ]
    const ICON_MAP: any = { LayoutDashboard, FolderKanban, Clock, Users, Wrench, Package };

    return (
        <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#0f172a] transition-all duration-300 top-[42px] ${collapsed ? 'w-[72px]' : 'w-64'}`}>
            <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
                {!collapsed ? (
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">AM</span>
                        </div>
                        <span className="text-white font-display font-semibold text-lg tracking-tight">Ars Mechanica</span>
                    </Link>
                ) : (
                    <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center mx-auto">
                        <span className="text-white font-bold text-sm">AM</span>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id
                    const Icon = ICON_MAP[tab.icon]
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${collapsed ? 'justify-center' : ''
                                } ${isActive
                                    ? 'bg-[#334155] text-[#f8fafc] shadow-inner'
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

            <button onClick={onToggle} className="mx-3 mb-2 flex items-center justify-center rounded-lg py-2 text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#f8fafc] transition-colors">
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>

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
    const [showNotifications, setShowNotifications] = useState(false)

    return (
        <header className="sticky top-[42px] z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-6">
            <button onClick={onMenuClick} className="lg:hidden text-gray-600 hover:text-gray-900">
                <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1" />

            <div className="hidden md:flex items-center">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Suchen..."
                        className="w-64 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        readOnly
                    />
                </div>
            </div>

            <div className="relative">
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                </button>

                <AnimatePresence>
                    {showNotifications && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                        >
                            <div className="p-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-900">Benachrichtigungen</span>
                                <span className="text-xs text-orange-600 font-medium cursor-pointer">Alle als gelesen</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {NOTIFICATIONS.map((n) => (
                                    <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-orange-50/30' : ''}`}>
                                        <p className="text-sm text-gray-800">{n.text}</p>
                                        <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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

function OverviewTab({ onOpenProject, projects }: { onOpenProject: (p: any) => void, projects: any[] }) {
    const STATS = [
        { name: 'Mitarbeiter', value: 12, suffix: '', change: '+2', trend: 'up' as const, icon: 'Users', color: 'bg-blue-50 text-blue-600' },
        { name: 'Aktive Projekte', value: 8, suffix: '', change: '+3', trend: 'up' as const, icon: 'FolderKanban', color: 'bg-emerald-50 text-emerald-600' },
        { name: 'Stunden heute', value: 47.5, suffix: 'h', change: '+12%', trend: 'up' as const, icon: 'Clock', color: 'bg-amber-50 text-amber-600' },
        { name: 'Umsatz (Monat)', value: 38450, suffix: '€', change: '+8%', trend: 'up' as const, icon: 'TrendingUp', color: 'bg-violet-50 text-violet-600', chart: [65, 59, 80, 81, 56, 55, 40, 70, 75, 85, 90, 88] },
    ]
    const ACTIVITIES = [
        { text: 'Max Krüger hat Zeiterfassung für "Badsanierung Villa Grünwald" gestoppt', time: 'vor 12 Min.', icon: 'Timer', color: 'text-amber-500' },
        { text: 'Julia Lehmann hat Prüfprotokoll für "Trinkwasserinstallation Schule" erstellt', time: 'vor 34 Min.', icon: 'CheckCircle2', color: 'text-emerald-500' },
        { text: 'Peter Wagner hat Material "Kupferrohr 22mm" nachbestellt', time: 'vor 1 Std.', icon: 'Package', color: 'text-blue-500' },
        { text: 'Andreas Schreiber hat Projekt "Gasleitung Gewerbepark" kommentiert', time: 'vor 2 Std.', icon: 'FolderKanban', color: 'text-violet-500' },
        { text: 'Termin "Wartung Fußbodenheizung" wurde als abgeschlossen markiert', time: 'vor 3 Std.', icon: 'CheckCircle2', color: 'text-emerald-500' },
        { text: 'Neue Materialdaten importiert: 14 Positionen aktualisiert', time: 'vor 5 Std.', icon: 'Package', color: 'text-blue-500' },
    ]

    const ICON_MAP: any = { Users, FolderKanban, Clock, TrendingUp, Timer, CheckCircle2, Package };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">Willkommen zurück, {COMPANY.user}</h1>
                    <p className="text-gray-500 mt-1">Hier ist die Übersicht Ihres Betriebs.</p>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-sm text-gray-500">Aktuelle Zeit</div>
                    <div className="text-xl font-bold text-gray-900"><LiveClock /></div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {STATS.map((stat, i) => {
                    const Icon = ICON_MAP[stat.icon]
                    const val = stat.name === 'Aktive Projekte' ? projects.length : stat.value
                    return (
                        <motion.div
                            key={stat.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className="flex items-start justify-between relative z-10">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                {stat.chart && <Sparkline data={stat.chart} color={stat.color} />}
                            </div>
                            <div className="mt-3 relative z-10">
                                <p className="text-2xl font-bold text-gray-900">
                                    <CountUp value={val as number} suffix={stat.suffix} />
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-sm text-gray-500">{stat.name}</p>
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {stat.change}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Projects preview */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 font-display">Aktuelle Projekte</h2>
                        <button className="text-sm text-orange-600 font-medium hover:text-orange-700">Alle anzeigen</button>
                    </div>
                    <div className="space-y-3">
                        {projects.slice(0, 3).map((p, i) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                onClick={() => onOpenProject(p)}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100 group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold group-hover:bg-white group-hover:shadow-sm transition-all">
                                    {p.client.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">{p.name}</p>
                                    <p className="text-xs text-gray-500">{p.client}</p>
                                </div>
                                <div className="hidden sm:block text-right">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.statusColor}`}>{p.status}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Team Utilization / Nachkalkulation */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-900 font-display mb-6">Projekt-Kosten</h2>
                    <div className="flex-1 flex flex-col justify-center space-y-6">
                        {projects.slice(0, 3).map(p => {
                            const percent = Math.min((p.cost / p.budget) * 100, 100)
                            return (
                                <div key={p.id}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-gray-700 truncate max-w-[150px]">{p.name}</span>
                                        <span className="text-gray-500">{Math.round(percent)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                        <span>{p.cost.toLocaleString('de-DE')}€</span>
                                        <span>{p.budget.toLocaleString('de-DE')}€</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 font-display mb-4">Letzte Aktivitäten</h2>
                <div className="space-y-4">
                    {ACTIVITIES.map((a, i) => {
                        const Icon = ICON_MAP[a.icon]
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.05 }}
                                className="flex items-start gap-3"
                            >
                                <div className={`mt-0.5 p-1 rounded-full bg-gray-50`}>
                                    <Icon className={`w-4 h-4 shrink-0 ${a.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-700">{a.text}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </motion.div>
    )
}

function ProjectsTab({ onOpenProject, projects, onAdd, onDelete }: { onOpenProject: (p: any) => void, projects: any[], onAdd: () => void, onDelete: (id: any) => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">Projekte</h1>
                    <p className="text-gray-500 mt-1">Alle laufenden und geplanten Projekte im Überblick.</p>
                </div>
                <button
                    onClick={onAdd}
                    className="btn-primary text-sm shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all"
                >
                    + Neues Projekt
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Projekt</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Kunde</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Status</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 hidden lg:table-cell">Team</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 hidden sm:table-cell">Fortschritt</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((p, i) => (
                            <motion.tr
                                key={p.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => onOpenProject(p)}
                                className="border-b border-gray-50 hover:bg-orange-50/10 transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors">{p.name}</p>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <p className="text-sm text-gray-500">{p.client}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={p.status} color={p.statusColor} />
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <div className="flex -space-x-2">
                                        {p.team.map((t: string) => (
                                            <div key={t} className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                {t}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden sm:table-cell">
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${p.progress}%` }} />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <DropdownMenu onEdit={() => onOpenProject(p)} onDelete={() => onDelete(p.id)} />
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}

// ... (OverviewTab and ProjectsTab are already updated)

function ActionModal({ title, fields, onClose, onSubmit }: { title: string, fields: any[], onClose: () => void, onSubmit: (data: any) => void }) {
    const [formData, setFormData] = useState<any>({})

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {fields.map((field) => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                            {field.type === 'select' ? (
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                >
                                    <option value="">Bitte wählen...</option>
                                    {field.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                    onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                />
                            )}
                        </div>
                    ))}
                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                            Abbrechen
                        </button>
                        <button type="submit" className="btn-primary px-4 py-2 text-sm shadow-md">
                            Erstellen
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}

function TimeTab() {
    const [weekOffset, setWeekOffset] = useState(0)

    // Simulate different data for different weeks
    const currentData = TIME_CHART_DATA.map(d => ({
        ...d,
        hours: Math.max(0, Math.round(d.hours + (Math.sin(weekOffset * 10 + d.hours) * 20)))
    }))

    const maxHours = Math.max(...currentData.map(d => d.hours))

    const weekNumber = 7 + weekOffset
    const month = new Date()
    month.setDate(month.getDate() + (weekOffset * 7))
    const monthName = month.toLocaleString('de-DE', { month: 'short', year: 'numeric' })

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">Zeiterfassung</h1>
                    <p className="text-gray-500 mt-1">Arbeitsstunden der laufenden Woche.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm font-mono shadow-sm text-gray-700">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <LiveClock />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 font-display">Wochenübersicht</h2>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <button
                            onClick={() => setWeekOffset(weekOffset - 1)}
                            className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500 hover:text-orange-600"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 px-2 min-w-[140px] justify-center">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>KW {weekNumber} — {monthName}</span>
                        </div>
                        <button
                            onClick={() => setWeekOffset(weekOffset + 1)}
                            className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-gray-500 hover:text-orange-600"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="flex items-end gap-3 h-48">
                    {currentData.map((d, i) => (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-2 group cursor-default">
                            <span className="text-xs text-gray-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-5">{d.hours}h</span>
                            <div className="w-full bg-gray-100 rounded-t-lg relative overflow-hidden" style={{ height: '160px' }}>
                                <motion.div
                                    key={weekOffset} // Force re-render animation when week changes
                                    initial={{ height: 0 }}
                                    animate={{ height: `${maxHours ? (d.hours / maxHours) * 100 : 0}%` }}
                                    transition={{ duration: 0.8, delay: i * 0.05, type: 'spring' }}
                                    className="absolute bottom-0 left-0 right-0 bg-orange-500 rounded-t-lg group-hover:bg-orange-600 transition-colors"
                                />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 font-display">Aktive Zeiterfassungen</h2>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        5 aktiv
                    </span>
                </div>
                <div className="space-y-3">
                    {EMPLOYEES.filter(e => e.status === 'Aktiv').map((e, i) => (
                        <motion.div
                            key={e.name}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-orange-200 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold border border-orange-200">
                                {e.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{e.name}</p>
                                <p className="text-xs text-gray-500">{e.project}</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-mono font-medium text-gray-900 bg-white px-3 py-1.5 rounded border border-gray-200">
                                <Timer className="w-4 h-4 text-orange-500 animate-pulse" />
                                {e.hours}
                                <span className="text-gray-400 text-xs animate-[pulse_1s_infinite]">:{i * 12 + 15}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

function ListTab({ title, subtitle, data, columns, icon: iconName, onAdd, onDelete }: { title: string, subtitle: string, data: any[], columns: any[], icon: string, onAdd: () => void, onDelete: (id: any) => void }) {
    const ICON_MAP: any = { Users, FolderKanban, Clock, Wrench, Package };
    const Icon = ICON_MAP[iconName] || Users; // Fallback

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">{title}</h1>
                    <p className="text-gray-500 mt-1">{subtitle}</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-outline text-sm py-2 px-3"><Filter className="w-4 h-4" /></button>
                    <button
                        onClick={onAdd}
                        className="btn-primary text-sm shadow-sm flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Neu</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            {columns.map((c, i) => (
                                <th key={i} className={`text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4 ${c.hidden ? c.hidden : ''}`}>
                                    {c.label}
                                </th>
                            ))}
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, i) => (
                            <motion.tr
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="border-b border-gray-50 hover:bg-orange-50/10 transition-colors cursor-pointer group"
                            >
                                {columns.map((c, j) => (
                                    <td key={j} className={`px-6 py-4 ${c.hidden ? c.hidden : ''} ${c.className || ''}`}>
                                        {c.render ? c.render(item) : item[c.key]}
                                    </td>
                                ))}
                                <td className="px-4 py-4">
                                    <DropdownMenu
                                        onEdit={() => { }}
                                        onDelete={() => onDelete(item.id || item.name)} // Fallback to name if ID missing
                                    />
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}

// ============================================================================
// Main Page Layout
// ============================================================================

export default function DemoPage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Data State
    const [projects, setProjects] = useState(PROJECTS)
    const [employees, setEmployees] = useState(EMPLOYEES)
    const [services, setServices] = useState(SERVICES)
    const [materials, setMaterials] = useState(MATERIALS)

    // UI State
    const [selectedProject, setSelectedProject] = useState<any>(null)
    const [toasts, setToasts] = useState<any[]>([])
    const [activeModal, setActiveModal] = useState<string | null>(null)

    const addToast = (message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
    }

    const handleAdd = (type: string, data: any) => {
        switch (type) {
            case 'project':
                setProjects(prev => [{
                    id: Date.now(),
                    name: data.name,
                    client: data.client,
                    status: 'Geplant',
                    statusColor: 'bg-amber-100 text-amber-700',
                    team: [],
                    progress: 0,
                    budget: parseFloat(data.budget) || 0,
                    cost: 0,
                    deadline: '2026-12-31',
                    description: 'Neu angelegtes Projekt.',
                    activities: ['Projekt angelegt']
                }, ...prev])
                addToast('Projekt erfolgreich erstellt')
                break
            case 'employee':
                setEmployees(prev => [{
                    name: data.name,
                    role: data.role,
                    hours: '0:00',
                    status: 'Frei',
                    statusColor: 'bg-gray-100 text-gray-600',
                    project: '—',
                    email: `${data.name.toLowerCase().replace(' ', '.')}@firma.de`
                }, ...prev])
                addToast('Mitarbeiter hinzugefügt')
                break
            case 'service':
                setServices(prev => [{
                    id: Date.now(),
                    name: data.name,
                    category: 'Allgemein',
                    price: `${data.price} €`,
                    unit: 'pauschal'
                }, ...prev])
                addToast('Leistung hinzugefügt')
                break
            case 'material':
                setMaterials(prev => [{
                    id: `M-${Math.floor(Math.random() * 9000) + 1000}`,
                    name: data.name,
                    stock: parseInt(data.stock) || 0,
                    unit: 'Stk',
                    reorder: 10,
                    price: `${data.price} €`
                }, ...prev])
                addToast('Material angelegt')
                break
        }
        setActiveModal(null)
    }

    const handleDelete = (type: string, id: any) => {
        if (!confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return

        switch (type) {
            case 'project':
                setProjects(prev => prev.filter(p => p.id !== id))
                break
            case 'employee':
                setEmployees(prev => prev.filter(e => e.name !== id)) // Name as ID for employees
                break
            case 'service':
                setServices(prev => prev.filter(s => s.id !== id))
                break
            case 'material':
                setMaterials(prev => prev.filter(m => m.id !== id))
                break
        }
        addToast('Eintrag gelöscht', 'success')
    }



    const renderTab = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab onOpenProject={setSelectedProject} projects={projects} />
            case 'projects': return <ProjectsTab onOpenProject={setSelectedProject} projects={projects} onAdd={() => setActiveModal('project')} onDelete={(id) => handleDelete('project', id)} />
            case 'time': return <TimeTab />
            case 'employees': return (
                <ListTab
                    title="Mitarbeiter"
                    subtitle="Verwalten Sie Ihr Team und Zuständigkeiten."
                    data={employees}
                    icon="Users"
                    onAdd={() => setActiveModal('employee')}
                    onDelete={(id) => handleDelete('employee', id)}
                    columns={[
                        { label: 'Name', key: 'name' /*, render: (e: any) => <div className="font-medium text-gray-900">{e.name}</div> */ },
                        { label: 'Rolle', key: 'role', className: 'hidden sm:table-cell text-gray-500' },
                        { label: 'Status', key: 'status' /*, render: (e: any) => <StatusBadge status={e.status} color={e.statusColor} /> */ },
                        { label: 'Aktuelles Projekt', key: 'project', className: 'hidden md:table-cell text-gray-500 text-sm' }
                    ]}
                />
            )
            case 'services': return (
                <ListTab
                    title="Leistungen"
                    subtitle="Dienstleistungen und Pauschalen."
                    data={services}
                    icon="Wrench"
                    onAdd={() => setActiveModal('service')}
                    onDelete={(id) => handleDelete('service', id)}
                    columns={[
                        { label: 'Bezeichnung', key: 'name' /*, render: (s: any) => <div className="font-medium text-gray-900">{s.name}</div> */ },
                        { label: 'Kategorie', key: 'category', className: 'text-gray-500' },
                        { label: 'Preis', key: 'price', className: 'font-mono text-gray-700' },
                        { label: 'Einheit', key: 'unit', className: 'text-gray-400 text-sm' }
                    ]}
                />
            )
            case 'materials': return (
                <ListTab
                    title="Materialien"
                    subtitle="Lagerbestand und Artikel."
                    data={materials}
                    icon="Package"
                    onAdd={() => setActiveModal('material')}
                    onDelete={(id) => handleDelete('material', id)}
                    columns={[
                        { label: 'Artikel-Nr.', key: 'id', className: 'font-mono text-xs text-gray-400' },
                        { label: 'Bezeichnung', key: 'name' /*, render: (m: any) => <div className="font-medium text-gray-900">{m.name}</div> */ },
                        {
                            label: 'Bestand', key: 'stock' /*, render: (m: any) => (
                                <div className={`flex items-center gap-2 ${m.stock <= m.reorder ? 'text-red-600 font-bold' : 'text-emerald-600'}`}>
                                    {m.stock <= m.reorder && <AlertCircle className="w-4 h-4" />}
                                    {m.stock} {m.unit}
                                </div>
                            ) */
                        },
                        { label: 'Preis', key: 'price', className: 'font-mono text-gray-700 hidden sm:table-cell' }
                    ]}
                />
            )
            default: return <OverviewTab onOpenProject={setSelectedProject} projects={projects} />
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-orange-100 selection:text-orange-900">
            <DemoBanner />

            {/* Modal */}
            <AnimatePresence>
                {selectedProject && (
                    <ProjectDetailModal project={selectedProject} onClose={() => setSelectedProject(null)} />
                )}
            </AnimatePresence>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm"
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
                <main className="p-6 md:p-8 max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderTab()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>


            {/* Modals & Toasts */}
            <AnimatePresence>
                {activeModal === 'project' && (
                    <ActionModal
                        title="Neues Projekt erstellen"
                        onClose={() => setActiveModal(null)}
                        onSubmit={data => handleAdd('project', data)}
                        fields={[
                            { name: 'name', label: 'Projektname' },
                            { name: 'client', label: 'Kunde' },
                            { name: 'budget', label: 'Budget (€)', type: 'number' }
                        ]}
                    />
                )}
                {activeModal === 'employee' && (
                    <ActionModal
                        title="Mitarbeiter hinzufügen"
                        onClose={() => setActiveModal(null)}
                        onSubmit={data => handleAdd('employee', data)}
                        fields={[
                            { name: 'name', label: 'Name' },
                            { name: 'role', label: 'Rolle', type: 'select', options: ['Meister', 'Geselle', 'Azubi', 'Bürokraft'] }
                        ]}
                    />
                )}
                {activeModal === 'service' && (
                    <ActionModal
                        title="Leistung hinzufügen"
                        onClose={() => setActiveModal(null)}
                        onSubmit={data => handleAdd('service', data)}
                        fields={[
                            { name: 'name', label: 'Bezeichnung' },
                            { name: 'price', label: 'Preis (€)', type: 'number' }
                        ]}
                    />
                )}
                {activeModal === 'material' && (
                    <ActionModal
                        title="Material anlegen"
                        onClose={() => setActiveModal(null)}
                        onSubmit={data => handleAdd('material', data)}
                        fields={[
                            { name: 'name', label: 'Bezeichnung' },
                            { name: 'stock', label: 'Bestand', type: 'number' },
                            { name: 'price', label: 'Preis (€)', type: 'number' }
                        ]}
                    />
                )}
            </AnimatePresence>

            <ToastContainer toasts={toasts} />
        </div >
    )
}
