'use client'

import { useState } from 'react'
import { AuthProvider } from '@/lib/auth'
import { QueryProvider } from '@/lib/query-provider'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Topbar } from '@/components/dashboard/Topbar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <QueryProvider>
            <AuthProvider>
                <div className="min-h-screen bg-gray-50">
                    {/* Mobile overlay */}
                    {mobileMenuOpen && (
                        <div
                            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                    )}

                    {/* Sidebar */}
                    <div
                        className={`lg:block ${mobileMenuOpen ? 'block' : 'hidden'}`}
                    >
                        <Sidebar
                            collapsed={sidebarCollapsed}
                            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                        />
                    </div>

                    {/* Main content */}
                    <div
                        className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
                            }`}
                    >
                        <Topbar onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
                        <main className="p-6">{children}</main>
                    </div>
                </div>
            </AuthProvider>
        </QueryProvider>
    )
}
