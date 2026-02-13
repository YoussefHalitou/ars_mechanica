'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
    { q: 'Brauche ich technische Kenntnisse?', a: 'Nein. Ars Mechanica ist so einfach wie eine Smartphone-App. Ihre Mitarbeiter können sofort loslegen, ohne teure Schulungen.' },
    { q: 'Kann ich den Tarif jederzeit wechseln?', a: 'Ja, absolut. Sie können jederzeit upgraden oder downgraden. Die Abrechnung wird tagesgenau und automatisch angepasst.' },
    { q: 'Sind meine Daten sicher?', a: 'Sicherheit steht bei uns an erster Stelle. Alle Daten werden nach höchsten Standards verschlüsselt in zertifizierten deutschen Rechenzentren gespeichert — zu 100% DSGVO-konform.' },
    { q: 'Was passiert nach der Testphase?', a: 'Nach 7 Tagen wählen Sie einen Tarif aus. Wenn Sie sich dagegen entscheiden, wird Ihr Konto einfach pausiert. Ihre Daten bleiben 30 Tage gespeichert, falls Sie es sich anders überlegen.' },
    { q: 'Gibt es eine mobile App?', a: 'Ars Mechanica ist eine moderne Web-App. Das bedeutet: Sie funktioniert auf jedem Gerät — Smartphone, Tablet und Desktop — ohne lästige Installation oder Updates.' },
]

export function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className="py-24 bg-white">
            <div className="max-w-3xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-16"
                >
                    <span className="text-orange-600 font-display font-semibold tracking-wide uppercase text-xs">Fragen</span>
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-2 tracking-tight">Häufige Fragen</h2>
                </motion.div>

                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="bg-stone-50 rounded-2xl overflow-hidden border border-stone-100/50">
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full px-8 py-6 text-left flex items-center justify-between gap-4 group"
                            >
                                <span className="text-base font-display font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{faq.q}</span>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-orange-600' : 'text-stone-400'}`}>
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </button>
                            <AnimatePresence>
                                {openIndex === i && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                    >
                                        <div className="px-8 pb-6 text-base text-gray-500 leading-relaxed max-w-2xl">
                                            {faq.a}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
