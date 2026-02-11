'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-orange-600 rounded-[3rem] px-8 py-16 sm:py-20 text-center relative overflow-hidden shadow-2xl shadow-orange-900/10">
          {/* Decorative elements for warmth */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500 rounded-full blur-3xl -ml-20 -mt-20 opacity-50" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-400 rounded-full blur-3xl -mr-20 -mb-20 opacity-30" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative z-10 max-w-2xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
              Starten Sie jetzt in die digitale Zukunft.
            </h2>
            <p className="text-orange-50 text-lg mb-10 leading-relaxed">
              In unter 5 Minuten registriert. Keine Kreditkarte erforderlich. 7 Tage kostenlos alles testen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-4 bg-white text-orange-600 rounded-2xl font-bold text-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                Kostenlos testen <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center px-8 py-4 text-white font-medium hover:bg-white/10 rounded-2xl transition-all border border-white/20"
              >
                Demo ansehen
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center px-8 py-4 text-white font-medium hover:bg-white/10 rounded-2xl transition-all"
              >
                Beratungsgespräch vereinbaren
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-orange-100/80">
              <span className="flex items-center gap-1.5 font-medium">✓ DSGVO-konform</span>
              <span className="flex items-center gap-1.5 font-medium">✓ Monatlich kündbar</span>
              <span className="flex items-center gap-1.5 font-medium">✓ Persönlicher Support</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
