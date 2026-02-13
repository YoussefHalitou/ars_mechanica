import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ArrowRight } from 'lucide-react'

const openings = [
    { title: 'Senior Full-Stack Entwickler (m/w/d)', type: 'Vollzeit', location: 'Berlin / Remote', desc: 'Du baust mit uns die nächste Generation von Handwerker-Software. TypeScript, React, Next.js und Node.js.' },
    { title: 'Product Designer (m/w/d)', type: 'Vollzeit', location: 'Berlin', desc: 'Du gestaltest Interfaces, die Handwerker gerne benutzen — einfach, schnell, auf den Punkt.' },
    { title: 'Customer Success Manager (m/w/d)', type: 'Vollzeit', location: 'Berlin / Remote', desc: 'Du hilfst Handwerksbetrieben beim Onboarding und sorgst dafür, dass sie das Maximum aus Ars Mechanica herausholen.' },
]

export default function KarrierePage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />
            <section className="pt-28 pb-20">
                <div className="max-w-4xl mx-auto px-6">
                    <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Karriere</p>
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 mb-4 tracking-tight">
                        Arbeiten bei Ars Mechanica
                    </h1>
                    <p className="text-lg text-gray-500 mb-16 leading-relaxed max-w-2xl">
                        Wir bauen die Plattform, die den deutschen Mittelstand digitalisiert. Wir suchen Menschen, die anpacken wollen.
                    </p>

                    <h2 className="text-2xl font-display font-bold text-gray-900 mb-8">Offene Stellen</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {openings.map((job, i) => (
                            <div key={i} className="group bg-stone-50 border border-stone-100 rounded-[2rem] p-8 sm:p-10 hover:bg-white hover:shadow-2xl hover:shadow-orange-950/5 transition-all">
                                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-xl font-display font-bold text-gray-900 mb-2">{job.title}</h3>
                                        <div className="flex gap-2">
                                            <span className="text-[11px] font-bold text-stone-500 bg-stone-200/50 px-3 py-1 rounded-full uppercase tracking-wider">{job.type}</span>
                                            <span className="text-[11px] font-bold text-stone-500 bg-stone-200/50 px-3 py-1 rounded-full uppercase tracking-wider">{job.location}</span>
                                        </div>
                                    </div>
                                    <button className="hidden sm:inline-flex items-center text-sm font-bold text-orange-600 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                        Jetzt bewerben <ArrowRight className="ml-2 w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-base text-gray-500 leading-relaxed max-w-3xl">{job.desc}</p>
                                <button className="sm:hidden mt-6 inline-flex items-center text-sm font-bold text-orange-600 uppercase tracking-widest">
                                    Jetzt bewerben <ArrowRight className="ml-2 w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 pt-12 border-t border-stone-100 text-center sm:text-left">
                        <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Nichts Passendes dabei?</h3>
                        <p className="text-lg text-gray-500 mb-6">Wir freuen uns immer über talentierte Menschen. Schicken Sie uns eine Initiativbewerbung.</p>
                        <a href="mailto:jobs@arsmechanica.de" className="inline-flex items-center px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold text-base hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/10 active:scale-95">
                            Initiativ bewerben <span className="ml-2">→</span>
                        </a>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    )
}
