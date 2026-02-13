'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="pt-32 pb-24 bg-[radial-gradient(45%_40%_at_50%_0%,rgba(255,145,0,0.1)_0%,rgba(255,255,255,0)_100%)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 text-[13px] text-orange-700 bg-orange-100/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full mb-8 font-medium">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Neu: KI-Morgenplanung jetzt verfügbar
            </div>
            <h1 className="text-5xl sm:text-[64px] font-display font-bold text-gray-900 leading-[1.05] mb-6 tracking-tight">
              Software für Profis.<br />
              <span className="text-orange-600">Herz fürs Handwerk.</span>
            </h1>
            <p className="text-[19px] text-gray-500 mb-10 leading-relaxed max-w-lg">
              Ars Mechanica hilft Ihnen, Ihren Betrieb digital zu führen — ohne komplizierte IT, sondern nah am Werkzeug und nah am Kunden.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-4 mb-10"
          >
            <Link href="/register" className="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-white bg-orange-600 rounded-2xl hover:bg-orange-700 transition-all hover:shadow-[0_8px_30px_rgb(234,88,12,0.2)] active:scale-95">
              Jetzt kostenlos starten <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center px-7 py-3.5 text-base font-medium text-gray-700 border border-stone-200 bg-white rounded-2xl hover:border-orange-200 hover:bg-orange-50/30 transition-all active:scale-95">
              Tour ansehen
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm text-gray-400 flex items-center gap-5"
          >
            <span className="flex items-center gap-2">✓ Keine Kreditkarte</span>
            <span className="flex items-center gap-2">✓ DSGVO-konform</span>
            <span className="flex items-center gap-2">✓ 🇩🇪 Made in Berlin</span>
          </motion.p>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          className="mt-20 relative px-4"
        >
          {/* Subtle glow behind dashboard */}
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
              <div className="w-12" /> {/* Spacer */}
            </div>
            <div className="p-8 sm:p-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {[
                  { label: 'Offene Projekte', value: '23', color: 'orange' },
                  { label: 'Stunden heute', value: '42h', color: 'emerald' },
                  { label: 'Auslastung', value: '94%', color: 'blue' },
                ].map((stat, i) => (
                  <div key={i} className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
                    <div className={`text-2xl font-bold text-gray-900`}>{stat.value}</div>
                    <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Umzug Müller — Berlin', status: 'In Bearbeitung', color: 'bg-orange-500' },
                  { name: 'Sanitär installation — Mitte', status: 'Wartend', color: 'bg-blue-400' },
                  { name: 'Elektro-Check — Kita Süd', status: 'Fertig', color: 'bg-emerald-500' },
                ].map((p, i) => (
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
