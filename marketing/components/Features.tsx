'use client'

import { motion } from 'framer-motion'
import { FileText, Clock, Calendar, Users, Package, CheckSquare, BarChart3, Truck } from 'lucide-react'

const features = [
  { icon: <FileText className="w-6 h-6" />, title: 'Projektmanagement', desc: 'Verwalten Sie alle Kundenprojekte an einem Ort. Status, Termine und Dokumente.' },
  { icon: <Clock className="w-6 h-6" />, title: 'Zeiterfassung', desc: 'Digitale Stempeluhr mit GPS. Arbeitszeiten und Pausen rechtssicher erfasst.' },
  { icon: <Calendar className="w-6 h-6" />, title: 'Morgenplanung', desc: 'Tagesplanung für Ihre Teams. Fahrzeuge, Personal und Aufträge im Griff.' },
  { icon: <Users className="w-6 h-6" />, title: 'Mitarbeiter', desc: 'Qualifikationen, Verfügbarkeit und Urlaubsplanung auf einen Blick.' },
  { icon: <Package className="w-6 h-6" />, title: 'Material', desc: 'Lagerbestände und Materialverbrauch direkt auf Projekte buchen.' },
  { icon: <CheckSquare className="w-6 h-6" />, title: 'Abnahmen', desc: 'Digitale Protokolle mit Foto-Doku und Kundenunterschrift.' },
  { icon: <BarChart3 className="w-6 h-6" />, title: 'Auswertungen', desc: 'Produktivitätsanalysen und Berichte für Ihre Buchhaltung.' },
  { icon: <Truck className="w-6 h-6" />, title: 'Fuhrpark', desc: 'TÜV-Termine, Kilometerstände und Tankbelege zentral verwalten.' },
]

export function Features() {
  return (
    <section id="features" className="py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <p className="text-orange-600 font-display font-semibold tracking-wide uppercase text-xs">Module</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mt-3 mb-4 tracking-tight">Alles für Ihren Betrieb</h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Weg von der Zettelwirtschaft. Ars Mechanica digitalisiert Ihre Prozesse dort, wo es wirklich hilft.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
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
                {f.icon}
              </div>
              <h3 className="text-lg font-display font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
