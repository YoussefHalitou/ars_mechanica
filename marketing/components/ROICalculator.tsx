'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Euro, CalendarCheck } from 'lucide-react'

function useAnimatedNumber(target: number, duration = 400) {
    const [display, setDisplay] = useState(target)
    const rafRef = useRef<number>(0)
    const startRef = useRef(target)
    const startTimeRef = useRef(0)

    useEffect(() => {
        startRef.current = display
        startTimeRef.current = performance.now()

        const animate = (now: number) => {
            const elapsed = now - startTimeRef.current
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
            const current = startRef.current + (target - startRef.current) * eased
            setDisplay(Math.round(current))
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate)
            }
        }

        rafRef.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(rafRef.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, duration])

    return display
}

function getTierCost(employees: number) {
    if (employees <= 3) return 49
    if (employees <= 10) return 99
    return 199
}

function getTierName(employees: number) {
    if (employees <= 3) return 'Starter'
    if (employees <= 10) return 'Professional'
    return 'Enterprise'
}

export function ROICalculator() {
    const [employees, setEmployees] = useState(5)
    const [projects, setProjects] = useState(10)

    const hoursSaved = Math.round(employees * 3.5 + projects * 1.2)
    const moneySaved = Math.round(hoursSaved * 35)
    const softwareCost = getTierCost(employees)
    const paybackDays = Math.max(1, Math.round((softwareCost / moneySaved) * 30))
    const tierName = getTierName(employees)

    const animHours = useAnimatedNumber(hoursSaved)
    const animMoney = useAnimatedNumber(moneySaved)
    const animPayback = useAnimatedNumber(paybackDays)

    return (
        <section id="roi" className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center max-w-xl mx-auto mb-14"
                >
                    <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">ROI Rechner</p>
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3 tracking-tight">Was spart Ihr Betrieb?</h2>
                    <p className="text-lg text-gray-500 leading-relaxed">Bewegen Sie die Regler — und sehen Sie, wie viel Zeit und Geld Sie mit Ars Mechanica sparen können.</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="bg-stone-50 rounded-[2rem] border border-stone-200/60 p-8 sm:p-12"
                >
                    {/* Sliders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {/* Employees slider */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-gray-700">Mitarbeiter</label>
                                <span className="text-2xl font-display font-bold text-gray-900">{employees}</span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={50}
                                value={employees}
                                onChange={(e) => setEmployees(Number(e.target.value))}
                                className="roi-slider w-full"
                            />
                            <div className="flex justify-between mt-1.5 text-xs text-gray-400 font-medium">
                                <span>1</span>
                                <span>25</span>
                                <span>50</span>
                            </div>
                        </div>

                        {/* Projects slider */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-gray-700">Projekte / Monat</label>
                                <span className="text-2xl font-display font-bold text-gray-900">{projects}</span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={50}
                                value={projects}
                                onChange={(e) => setProjects(Number(e.target.value))}
                                className="roi-slider w-full"
                            />
                            <div className="flex justify-between mt-1.5 text-xs text-gray-400 font-medium">
                                <span>1</span>
                                <span>25</span>
                                <span>50</span>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                        <div className="bg-white rounded-2xl p-6 border border-stone-200/60 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 mb-3">
                                <Clock className="w-5 h-5 text-orange-600" />
                            </div>
                            <div className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-1">
                                {animHours}<span className="text-lg text-gray-400 font-medium">h</span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Stunden gespart / Monat</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-stone-200/60 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 mb-3">
                                <Euro className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-1">
                                {animMoney.toLocaleString('de-DE')}<span className="text-lg text-gray-400 font-medium">€</span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Kostenersparnis / Monat</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-stone-200/60 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 mb-3">
                                <CalendarCheck className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-1">
                                {animPayback}<span className="text-lg text-gray-400 font-medium"> {animPayback === 1 ? 'Tag' : 'Tage'}</span>
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Amortisierung ({tierName}-Tarif)</p>
                        </div>
                    </div>

                    {/* Info + CTA */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-stone-200/60">
                        <p className="text-xs text-gray-400 text-center sm:text-left max-w-md">
                            Berechnung basiert auf Ø 3,5h Verwaltungsersparnis pro Mitarbeiter + 1,2h pro Projekt bei Ø €35 Stundensatz.
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center px-8 py-3.5 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-950/10 transition-all active:scale-95 text-sm whitespace-nowrap"
                        >
                            Jetzt 7 Tage kostenlos testen
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
