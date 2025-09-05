'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { 
  ArrowLeft, 
  Cookie, 
  Shield, 
  BarChart3, 
  Target, 
  Settings,
  Check,
  AlertCircle,
  Info
} from 'lucide-react'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

export default function CookieEinstellungenPage() {
  const { preferences, updatePreferences, revokeConsent, hasConsent } = useCookieConsent()
  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(preferences)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalPreferences(preferences)
  }, [preferences])

  useEffect(() => {
    const hasChanges = JSON.stringify(localPreferences) !== JSON.stringify(preferences)
    setHasChanges(hasChanges)
  }, [localPreferences, preferences])

  const updateLocalPreference = (category: keyof CookiePreferences, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [category]: category === 'necessary' ? true : value
    }))
  }

  const saveChanges = () => {
    updatePreferences(localPreferences)
  }

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    }
    setLocalPreferences(allAccepted)
    updatePreferences(allAccepted)
  }

  const rejectAll = () => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    }
    setLocalPreferences(onlyNecessary)
    updatePreferences(onlyNecessary)
  }

  const cookieCategories = [
    {
      key: 'necessary' as keyof CookiePreferences,
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: 'Notwendige Cookies',
      description: 'Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.',
      required: true,
      details: [
        'Session-Management und Authentifizierung',
        'CSRF-Schutz und Sicherheitsfeatures',
        'Grundlegende Webseitenfunktionalität',
        'Speicherung von Cookie-Präferenzen'
      ],
      cookies: [
        { name: 'session-*', purpose: 'Benutzer-Session verwalten', duration: 'Session' },
        { name: 'auth-token', purpose: 'Authentifizierung', duration: '7 Tage' },
        { name: 'cookie-consent', purpose: 'Cookie-Einstellungen speichern', duration: '1 Jahr' }
      ]
    },
    {
      key: 'preferences' as keyof CookiePreferences,
      icon: <Settings className="w-6 h-6 text-blue-600" />,
      title: 'Präferenz Cookies',
      description: 'Diese Cookies ermöglichen es der Website, sich an Ihre Einstellungen und Präferenzen zu erinnern.',
      required: false,
      details: [
        'Spracheinstellungen speichern',
        'Theme und Layout-Präferenzen',
        'Dashboard-Konfigurationen',
        'Personalisierte Benutzeroberfläche'
      ],
      cookies: [
        { name: 'user-preferences', purpose: 'UI-Einstellungen speichern', duration: '1 Jahr' },
        { name: 'theme-setting', purpose: 'Theme-Präferenz', duration: '1 Jahr' },
        { name: 'language-pref', purpose: 'Spracheinstellung', duration: '1 Jahr' }
      ]
    },
    {
      key: 'analytics' as keyof CookiePreferences,
      icon: <BarChart3 className="w-6 h-6 text-orange-600" />,
      title: 'Analyse Cookies',
      description: 'Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, um die Benutzererfahrung zu verbessern.',
      required: false,
      details: [
        'Besucherstatistiken und Website-Nutzung',
        'Performance-Monitoring und Optimierung',
        'A/B-Tests und Feature-Analyse',
        'Fehlerberichte und Debugging (anonymisiert)'
      ],
      cookies: [
        { name: '_ga', purpose: 'Google Analytics Hauptcookie', duration: '2 Jahre' },
        { name: '_gid', purpose: 'Google Analytics Session-ID', duration: '24 Stunden' },
        { name: '_ga_*', purpose: 'Google Analytics Property-spezifisch', duration: '2 Jahre' }
      ]
    },
    {
      key: 'marketing' as keyof CookiePreferences,
      icon: <Target className="w-6 h-6 text-purple-600" />,
      title: 'Marketing Cookies',
      description: 'Diese Cookies werden verwendet, um relevante Werbung anzuzeigen und die Effektivität von Marketingkampagnen zu messen.',
      required: false,
      details: [
        'Personalisierte Werbung und Anzeigen',
        'Retargeting und Remarketing',
        'Conversion-Tracking',
        'Social Media Integration und Sharing'
      ],
      cookies: [
        { name: '_fbp', purpose: 'Facebook Pixel Browser-ID', duration: '3 Monate' },
        { name: '_fbc', purpose: 'Facebook Click-ID', duration: '1 Jahr' },
        { name: 'ads-*', purpose: 'Werbe-Tracking', duration: '30 Tage' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-background via-background to-secondary/10 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/" className="inline-flex items-center text-accent hover:text-accent/80 mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zur Startseite
            </Link>
            
            <div className="flex items-center space-x-3 mb-6">
              <Cookie className="w-8 h-8 text-accent" />
              <h1 className="text-4xl md:text-5xl font-normal text-foreground tracking-tight leading-tight">
                Cookie-Einstellungen
              </h1>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Verwalten Sie Ihre Cookie-Präferenzen und bestimmen Sie, welche Daten wir sammeln dürfen
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Current Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-accent" />
                <span>Aktueller Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium">
                    {hasConsent ? 'Sie haben Cookie-Präferenzen festgelegt' : 'Keine Cookie-Präferenzen gesetzt'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {hasConsent 
                      ? 'Ihre Einstellungen werden für ein Jahr gespeichert und können jederzeit geändert werden.'
                      : 'Sie können Ihre Präferenzen unten festlegen.'
                    }
                  </p>
                </div>
                {hasConsent && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Check className="w-3 h-3 mr-1" />
                    Aktiv
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Schnellaktionen</CardTitle>
              <CardDescription>
                Verwenden Sie diese Optionen für häufige Cookie-Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={acceptAll} className="flex-1">
                  <Check className="w-4 h-4 mr-2" />
                  Alle Cookies akzeptieren
                </Button>
                <Button onClick={rejectAll} variant="outline" className="flex-1">
                  Nur notwendige Cookies
                </Button>
                {hasConsent && (
                  <Button 
                    onClick={revokeConsent} 
                    variant="destructive" 
                    className="flex-1"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Alle Cookies löschen
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Settings */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Detaillierte Einstellungen</h2>
            
            {cookieCategories.map((category) => (
              <Card key={category.key} className="border border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {category.icon}
                      <div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          {category.required && (
                            <Badge variant="secondary" className="text-xs">
                              Erforderlich
                            </Badge>
                          )}
                          <Badge 
                            variant={localPreferences[category.key] ? "default" : "outline"} 
                            className="text-xs"
                          >
                            {localPreferences[category.key] ? 'Aktiviert' : 'Deaktiviert'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={localPreferences[category.key]}
                      onCheckedChange={(checked) => updateLocalPreference(category.key, checked)}
                      disabled={category.required}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-base">
                    {category.description}
                  </CardDescription>
                  
                  {/* Details */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Was wird gespeichert:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {category.details.map((detail, index) => (
                        <li key={index} className="text-muted-foreground text-sm">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cookie Details */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Verwendete Cookies:</h4>
                    <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                      {category.cookies.map((cookie, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div className="flex-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {cookie.name}
                            </code>
                            <p className="text-sm text-muted-foreground mt-1">
                              {cookie.purpose}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs ml-3">
                            {cookie.duration}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Save Changes */}
          {hasChanges && (
            <Card className="mt-8 border-accent/50 bg-accent/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Sie haben Änderungen vorgenommen</p>
                    <p className="text-muted-foreground text-sm">
                      Speichern Sie Ihre neuen Einstellungen, um sie zu übernehmen.
                    </p>
                  </div>
                  <Button onClick={saveChanges}>
                    <Check className="w-4 h-4 mr-2" />
                    Änderungen speichern
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legal Information */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Rechtliche Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Diese Cookie-Einstellungen werden lokal in Ihrem Browser gespeichert und gelten nur für diese Website. 
                Sie können Ihre Einstellungen jederzeit ändern oder alle Cookies über die Browsereinstellungen löschen.
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <Link href="/datenschutz" className="text-accent hover:text-accent/80 underline">
                  Datenschutzerklärung
                </Link>
                <Link href="/impressum" className="text-accent hover:text-accent/80 underline">
                  Impressum
                </Link>
                <Link href="/agb" className="text-accent hover:text-accent/80 underline">
                  AGB
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}