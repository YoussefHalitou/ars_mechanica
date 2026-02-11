import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function DatenschutzPage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />
            <section className="pt-28 pb-20">
                <div className="max-w-3xl mx-auto px-6">
                    <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Rechtliches</p>
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 mb-10 tracking-tight">Datenschutzerklärung</h1>

                    <div className="prose prose-lg prose-stone max-w-none text-gray-600 leading-relaxed space-y-8">
                        <p className="text-gray-400 text-sm font-medium tracking-wide">Stand: Februar 2026</p>

                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">1. Verantwortlicher</h2>
                            <p>
                                Ars Mechanica GmbH<br />
                                Musterstraße 42<br />
                                10115 Berlin<br />
                                E-Mail: datenschutz@arsmechanica.de
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">2. Datenerhebung</h2>
                            <p>
                                Beim Besuch unserer Website erheben wir Daten, die Ihr Browser automatisch übermittelt. Dazu gehören IP-Adresse, Datum/Uhrzeit der Anfrage und Browsertyp. Diese Daten dienen der technischen Optimierung und Sicherheit.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">3. Hosting</h2>
                            <p>
                                Unsere Systeme werden ausschließlich in ISO 27001 zertifizierten Rechenzentren in Deutschland gehostet. Ihre Daten verlassen den Geltungsbereich der DSGVO zu keinem Zeitpunkt.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">4. Ihre Rechte</h2>
                            <p>
                                Sie haben jederzeit das Recht auf Auskunft, Berichtigung oder Löschung Ihrer Daten. Kontaktieren Sie uns einfach unter datenschutz@arsmechanica.de.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    )
}
