import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Deutsche Voice AI{" "}
            <span className="text-primary">Plattform</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Erstellen Sie intelligente Sprachbots für Ihr Unternehmen.
            Automatisieren Sie Kundenservice, Terminbuchungen und mehr.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link 
              href="/dashboard"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md text-lg font-semibold transition-colors"
            >
              Jetzt starten
            </Link>
            <Link 
              href="/demo"
              className="border border-border hover:bg-muted px-8 py-3 rounded-md text-lg font-semibold transition-colors"
            >
              Live Demo ansehen
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}