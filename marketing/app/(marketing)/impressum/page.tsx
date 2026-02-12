import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function ImpressumPage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />
            <section className="pt-28 pb-20">
                <div className="max-w-3xl mx-auto px-6">
                    <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Rechtliches</p>
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 mb-10 tracking-tight">Impressum</h1>

                    <div className="prose prose-lg prose-stone max-w-none text-gray-600 leading-relaxed space-y-10">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Angaben gemäß § 5 TMG</h2>
                            <p>
                                Ars Mechanica GmbH<br />
                                Musterstraße 42<br />
                                10115 Berlin
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Vertreten durch</h2>
                            <p>Geschäftsführer: Max Mechanica</p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Kontakt</h2>
                            <p>
                                Telefon: +49 30 1234 5678<br />
                                E-Mail: kontakt@arsmechanica.de
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Registereintrag</h2>
                            <p>
                                Registergericht: Amtsgericht Berlin-Charlottenburg<br />
                                Registernummer: HRB 123456
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">Umsatzsteuer-ID</h2>
                            <p>DE123456789</p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    )
}
