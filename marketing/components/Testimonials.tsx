'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
    { name: 'Thomas M.', role: 'Geschäftsführer, Umzüge Berlin', text: 'Seit wir Ars Mechanica nutzen, haben wir 40% weniger Verwaltungsaufwand. Die Morgenplanung allein spart uns jeden Tag eine Stunde.' },
    { name: 'Sandra K.', role: 'Büroleiterin, Sanitär Schmidt', text: 'Endlich eine Software, die für Handwerker gemacht ist. Unsere Monteure kamen sofort damit klar.' },
    { name: 'Michael R.', role: 'Inhaber, Elektro Richter', text: 'Die Auswertungen zeigen mir genau, welche Projekte profitabel sind. Das hat unsere Marge um 15% verbessert.' },
    { name: 'Petra W.', role: 'Planerin, Tischlerei Weber', text: 'Materialverwaltung und Zeiterfassung in einer App — nie wieder Excel-Listen.' },
]

export function Testimonials() {
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
                    <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Kundenstimmen</p>
                    <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3 tracking-tight">Was unsere Kunden sagen</h2>
                    <p className="text-lg text-gray-500 leading-relaxed">Über 500 Betriebe arbeiten bereits mit Ars Mechanica.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="bg-stone-50 rounded-[2.5rem] p-8 sm:p-10"
                        >
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} className="w-4 h-4 text-orange-500 fill-orange-500" />
                                ))}
                            </div>
                            <p className="text-gray-800 text-lg font-medium leading-relaxed mb-8 italic">
                                &ldquo;{t.text}&rdquo;
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-sm font-bold shadow-sm">
                                    {t.name[0]}
                                </div>
                                <div>
                                    <div className="text-base font-bold text-gray-900 font-display">{t.name}</div>
                                    <div className="text-sm text-gray-500">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
