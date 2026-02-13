'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : ''}`}>
      <nav className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">AM</span>
          </div>
          <span className="font-display font-bold text-gray-900 text-[16px]">Ars Mechanica</span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          <a href="#features" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">Funktionen</a>
          <a href="#industries" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">Branchen</a>
          <a href="#pricing" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">Preise</a>
          <Link href="/demo" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">Demo</Link>
          <Link href="/login" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">Anmelden</Link>
          <Link href="/register" className="text-[13px] font-medium text-white bg-orange-500 px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
            Kostenlos testen
          </Link>
        </div>

        <button className="md:hidden p-1.5 text-gray-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-white border-t border-gray-100"
          >
            <div className="px-6 py-4 space-y-3">
              <a href="#features" className="block text-sm text-gray-600 py-1" onClick={() => setIsMenuOpen(false)}>Funktionen</a>
              <a href="#industries" className="block text-sm text-gray-600 py-1" onClick={() => setIsMenuOpen(false)}>Branchen</a>
              <a href="#pricing" className="block text-sm text-gray-600 py-1" onClick={() => setIsMenuOpen(false)}>Preise</a>
              <Link href="/demo" className="block text-sm text-gray-600 py-1" onClick={() => setIsMenuOpen(false)}>Demo</Link>
              <Link href="/login" className="block text-sm text-gray-600 py-1" onClick={() => setIsMenuOpen(false)}>Anmelden</Link>
              <Link href="/register" className="block text-center text-sm font-medium text-white bg-orange-500 px-4 py-2.5 rounded-lg mt-2" onClick={() => setIsMenuOpen(false)}>
                Kostenlos testen
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
