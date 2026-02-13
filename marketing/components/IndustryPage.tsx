'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
    ArrowRight, ArrowLeft, Star, XCircle,
    Truck, Clock, ClipboardCheck, Users, Package, MapPin,
    PaintBucket, Calculator, FileText, BarChart3, Camera, CheckSquare,
    Shield, Wrench, CalendarDays, HardHat, Ruler, AlertTriangle,
    Droplets, Thermometer, Zap, CircuitBoard, Stethoscope, Navigation,
    SprayCan, Building2, ListChecks, Flame
} from 'lucide-react'
import { Header } from '@/components/Header'
import { CTA } from '@/components/CTA'
import { Footer } from '@/components/Footer'
import type { IndustryConfig } from '@/lib/industryData'
import React from 'react'

// ============================================================================
// Section: Industry Hero
// ============================================================================

function IndustryHero({ industry }: { industry: IndustryConfig }) {
    return (
        <section className="pt-32 pb-20 bg-[radial-gradient(45%_40%_at_50%_0%,rgba(255,145,0,0.1)_0%,rgba(255,255,255,0)_100%)]">
            <div className="max-w-6xl mx-auto px-6">
                <div className="max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        <Link
                            href="/#industries"
                            className="inline-flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Alle Branchen
                        </Link>

                        <div className="inline-flex items-center gap-2 text-[13px] text-orange-700 bg-orange-100/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full mb-8 font-medium ml-4">
                            <span className="w-2 h-2 bg-orange-500 rounded-full" />
                            {industry.heroTag}
                        </div>

                        <h1 className="text-5xl sm:text-[64px] font-display font-bold text-gray-900 leading-[1.05] mb-6 tracking-tight">
                            {industry.heroTitle}<br />
                            <span className="text-orange-600">{industry.heroHighlight}</span>
                        </h1>
                        <p className="text-[19px] text-gray-500 mb-10 leading-relaxed max-w-lg">
                            {industry.heroDesc}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
                        className="flex flex-col sm:flex-row gap-4 mb-10"
                    >
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-white bg-orange-600 rounded-2xl hover:bg-orange-700 transition-all hover:shadow-[0_8px_30px_rgb(234,88,12,0.2)] active:scale-95"
                        >
                            Jetzt kostenlos testen <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                        <Link
                            href="/kontakt"
                            className="inline-flex items-center justify-center px-7 py-3.5 text-base font-medium text-gray-700 border border-stone-200 bg-white rounded-2xl hover:border-orange-200 hover:bg-orange-50/30 transition-all active:scale-95"
                        >
                            Beratung vereinbaren
                        </Link>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="text-sm text-gray-400 flex items-center gap-5"
                    >
                        <span className="flex items-center gap-2">✓ 7 Tage kostenlos</span>
                        <span className="flex items-center gap-2">✓ Keine Kreditkarte</span>
                        <span className="flex items-center gap-2">✓ DSGVO-konform</span>
                    </motion.p>
                </div>
            </div>
        </section>
    )
}


// ============================================================================
// Section: Pain Points
// ============================================================================

function PainPoints({ industry }: { industry: IndustryConfig }) {
    return (
        <section className="py-20 bg-stone-50">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center max-w-xl mx-auto mb-14"
                >
                    <p className="text-sm font-display font-semibold text-red-500 mb-2 uppercase tracking-wide">Ohne Ars Mechanica</p>
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3 tracking-tight">
                        Kennen Sie das?
                    </h2>
                    <p className="text-lg text-gray-500 leading-relaxed">
                        Typische Herausforderungen, die {industry.name} jeden Tag kosten.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {industry.painPoints.map((pp, i) => (
                        <motion.div
                            key={pp.title}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="bg-white rounded-[2rem] p-8 border border-red-100 shadow-sm"
                        >
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-400 mb-5">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <h3 className="font-display font-bold text-gray-900 text-lg mb-2">{pp.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{pp.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}


// ============================================================================
// Section: Industry Features
// ============================================================================

// ... imports will be updated in next step or combined

const ICON_MAP: Record<string, any> = {
    Truck, Clock, ClipboardCheck, Users, Package, MapPin,
    PaintBucket, Calculator, FileText, BarChart3, Camera, CheckSquare,
    Shield, Wrench, CalendarDays, HardHat, Ruler, AlertTriangle,
    Droplets, Thermometer, Zap, CircuitBoard, Stethoscope, Navigation,
    SprayCan, Building2, ListChecks, Flame,
    ArrowRight, ArrowLeft, Star, XCircle
}

// ...

function IndustryFeatures({ industry }: { industry: IndustryConfig }) {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center max-w-xl mx-auto mb-14"
                >
                    <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Die Lösung</p>
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3 tracking-tight">
                        Alles, was {industry.name} brauchen
                    </h2>
                    <p className="text-lg text-gray-500 leading-relaxed">
                        Module, die genau auf Ihren Betrieb zugeschnitten sind.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {industry.features.map((f, i) => {
                        const Icon = ICON_MAP[f.icon as string] || BarChart3 // Fallback
                        return (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                whileHover={{ y: -5 }}
                                className="p-8 rounded-[2rem] bg-stone-50 hover:bg-white hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:ring-1 hover:ring-stone-100 transition-all group"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-sm text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-display font-bold text-gray-900 mb-2">{f.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}


// ============================================================================
// Section: Dashboard Preview
// ============================================================================

function DashboardPreview({ industry }: { industry: IndustryConfig }) {
    return (
        <section className="py-24 bg-stone-50">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center max-w-xl mx-auto mb-14"
                >
                    <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Dashboard</p>
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3 tracking-tight">
                        Ihr Betrieb auf einen Blick
                    </h2>
                    <p className="text-lg text-gray-500 leading-relaxed">
                        So sieht Ihr Dashboard aus — angepasst an Ihren Betrieb.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative max-w-4xl mx-auto"
                >
                    <div className="absolute -inset-10 bg-orange-500/10 rounded-[4rem] blur-[80px] -z-10" />

                    <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-stone-100">
                        <div className="bg-stone-50/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-stone-100">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-stone-200" />
                                <div className="w-3 h-3 rounded-full bg-stone-200" />
                                <div className="w-3 h-3 rounded-full bg-stone-200" />
                            </div>
                            <div className="text-stone-400 text-[12px] font-medium bg-white px-4 py-1 rounded-full border border-stone-100">
                                dashboard.arsmechanica.de
                            </div>
                            <div className="w-12" />
                        </div>
                        <div className="p-8 sm:p-10">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                                {industry.dashboardStats.map((stat, i) => (
                                    <div key={i} className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                        <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-3">
                                {industry.dashboardProjects.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white rounded-xl px-5 py-4 border border-stone-100 shadow-sm">
                                        <span className="text-gray-700 font-medium">{p.name}</span>
                                        <span className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <span className={`w-2 h-2 rounded-full ${p.color}`} />
                                            {p.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}


// ============================================================================
// Section: Testimonial
// ============================================================================

function IndustryTestimonial({ industry }: { industry: IndustryConfig }) {
    const t = industry.testimonial
    return (
        <section className="py-24 bg-white">
            <div className="max-w-3xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="bg-stone-50 rounded-[2.5rem] p-10 sm:p-14 text-center"
                >
                    <div className="flex justify-center gap-1 mb-6">
                        {[...Array(5)].map((_, j) => (
                            <Star key={j} className="w-5 h-5 text-orange-500 fill-orange-500" />
                        ))}
                    </div>
                    <p className="text-gray-800 text-xl sm:text-2xl font-medium leading-relaxed mb-8 italic max-w-xl mx-auto">
                        &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-sm font-bold shadow-sm">
                            {t.name[0]}
                        </div>
                        <div className="text-left">
                            <div className="text-base font-bold text-gray-900 font-display">{t.name}</div>
                            <div className="text-sm text-gray-500">{t.role}</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}


// ============================================================================
// Composed Industry Page
// ============================================================================

export function IndustryPage({ industry }: { industry: IndustryConfig }) {
    return (
        <main className="min-h-screen bg-white">
            <Header />
            <IndustryHero industry={industry} />
            <PainPoints industry={industry} />
            <IndustryFeatures industry={industry} />
            <DashboardPreview industry={industry} />
            <IndustryTestimonial industry={industry} />
            <CTA />
            <Footer />
        </main>
    )
}
