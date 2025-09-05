'use client'

import Link from 'next/link'
import { Mic, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-accent-foreground">
                <Mic className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold text-foreground">
                VoicePartnerAI
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-md">
              Die führende Voice AI Plattform für deutsche Unternehmen. 
              Automatisieren Sie Ihren Kundenservice mit intelligenten Sprachbots.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>info@voicepartnerai.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+49 (0) 30 12345678</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Berlin, Deutschland</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Produkt</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Preise
                </Link>
              </li>
              <li>
                <Link href="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Integrationen
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dokumentation
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Hilfe Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Kontakt
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  System Status
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2024 VoicePartnerAI. Alle Rechte vorbehalten.
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/impressum" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Impressum
            </Link>
            <Link href="/datenschutz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Datenschutz
            </Link>
            <Link href="/agb" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              AGB
            </Link>
            <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cookie-Richtlinie
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}