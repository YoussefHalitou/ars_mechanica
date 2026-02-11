import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { Industries } from '@/components/Industries'
import { Testimonials } from '@/components/Testimonials'
import { Pricing } from '@/components/Pricing'
import { ROICalculator } from '@/components/ROICalculator'
import { FAQ } from '@/components/FAQ'
import { CTA } from '@/components/CTA'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <Industries />
      <Testimonials />
      <ROICalculator />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  )
}
