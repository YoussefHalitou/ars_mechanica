import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata = {
  title: 'Ars Mechanica — Handwerker-Software für Projektmanagement & Zeiterfassung',
  description: 'Die All-in-One Plattform für Handwerksbetriebe. Projektmanagement, Zeiterfassung, Morgenplanung und KI-Analysen. 7 Tage kostenlos testen.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased text-gray-900 bg-white">
        {children}
      </body>
    </html>
  )
}
