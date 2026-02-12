import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const posts = [
    { slug: '#', date: '8. Feb 2026', title: 'Wie digitale Zeiterfassung Ihren Betrieb verändert', excerpt: 'Papier-Stundenzettel kosten Sie mehr, als Sie denken. So gelingt der Umstieg auf digitale Zeiterfassung.', tag: 'Praxis' },
    { slug: '#', date: '1. Feb 2026', title: 'Morgenplanung: Der unterschätzte Produktivitätshebel', excerpt: 'Warum die ersten 15 Minuten des Tages den Unterschied zwischen Chaos und Effizienz machen.', tag: 'Tipps' },
    { slug: '#', date: '25. Jan 2026', title: 'DSGVO im Handwerk — was Sie wirklich beachten müssen', excerpt: 'Ein pragmatischer Leitfaden für Datenschutz im Handwerksbetrieb, ohne Juristendeutsch.', tag: 'Recht' },
    { slug: '#', date: '18. Jan 2026', title: 'Materialverwaltung: Schluss mit dem Lager-Roulette', excerpt: 'Wie Sie Materialverbrauch pro Projekt tracken und nie wieder mitten im Auftrag ohne Teile dastehen.', tag: 'Praxis' },
    { slug: '#', date: '10. Jan 2026', title: 'KI im Handwerk — Hype oder echte Hilfe?', excerpt: 'Was künstliche Intelligenz heute schon für kleine Betriebe leisten kann — und was nicht.', tag: 'Technologie' },
    { slug: '#', date: '3. Jan 2026', title: 'Von 2 auf 12 Mitarbeiter: So skaliert Ihr Betrieb', excerpt: 'Drei Handwerksunternehmer erzählen, wie sie mit digitalen Tools gewachsen sind.', tag: 'Erfolgsgeschichten' },
]

export default function BlogPage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />
            <section className="pt-28 pb-20">
                <div className="max-w-4xl mx-auto px-6">
                    <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Blog</p>
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 mb-4 tracking-tight">
                        Tipps & Insights
                    </h1>
                    <p className="text-lg text-gray-500 mb-16 leading-relaxed">Praktisches Wissen rund um Digitalisierung im Handwerk.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {posts.map((post, i) => (
                            <article key={i} className="group cursor-pointer">
                                <div className="bg-stone-50 rounded-[2rem] p-8 border border-stone-100 group-hover:bg-white group-hover:shadow-2xl group-hover:shadow-orange-950/5 transition-all">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">{post.date}</span>
                                        <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase tracking-wider">{post.tag}</span>
                                    </div>
                                    <h2 className="text-xl font-display font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-base text-gray-500 leading-relaxed">{post.excerpt}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    )
}
