'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, CheckCircle, Loader2 } from 'lucide-react'

const industries = [
  { id: 'moving', name: 'Umzugsunternehmen', icon: '🚚' },
  { id: 'plumbing', name: 'Sanitär & Heizung', icon: '🔧' },
  { id: 'electrical', name: 'Elektrobetrieb', icon: '⚡' },
  { id: 'painting', name: 'Malerbetrieb', icon: '🎨' },
  { id: 'scaffolding', name: 'Gerüstbau', icon: '🏗️' },
  { id: 'medical-transport', name: 'Krankentransport', icon: '🚑' },
  { id: 'cleaning', name: 'Reinigungsunternehmen', icon: '✨' },
  { id: 'gas-water', name: 'Gas & Wasser', icon: '🔥' },
  { id: 'general', name: 'Weiteres Gewerk', icon: '🏢' },
]

const tiers = [
  { id: 'starter', name: 'Starter', price: '49€/Monat' },
  { id: 'professional', name: 'Professional', price: '99€/Monat' },
  { id: 'enterprise', name: 'Enterprise', price: '199€/Monat' },
]

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTier = searchParams.get('tier') || 'starter'

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    industry: 'general',
    tier: defaultTier,
  })

  // Update default tier if search param changes and we haven't manually changed it
  if (formData.tier !== defaultTier && step === 1 && !formData.tier) {
    setFormData(prev => ({ ...prev, tier: defaultTier }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleIndustrySelect = (industryId: string) => {
    setFormData({ ...formData, industry: industryId })
  }

  const handleTierSelect = (tierId: string) => {
    setFormData({ ...formData, tier: tierId })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (formData.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          company_name: formData.companyName,
          industry: formData.industry,
          tier: formData.tier,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Registrierung fehlgeschlagen')
      }

      // Store tokens
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      // Set cookie for middleware auth check
      document.cookie = 'has_session=1; path=/; max-age=604800'

      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${s <= step
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-600'
                }`}
            >
              {s < step ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-1 mx-2 ${s < step ? 'bg-orange-600' : 'bg-gray-200'
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {step === 1 && 'Wählen Sie Ihre Branche'}
          {step === 2 && 'Wählen Sie Ihren Tarif'}
          {step === 3 && 'Erstellen Sie Ihr Konto'}
        </h1>
        <p className="text-gray-600 text-center mb-8">
          {step === 1 && 'Ars Mechanica passt sich Ihrem Betrieb an'}
          {step === 2 && '7 Tage kostenlos testen'}
          {step === 3 && 'Nur noch wenige Angaben'}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Industry Selection */}
          {step === 1 && (
            <div className="space-y-3">
              {industries.map((industry) => (
                <button
                  key={industry.id}
                  type="button"
                  onClick={() => handleIndustrySelect(industry.id)}
                  className={`w-full p-4 rounded-lg border-2 flex items-center transition-colors ${formData.industry === industry.id
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <span className="text-2xl mr-4">{industry.icon}</span>
                  <span className="font-medium text-gray-900">{industry.name}</span>
                  {formData.industry === industry.id && (
                    <CheckCircle className="w-5 h-5 text-orange-600 ml-auto" />
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full btn-primary mt-6"
              >
                Weiter
              </button>
            </div>
          )}

          {/* Step 2: Tier Selection */}
          {step === 2 && (
            <div className="space-y-3">
              {tiers.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => handleTierSelect(tier.id)}
                  className={`w-full p-4 rounded-lg border-2 flex items-center justify-between transition-colors ${formData.tier === tier.id
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div>
                    <span className="font-medium text-gray-900">{tier.name}</span>
                    <span className="text-gray-500 ml-2">{tier.price}</span>
                  </div>
                  {formData.tier === tier.id && (
                    <CheckCircle className="w-5 h-5 text-orange-600" />
                  )}
                </button>
              ))}
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 btn-outline"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 btn-primary"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Account Details */}
          {step === 3 && (
            <div className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Firmenname
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Muster GmbH"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail-Adresse
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="ihre@email.de"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Passwort
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Mindestens 8 Zeichen"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Passwort bestätigen
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Passwort wiederholen"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 btn-outline"
                  disabled={isLoading}
                >
                  Zurück
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-primary"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Konto erstellen'
                  )}
                </button>
              </div>

              <p className="text-center text-sm text-gray-600 mt-4">
                Mit der Registrierung akzeptieren Sie unsere{' '}
                <Link href="/agb" className="text-orange-600 hover:underline">
                  AGB
                </Link>{' '}
                und{' '}
                <Link href="/datenschutz" className="text-orange-600 hover:underline">
                  Datenschutzerklärung
                </Link>
                .
              </p>
            </div>
          )}
        </form>
      </div>

      {/* Login Link */}
      <p className="text-center mt-6 text-gray-600">
        Bereits ein Konto?{' '}
        <Link href="/login" className="text-orange-600 hover:underline font-medium">
          Jetzt anmelden
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">AM</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Ars Mechanica</span>
          </Link>
          <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zur Startseite
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
          <RegisterForm />
        </Suspense>
      </main>
    </div>
  )
}
