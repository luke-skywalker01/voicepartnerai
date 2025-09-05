'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Waves, Check, X } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'

const VoiceAILogo = () => (
  <div className="flex items-center space-x-2">
    <div className="relative">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Waves className="w-5 h-5 text-white" />
      </div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
    </div>
    <span className="text-xl font-semibold text-foreground tracking-tight">
      VoicePartnerAI
    </span>
  </div>
)

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    acceptTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { signUp, signIn } = useAuth()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vorname ist erforderlich'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nachname ist erforderlich' 
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültige E-Mail-Adresse'
    }

    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein'
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Bitte akzeptieren Sie die Nutzungsbedingungen'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // In demo mode, we'll simulate registration success
      await signUp(
        formData.email,
        formData.password,
        `${formData.firstName} ${formData.lastName}`
      )
      router.push('/dashboard')
    } catch (error) {
      setErrors({ general: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const handleGoogleSignUp = async () => {
    setErrors({})
    setGoogleLoading(true)

    try {
      await signIn('demo@google.com', 'password')
      router.push('/dashboard')
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Google-Registrierung fehlgeschlagen' })
    } finally {
      setGoogleLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <VoiceAILogo />
          </Link>
        </div>

        {/* Registration Form */}
        <div className="bg-card rounded-lg shadow-lg border border-border p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">Konto erstellen</h1>
            <p className="text-muted-foreground mt-2">
              Erstellen Sie Ihr VoicePartnerAI Konto und starten Sie noch heute
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {errors.general}
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-1">
                  Vorname
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Max"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.firstName ? 'border-destructive' : 'border-input bg-background'
                  }`}
                />
                {errors.firstName && (
                  <p className="text-xs text-destructive mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-1">
                  Nachname
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Mustermann"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                    errors.lastName ? 'border-destructive' : 'border-input bg-background'
                  }`}
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                placeholder="ihre@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={loading}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${
                  errors.email ? 'border-destructive' : 'border-input bg-background'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-foreground mb-1">
                Unternehmen (optional)
              </label>
              <input
                id="company"
                type="text"
                placeholder="Ihr Unternehmen"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Passwort
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mindestens 8 Zeichen"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent pr-10 ${
                    errors.password ? 'border-destructive' : 'border-input bg-background'
                  }`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level <= passwordStrength
                            ? passwordStrength <= 2
                              ? 'bg-destructive'
                              : passwordStrength <= 3
                              ? 'bg-yellow-500'
                              : 'bg-accent'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {passwordStrength <= 2 && 'Schwaches Passwort'}
                    {passwordStrength === 3 && 'Mittleres Passwort'}
                    {passwordStrength >= 4 && 'Starkes Passwort'}
                  </p>
                </div>
              )}
              
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">
                Passwort bestätigen
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Passwort wiederholen"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent pr-10 ${
                    errors.confirmPassword ? 'border-destructive' : 'border-input bg-background'
                  }`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Acceptance */}
            <div>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                  disabled={loading}
                  className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground">
                  Ich akzeptiere die{' '}
                  <Link href="/agb" className="text-primary hover:text-primary/80 underline">
                    Nutzungsbedingungen
                  </Link>{' '}
                  und{' '}
                  <Link href="/datenschutz" className="text-primary hover:text-primary/80 underline">
                    Datenschutzrichtlinien
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-destructive mt-1">{errors.acceptTerms}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || googleLoading}
            >
              {loading ? 'Konto wird erstellt...' : 'Konto erstellen'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">oder</span>
            </div>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center px-4 py-2 border border-border rounded-md shadow-sm bg-card hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Wird registriert...' : 'Mit Google registrieren'}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Bereits ein Konto?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
                Jetzt anmelden
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}