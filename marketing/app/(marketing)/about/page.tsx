import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />
            <section className="pt-28 pb-20">
                <div className="max-w-3xl mx-auto px-6">
                    <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Über uns</p>
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 mb-8 tracking-tight">
                        Wir machen Handwerksbetriebe digital.
                    </h1>
                    <div className="prose prose-lg prose-stone max-w-none text-gray-600 leading-relaxed space-y-6">
                        <p className="text-lg">
                            Ars Mechanica wurde 2024 gegründet — von einem Team, das selbst erlebt hat, wie viel Zeit im Handwerk durch Zettelwirtschaft und Excel-Chaos verloren geht.
                        </p>
                        <p>
                            Unsere Mission: Eine Plattform schaffen, die so einfach ist wie eine App, aber so leistungsstark wie ein ERP-System. Entwickelt in Deutschland, gehostet in Deutschland, gemacht für den deutschen Mittelstand.
                        </p>

                        <h2 className="text-2xl font-display font-bold text-gray-900 pt-6">Unsere Werte</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
                            {[
                                { title: 'Einfachheit', desc: 'Keine Schulung nötig. Wenn ein Geselle es nicht sofort versteht, machen wir es einfacher.' },
                                { title: 'Bodenständigkeit', desc: 'Wir bauen, was Handwerker wirklich brauchen — keine Features für die Feature-Liste.' },
                                { title: 'Datenschutz', desc: 'Deutsche Server, deutsche Datenschutzstandards. DSGVO ist bei uns nicht optional.' },
                                { title: 'Partnerschaft', desc: 'Wir arbeiten eng mit unseren Kunden zusammen und entwickeln die Plattform nach deren Feedback weiter.' },
                            ].map(v => (
                                <div key={v.title} className="bg-stone-50 rounded-[2rem] p-8 border border-stone-100">
                                    <h3 className="font-display font-bold text-gray-900 text-base mb-2">{v.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                                </div>
                            ))}
                        </div>

                        <h2 className="text-2xl font-display font-bold text-gray-900 pt-6">Das Team</h2>
                        <p>
                            Unser Team vereint Erfahrung aus Softwareentwicklung, Betriebswirtschaft und — ganz wichtig — aus dem Handwerk selbst. Wir sitzen in Berlin und sind immer nur eine Nachricht entfernt.
                        </p>
                    </div>

                    <div className="mt-16 pt-10 border-t border-stone-100">
                        <p className="text-base text-gray-500 mb-4 font-medium">Fragen? Schreiben Sie uns.</p>
                        <Link href="/kontakt" className="inline-flex items-center text-lg font-bold text-orange-600 hover:text-orange-700 transition-colors">
                            Zum Kontaktformular <span className="ml-1">→</span>
                        </Link>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    )
}
