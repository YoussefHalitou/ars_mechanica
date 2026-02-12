'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Send, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function KontaktPage() {
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitted(true)
    }

    return (
        <main className="min-h-screen bg-white font-sans">
            <Header />
            <section className="pt-28 pb-20">
                <div className="max-w-xl mx-auto px-6">
                    <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Kontakt</p>
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 mb-4 tracking-tight">
                        Sprechen Sie mit uns
                    </h1>
                    <p className="text-lg text-gray-500 mb-12 leading-relaxed">
                        Fragen, Feedback oder Demo-Anfrage? Wir melden uns innerhalb eines Werktages persönlich bei Ihnen.
                    </p>

                    <AnimatePresence mode="wait">
                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-orange-50 border border-orange-200 rounded-[2rem] p-10 text-center"
                            >
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <CheckCircle2 className="w-8 h-8 text-orange-500" />
                                </div>
                                <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Nachricht gesendet!</h3>
                                <p className="text-gray-600">Vielen Dank für Ihr Interesse. Wir melden uns schnellstmöglich bei Ihnen.</p>
                            </motion.div>
                        ) : (
                            <motion.form
                                exit={{ opacity: 0, scale: 0.95 }}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            required
                                            className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-base focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all placeholder:text-stone-400"
                                            placeholder="Max Mustermann"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 ml-1">E-Mail</label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-base focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all placeholder:text-stone-400"
                                            placeholder="max@beispiel.de"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="company" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Firma (optional)</label>
                                    <input
                                        type="text"
                                        id="company"
                                        className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-base focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all placeholder:text-stone-400"
                                        placeholder="Mustermann GmbH"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Wie können wir helfen?</label>
                                    <textarea
                                        id="message"
                                        required
                                        rows={5}
                                        className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-base focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white outline-none transition-all placeholder:text-stone-400 resize-none"
                                        placeholder="Erzählen Sie uns kurz von Ihrem Betrieb..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-orange-600 text-white rounded-2xl text-base font-bold hover:bg-orange-700 transition-all hover:shadow-xl hover:shadow-orange-900/10 active:scale-95"
                                >
                                    Nachricht senden <Send className="w-4 h-4 ml-2" />
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="mt-20 pt-12 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Kontaktdaten</h4>
                            <div className="space-y-3 text-base text-gray-500">
                                <p><strong className="text-gray-900 font-medium">E-Mail:</strong> kontakt@arsmechanica.de</p>
                                <p><strong className="text-gray-900 font-medium">Telefon:</strong> +49 30 1234 5678</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Hauptsitz</h4>
                            <p className="text-base text-gray-500 leading-relaxed">
                                Musterstraße 42<br />
                                10115 Berlin<br />
                                Deutschland
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    )
}
