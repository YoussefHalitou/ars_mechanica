'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X } from 'lucide-react'

const tiers = [
  {
    name: 'Starter', price: '49', yearlyPrice: '39', desc: 'Ideal für kleine Betriebe', popular: false,
    features: [
      { name: 'Bis zu 3 Benutzer', ok: true },
      { name: 'Alle Kernmodule', ok: true },
      { name: 'Zeiterfassung & Projekte', ok: true },
      { name: 'E-Mail Support', ok: true },
      { name: 'API-Integrationen', ok: false },
      { name: 'KI-Assistent', ok: false },
    ],
  },
  {
    name: 'Professional', price: '99', yearlyPrice: '79', desc: 'Für wachsende Betriebe', popular: true,
    features: [
      { name: 'Bis zu 10 Benutzer', ok: true },
      { name: 'Alle Kernmodule', ok: true },
      { name: 'Lexoffice & Kalender', ok: true },
      { name: 'Webhook-API', ok: true },
      { name: 'Prioritäts-Support', ok: true },
      { name: 'KI-Assistent', ok: false },
    ],
  },
  {
    name: 'Enterprise', price: '199', yearlyPrice: '159', desc: 'Unbegrenztes Wachstum', popular: false,
    features: [
      { name: 'Unbegrenzte Benutzer', ok: true },
      { name: 'Alle Integrationen', ok: true },
      { name: 'Predictive Analytics', ok: true },
      { name: 'KI-Datenassistent', ok: true },
      { name: 'Custom Branding', ok: true },
      { name: 'SSO & Audit Logs', ok: true },
    ],
  },
]

export function Pricing() {
  const [yearly, setYearly] = useState(false)

  return (
    <section id="pricing" className="py-24 bg-stone-50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-xl mx-auto mb-10"
        >
          <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Preise</p>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-3 tracking-tight">Einfache, faire Preise</h2>
          <p className="text-lg text-gray-500 leading-relaxed">7 Tage kostenlos testen. Monatlich kündbar. Keine versteckten Kosten.</p>
        </motion.div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <span className={`text-sm transition-colors ${!yearly ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>Monatlich</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative w-14 h-7 rounded-full transition-colors p-1 ${yearly ? 'bg-orange-500' : 'bg-gray-300'}`}
          >
            <motion.span
              animate={{ x: yearly ? 28 : 0 }}
              className="block w-5 h-5 rounded-full bg-white shadow-md cursor-pointer"
            />
          </button>
          <span className={`text-sm transition-colors ${yearly ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
            Jährlich <span className="text-orange-600 font-bold text-xs ml-1">−20% Sparen</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -8 }}
              className={`rounded-[2.5rem] p-10 flex flex-col transition-all ${t.popular
                  ? 'bg-orange-600 text-white shadow-2xl shadow-orange-950/20 ring-4 ring-orange-500/10'
                  : 'bg-white border border-stone-100 shadow-xl shadow-stone-950/5'
                }`}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-xl font-display font-bold ${t.popular ? 'text-white' : 'text-gray-900'}`}>{t.name}</h3>
                  {t.popular && <span className="text-[10px] bg-white text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Beliebt</span>}
                </div>
                <p className={`text-sm ${t.popular ? 'text-orange-100' : 'text-gray-500'}`}>{t.desc}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={yearly ? 'y' : 'm'}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className={`text-5xl font-display font-bold ${t.popular ? 'text-white' : 'text-gray-900'}`}
                    >
                      {yearly ? t.yearlyPrice : t.price}€
                    </motion.span>
                  </AnimatePresence>
                  <span className={`text-lg font-medium ${t.popular ? 'text-orange-100' : 'text-gray-400'}`}>/ Monat</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {t.features.map(f => (
                  <li key={f.name} className="flex items-center gap-3 text-sm font-medium">
                    {f.ok ? (
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${t.popular ? 'bg-white/20' : 'bg-orange-50'}`}>
                        <Check className={`w-3 h-3 ${t.popular ? 'text-white' : 'text-orange-600'}`} />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center bg-transparent">
                        <X className={`w-3 h-3 ${t.popular ? 'text-orange-800' : 'text-stone-300'}`} />
                      </div>
                    )}
                    <span className={f.ok ? '' : (t.popular ? 'text-orange-200/50' : 'text-gray-400')}>{f.name}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/register?tier=${t.name.toLowerCase()}`}
                className={`block text-center py-4 rounded-2xl text-base font-bold transition-all ${t.popular
                    ? 'bg-white text-orange-600 hover:shadow-lg active:scale-95'
                    : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg active:scale-95'
                  }`}
              >
                Kostenlos testen
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center mt-12 text-sm text-stone-400 font-medium tracking-wide italic">Alle Preise zzgl. MwSt. Jederzeit kündbar.</p>
      </div>
    </section>
  )
}
