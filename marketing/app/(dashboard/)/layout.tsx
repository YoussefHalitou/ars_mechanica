'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Briefcase,
    Clock,
    Users,
    Package,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    User as UserIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projekte', href: '/dashboard/projekte', icon: Briefcase },
    { name: 'Zeiterfassung', href: '/dashboard/zeiterfassung', icon: Clock },
    { name: 'Mitarbeiter', href: '/dashboard/mitarbeiter', icon: Users },
    { name: 'Material', href: '/dashboard/material', icon: Package },
    { name: 'Einstellungen', href: '/dashboard/einstellungen', icon: Settings },
]

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-stone-50 flex">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-stone-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="h-full flex flex-col">
                    {/* Logo Section */}
                    <div className="p-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                AM
                            </div>
                            <span className="font-display font-bold text-gray-900 text-lg">Ars Mechanica</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200
                    ${isActive
                                            ? 'bg-orange-50 text-orange-600 shadow-sm'
                                            : 'text-gray-500 hover:bg-stone-50 hover:text-gray-900'}
                  `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium text-[15px]">{item.name}</span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-indicator"
                                            className="ml-auto w-1 h-5 bg-orange-600 rounded-full"
                                        />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Bottom Profile Section */}
                    <div className="p-4 mt-auto border-t border-stone-100">
                        <div className="bg-stone-50 rounded-2xl p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-bold">
                                    YH
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-gray-900 truncate">Youssef Halitou</p>
                                    <p className="text-xs text-stone-500 truncate">Admin • Mechanica GmbH</p>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <LogOut className="w-4 h-4" />
                                Abmelden
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar */}
                <header className="h-20 bg-white border-b border-stone-200 flex items-center justify-between px-6 md:px-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-gray-500 md:hidden hover:bg-stone-100 rounded-xl"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="hidden sm:flex items-center gap-3 bg-stone-50 px-4 py-2 rounded-2xl border border-stone-200/60 w-80">
                            <Search className="w-4 h-4 text-stone-400" />
                            <input
                                type="text"
                                placeholder="Suche nach Projekten..."
                                className="bg-transparent border-none outline-none text-[14px] w-full placeholder:text-stone-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-5">
                        <button className="p-2.5 text-gray-500 hover:bg-stone-50 hover:text-orange-600 rounded-2xl transition-all relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full ring-2 ring-white" />
                        </button>
                        <div className="h-10 w-[1px] bg-stone-200 mx-1 hidden sm:block" />
                        <button className="flex items-center gap-3 px-3 py-2 hover:bg-stone-50 rounded-2xl transition-all group">
                            <div className="hidden md:block text-right">
                                <p className="text-[14px] font-bold text-gray-900">Ars Mechanica</p>
                                <p className="text-[12px] text-orange-600 font-medium lowercase">Pro Plan</p>
                            </div>
                            <div className="w-10 h-10 bg-stone-100 rounded-2xl flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                                <UserIcon className="w-5 h-5 text-gray-500" />
                            </div>
                        </button>
                    </div>
                </header>

                {/* Dynamic Content Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    {children}
                </main>
            </div>
        </div>
    )
}
