'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const industries = [
  { name: 'Umzugsunternehmen', desc: 'Abnahmeprotokolle, Zeiterfassung und Fahrzeugplanung in einem System.', tags: ['Abnahmen', 'Fahrzeuge', 'Zeiterfassung'], href: '/fuer-umzugsunternehmen' },
  { name: 'Sanitär & Heizung', desc: 'Auftragsmanagement, Materialverbrauch und Wartungspläne.', tags: ['Wartung', 'Material', 'Planung'], href: '/fuer-sanitaer-heizung' },
  { name: 'Elektrobetriebe', desc: 'E-Checks, Prüfprotokolle und digitale Dokumentation.', tags: ['Prüfprotokolle', 'Material', 'Doku'], href: '/fuer-elektrobetriebe' },
  { name: 'Malerbetriebe', desc: 'Materialverwaltung, Nachkalkulation und digitale Dokumentation.', tags: ['Material', 'Kalkulation', 'Doku'], href: '/fuer-maler' },
  { name: 'Gerüstbau', desc: 'Prüfprotokolle, Standzeit-Tracking und Personalplanung.', tags: ['Prüfung', 'Teams', 'Dokumentation'], href: '/fuer-geruestbauer' },
  { name: 'Krankentransport', desc: 'Disposition, Fuhrparkmanagement und lückenlose Transportdokumentation.', tags: ['Disposition', 'Fuhrpark', 'Personal'], href: '/fuer-krankentransport' },
  { name: 'Reinigungsunternehmen', desc: 'Objektplanung, Checklisten und Qualitätskontrolle.', tags: ['Objekte', 'Checklisten', 'Qualität'], href: '/fuer-reinigungsunternehmen' },
  { name: 'Gas & Wasser', desc: 'Prüfprotokolle, Materialverwaltung und Wartungsplanung für Gas- und Wasserinstallateure.', tags: ['Prüfungen', 'Material', 'Wartung'], href: '/fuer-gas-wasser' },
  { name: 'Weitere Gewerke', desc: 'Flexibel anpassbar für Dachdecker, Schreinereien, Gartenbau und mehr.', tags: ['Alle Module', 'Anpassbar'], href: '/fuer-handwerksbetriebe' },
]

export function Industries() {
  return (
    <section id="industries" className="py-24 bg-stone-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Branchen</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3 tracking-tight">Für jedes Gewerk gemacht</h2>
          <p className="text-lg text-gray-500 leading-relaxed">Branchenspezifische Module, die sich Ihrem Betrieb anpassen.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry, i) => {
            const card = (
              <motion.div
                key={industry.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className={`bg-white rounded-[2rem] p-8 border border-stone-200/60 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-950/5 transition-all ${industry.href ? 'cursor-pointer' : ''}`}
              >
                <h3 className="font-display font-bold text-gray-900 text-lg mb-2">{industry.name}</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{industry.desc}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {industry.tags.map(t => (
                    <span key={t} className="px-3 py-1 text-[11px] text-gray-600 bg-stone-100 rounded-lg font-semibold uppercase tracking-wider">{t}</span>
                  ))}
                </div>
                {industry.href && (
                  <span className="inline-flex items-center gap-1 text-sm text-orange-600 font-semibold group-hover:gap-2 transition-all">
                    Mehr erfahren <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </motion.div>
            )

            if (industry.href) {
              return (
                <Link key={industry.name} href={industry.href} className="group">
                  {card}
                </Link>
              )
            }

            return card
          })}
        </div>
      </div>
    </section>
  )
}
