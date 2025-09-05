'use client'

import Link from 'next/link'
import { BrainCircuit } from 'lucide-react'

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <BrainCircuit className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              VoicePartnerAI
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Startseite
            </Link>
            <Link href="/blog" className="text-foreground font-medium text-sm">
              Blog
            </Link>
            <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Features
            </Link>
            <Link href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Preise
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Kontakt
            </Link>
          </nav>

          {/* CTA Button */}
          <Link 
            href="/login"
            className="bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-2 rounded-md text-sm transition-colors"
          >
            Workspace
          </Link>
        </div>
      </header>

      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-muted-foreground py-6 bg-background/80 border-t border-border/30">
        <Link href="/impressum" className="underline hover:text-foreground mx-2">Impressum</Link>
        <span className="mx-1">|</span>
        <Link href="/datenschutz" className="underline hover:text-foreground mx-2">Datenschutz</Link>
      </footer>
    </div>
  )
}
