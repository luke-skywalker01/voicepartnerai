'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Cookie, 
  Settings, 
  Shield, 
  BarChart3, 
  Target,
  Check,
  X
} from 'lucide-react'
import Link from 'next/link'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

const defaultPreferences: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
  preferences: false,
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    const lastInteraction = localStorage.getItem('cookie-last-interaction')
    
    if (!consent || !lastInteraction) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000)
      return () => clearTimeout(timer)
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(consent)
        setPreferences(savedPreferences)
        setHasInteracted(true)
      } catch (error) {
        console.error('Error parsing cookie preferences:', error)
        setShowBanner(true)
      }
    }
  }, [])

  const savePreferences = (newPreferences: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(newPreferences))
    localStorage.setItem('cookie-last-interaction', new Date().toISOString())
    setPreferences(newPreferences)
    setHasInteracted(true)
    setShowBanner(false)
    setShowSettings(false)

    // Apply cookie settings
    applyCookieSettings(newPreferences)
  }

  const applyCookieSettings = (prefs: CookiePreferences) => {
    // Remove analytics cookies if not consented
    if (!prefs.analytics) {
      // Clear Google Analytics cookies
      document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '_ga_*=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }

    // Remove marketing cookies if not consented
    if (!prefs.marketing) {
      // Clear marketing/tracking cookies
      document.cookie = '_fbp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = '_fbc=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }

    // Dispatch event for other components to listen to
    window.dispatchEvent(new CustomEvent('cookiePreferencesChanged', { 
      detail: prefs 
    }))
  }

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    }
    savePreferences(allAccepted)
  }

  const acceptNecessaryOnly = () => {
    savePreferences(defaultPreferences)
  }

  const updatePreference = (category: keyof CookiePreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [category]: category === 'necessary' ? true : value // Necessary always true
    }))
  }

  const cookieCategories = [
    {
      key: 'necessary' as keyof CookiePreferences,
      icon: <Shield className="w-5 h-5 text-green-600" />,
      title: 'Notwendige Cookies',
      description: 'Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.',
      required: true,
      examples: 'Session-Management, Sicherheit, CSRF-Schutz'
    },
    {
      key: 'preferences' as keyof CookiePreferences,
      icon: <Settings className="w-5 h-5 text-blue-600" />,
      title: 'Präferenz Cookies',
      description: 'Diese Cookies ermöglichen es der Website, sich an Ihre Einstellungen zu erinnern.',
      required: false,
      examples: 'Spracheinstellungen, Theme-Präferenzen, Layout-Optionen'
    },
    {
      key: 'analytics' as keyof CookiePreferences,
      icon: <BarChart3 className="w-5 h-5 text-orange-600" />,
      title: 'Analyse Cookies',
      description: 'Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren.',
      required: false,
      examples: 'Google Analytics, Besucherstatistiken, Performance-Metriken'
    },
    {
      key: 'marketing' as keyof CookiePreferences,
      icon: <Target className="w-5 h-5 text-purple-600" />,
      title: 'Marketing Cookies',
      description: 'Diese Cookies werden verwendet, um relevante Werbung anzuzeigen.',
      required: false,
      examples: 'Facebook Pixel, Werbe-Targeting, Retargeting'
    }
  ]

  if (!showBanner && hasInteracted) {
    return null
  }

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start space-x-3">
                  <Cookie className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Wir respektieren Ihre Privatsphäre
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. 
                      Einige Cookies sind für die Funktionalität erforderlich, während andere uns helfen, 
                      unsere Services zu verbessern. Sie können Ihre Präferenzen jederzeit anpassen.
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <Link href="/datenschutz" className="text-accent hover:text-accent/80 underline">
                        Datenschutzerklärung
                      </Link>
                      <Link href="/impressum" className="text-accent hover:text-accent/80 underline">
                        Impressum
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <Settings className="w-4 h-4 mr-2" />
                      Einstellungen
                    </Button>
                  </DialogTrigger>
                </Dialog>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={acceptNecessaryOnly}
                  className="w-full sm:w-auto"
                >
                  Nur Notwendige
                </Button>
                
                <Button 
                  onClick={acceptAll}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Alle akzeptieren
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Cookie className="w-5 h-5 text-accent" />
              <span>Cookie-Einstellungen</span>
            </DialogTitle>
            <DialogDescription>
              Verwalten Sie Ihre Cookie-Präferenzen. Sie können diese Einstellungen jederzeit ändern.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {cookieCategories.map((category) => (
              <Card key={category.key} className="border border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {category.icon}
                      <div>
                        <CardTitle className="text-base">{category.title}</CardTitle>
                        {category.required && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded mt-1 inline-block">
                            Erforderlich
                          </span>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={preferences[category.key]}
                      onCheckedChange={(checked) => updatePreference(category.key, checked)}
                      disabled={category.required}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="mb-3">
                    {category.description}
                  </CardDescription>
                  <div className="bg-muted/30 rounded p-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Beispiele:</strong> {category.examples}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={acceptNecessaryOnly}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Nur Notwendige
              </Button>
              <Button 
                onClick={() => savePreferences(preferences)}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Einstellungen speichern
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}