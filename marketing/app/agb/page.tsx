import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function AGBPage() {
    return (
        <main className="min-h-screen bg-white">
            <Header />
            <section className="pt-28 pb-20">
                <div className="max-w-3xl mx-auto px-6">
                    <p className="text-sm font-display font-semibold text-orange-600 mb-2 uppercase tracking-wide">Rechtliches</p>
                    <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 mb-10 tracking-tight">AGB</h1>

                    <div className="prose prose-lg prose-stone max-w-none text-gray-600 leading-relaxed space-y-10">
                        <p className="text-gray-400 text-sm font-medium tracking-wide">Stand: Februar 2026</p>

                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">§ 1 Geltungsbereich</h2>
                            <p>
                                Diese AGB gelten für alle Verträge zwischen der Ars Mechanica GmbH und dem Kunden über die Nutzung unserer Plattform.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">§ 2 Vertragsgegenstand</h2>
                            <p>
                                Wir stellen dem Kunden eine Software-as-a-Service zur Verfügung. Der Funktionsumfang richtet sich nach dem gewählten Paket.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">§ 3 Laufzeit & Kündigung</h2>
                            <p>
                                Der Vertrag kann jederzeit zum Ende des Abrechnungszeitraums gekündigt werden. Es gibt keine Mindestvertragslaufzeit über den gewählten Zeitraum hinaus.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </main>
    )
}
