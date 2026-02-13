'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="py-12 bg-stone-900 text-stone-400">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">AM</span>
              </div>
              <span className="font-semibold text-white text-sm">Ars Mechanica</span>
            </Link>
            <p className="text-[13px] text-stone-500 leading-relaxed">
              Die Betriebsplattform für Handwerker.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-stone-300 mb-3 uppercase tracking-wider">Produkt</h4>
            <ul className="space-y-2 text-[13px]">
              <li><a href="#features" className="hover:text-stone-200 transition-colors">Funktionen</a></li>
              <li><a href="#pricing" className="hover:text-stone-200 transition-colors">Preise</a></li>
              <li><a href="#industries" className="hover:text-stone-200 transition-colors">Branchen</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium text-stone-300 mb-3 uppercase tracking-wider">Branchen</h4>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/fuer-umzugsunternehmen" className="hover:text-stone-200 transition-colors">Umzugsunternehmen</Link></li>
              <li><Link href="/fuer-sanitaer-heizung" className="hover:text-stone-200 transition-colors">Sanitär & Heizung</Link></li>
              <li><Link href="/fuer-elektrobetriebe" className="hover:text-stone-200 transition-colors">Elektrobetriebe</Link></li>
              <li><Link href="/fuer-maler" className="hover:text-stone-200 transition-colors">Malerbetriebe</Link></li>
              <li><Link href="/fuer-geruestbauer" className="hover:text-stone-200 transition-colors">Gerüstbau</Link></li>
              <li><Link href="/fuer-krankentransport" className="hover:text-stone-200 transition-colors">Krankentransport</Link></li>
              <li><Link href="/fuer-reinigungsunternehmen" className="hover:text-stone-200 transition-colors">Reinigung</Link></li>
              <li><Link href="/fuer-gas-wasser" className="hover:text-stone-200 transition-colors">Gas & Wasser</Link></li>
              <li><Link href="/fuer-handwerksbetriebe" className="hover:text-stone-200 transition-colors">Weitere Gewerke</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium text-stone-300 mb-3 uppercase tracking-wider">Unternehmen</h4>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/about" className="hover:text-stone-200 transition-colors">Über uns</Link></li>
              <li><Link href="/blog" className="hover:text-stone-200 transition-colors">Blog</Link></li>
              <li><Link href="/kontakt" className="hover:text-stone-200 transition-colors">Kontakt</Link></li>
              <li><Link href="/karriere" className="hover:text-stone-200 transition-colors">Karriere</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium text-stone-300 mb-3 uppercase tracking-wider">Rechtliches</h4>
            <ul className="space-y-2 text-[13px]">
              <li><Link href="/datenschutz" className="hover:text-stone-200 transition-colors">Datenschutz</Link></li>
              <li><Link href="/impressum" className="hover:text-stone-200 transition-colors">Impressum</Link></li>
              <li><Link href="/agb" className="hover:text-stone-200 transition-colors">AGB</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-6 text-xs text-stone-600">
          &copy; {new Date().getFullYear()} Ars Mechanica GmbH. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  )
}
