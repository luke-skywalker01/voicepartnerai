'use client'

import Link from 'next/link'

export default function Header() {
  return (
    <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            VoicePartnerAI
          </h1>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            Preise
          </Link>
          <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            Dokumentation
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            Kontakt
          </Link>
        </nav>

        {/* CTA Button */}
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Anmelden
          </Link>
          <Link 
            href="/dashboard"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  )
}