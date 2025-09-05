'use client'

import Link from 'next/link'
import { BrainCircuit, Mic, GitBranch, BarChart3, Calendar, Phone, Briefcase, ArrowRight, Check } from 'lucide-react'
import AbstractIllustration from '../components/AbstractIllustration'

export default function HomePage() {
  const features = [
    {
      icon: <Mic className="w-8 h-8 text-accent" />,
      title: "Natürliche Gesprächsführung",
      description: "Unsere KI versteht Kontext, Emotionen und Absichten. Sie führt Gespräche so natürlich wie ein menschlicher Mitarbeiter.",
      color: "bg-accent/5 border-accent/20"
    },
    {
      icon: <GitBranch className="w-8 h-8 text-accent" />,
      title: "Nahtlose Integration", 
      description: "Verbinden Sie VoicePartnerAI mit Ihren bestehenden Systemen - CRM, Kalender, Telefonie und mehr.",
      color: "bg-primary/5 border-primary/20"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-accent" />,
      title: "Intelligente Analytics",
      description: "Detaillierte Einblicke in jede Interaktion. Optimieren Sie Ihre Prozesse basierend auf echten Daten.",
      color: "bg-secondary/20 border-secondary/40"
    },
    {
      icon: <Calendar className="w-8 h-8 text-accent" />,
      title: "Terminverwaltung im Gesundheitswesen",
      description: "Automatisierte Terminvergabe, Erinnerungen und Rezeptbestellungen. Reduzieren Sie No-Shows um bis zu 75%.",
      color: "bg-accent/10 border-accent/30",
      cta: "Fallstudie ansehen →"
    },
    {
      icon: <Phone className="w-8 h-8 text-accent" />,
      title: "E-Commerce Support",
      description: "24/7 Kundenbetreuung für Bestellungen, Retouren und Produktfragen. Steigern Sie die Kundenzufriedenheit messbar.",
      color: "bg-primary/10 border-primary/30",
      cta: "Mehr erfahren →"
    },
    {
      icon: <Briefcase className="w-8 h-8 text-accent" />,
      title: "Qualifizierung von Leads",
      description: "Intelligente Vorqualifizierung von Interessenten. Ihre Vertriebsteams fokussieren sich auf die besten Opportunities.",
      color: "bg-secondary/30 border-secondary/50",
      cta: "Details ansehen →"
    }
  ]

  const plans = [
    {
      name: "Starter",
      price: "29",
      period: "Monat", 
      color: "bg-[#F5F3EE]",
      features: [
        "100 Minuten inklusive",
        "Danach: €0,15/Minute",
        "E-Mail Support"
      ],
      cta: "Plan wählen",
      popular: false
    },
    {
      name: "Professional",
      price: "99",
      period: "Monat",
      color: "bg-[#E3ECE7]",
      features: [
        "500 Minuten inklusive",
        "Danach: €0,12/Minute",
        "Priority Support",
        "Analytics Dashboard"
      ],
      cta: "Plan wählen",
      popular: true
    },
    {
      name: "Enterprise",
      price: "299",
      period: "Monat",
      color: "bg-[#E6E6F7]",
      features: [
        "2000 Minuten inklusive",
        "Danach: €0,10/Minute",
        "24/7 Support",
        "Custom Models"
      ],
      cta: "Kontakt aufnehmen",
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Blog
            </Link>
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
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

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background abstract illustration */}
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/4 opacity-40">
            <AbstractIllustration />
          </div>

          <div className="container mx-auto px-6 py-20">
            <div className="max-w-4xl mx-auto text-center space-y-12">
              {/* Main Headline */}
              <h1 className="anthropic-heading">
                Natürliche Sprachpartner für Ihre{" "}
                <span className="text-accent">Anwendungen</span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Digitale Gesprächstechnologie, die zuhört und versteht.
                Unsere Voice AI ermöglicht kontextbewusste und emotionale Dialoge.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/login"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-4 rounded-lg transition-colors text-lg font-semibold flex items-center"
                >
                  Workspace starten
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link 
                  href="/contact"
                  className="border border-border text-foreground px-8 py-4 rounded-lg hover:bg-muted transition-colors text-lg font-semibold"
                >
                  Beratung anfragen
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-10 bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className={`p-8 ${feature.color} hover:shadow-lg transition-all anthropic-fade rounded-lg border`}
                  >
                    <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                        {feature.icon}
                        <h3 className="text-xl font-medium text-foreground">
                          {feature.title}
                        </h3>
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                      
                      {feature.cta && (
                        <button className="text-accent hover:text-accent/80 font-normal text-left">
                          {feature.cta}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className="pt-32 pb-20 bg-secondary/20">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              {/* Video Preview */}
              <div className="w-full lg:w-2/3 flex-shrink-0 relative flex items-center justify-center min-h-[420px] lg:min-h-[520px] rounded-3xl overflow-hidden shadow-lg bg-black">
                <img 
                  src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=900&q=80" 
                  alt="Societal Impacts of AI" 
                  className="w-full h-full object-cover object-center opacity-80" 
                />
                <button className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="bg-white/90 rounded-full p-5 shadow-xl hover:scale-110 transition-transform">
                    <svg className="w-10 h-10 text-foreground" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </span>
                </button>
              </div>

              {/* Zitat und Name */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center items-start mt-10 lg:mt-0">
                <blockquote className="text-3xl lg:text-4xl font-serif text-foreground leading-relaxed mb-8 pl-2 border-l-4 border-accent/60 italic">
                  „In einer Welt, in der Maschinen sprechen lernen, liegt unsere größte Verantwortung darin, ihnen beizubringen, zuzuhören."
                </blockquote>
                <div className="mb-2">
                  <span className="text-lg font-bold text-foreground">Dr. Maria Schmidt</span>
                  <div className="text-sm text-muted-foreground mt-1">Forschungsleiterin, Gesellschaftliche Auswirkungen</div>
                </div>
                <ul className="space-y-3 mt-6 pl-1">
                  <li className="flex items-start space-x-3">
                    <span className="mt-2 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-base text-muted-foreground">Ethische Entwicklung von Sprach-KI steht im Mittelpunkt unserer Forschung</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="mt-2 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-base text-muted-foreground">Transparenz und Verständlichkeit unserer KI-Systeme für alle Nutzer</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="mt-2 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-base text-muted-foreground">Gesellschaftlicher Nutzen als Grundlage jeder technischen Entscheidung</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-20 bg-gradient-to-br from-secondary/5 via-background to-accent/5">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-normal text-foreground mb-6 tracking-tight">
                  Voice AI in Aktion erleben
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Hören Sie sich echte Gespräche für verschiedene Anwendungsfälle an und erleben Sie die Zukunft der Kommunikation.
                </p>
              </div>

              {/* Demo Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    title: "Arztpraxis Terminbuchung",
                    description: "Natürliche Terminvereinbarung mit automatischer Kalendersynchronisation",
                    duration: "2:45 Min",
                    category: "Gesundheitswesen",
                    color: "bg-green-50 border-green-200",
                    audioSrc: "/demos/arztpraxis-demo.mp3"
                  },
                  {
                    title: "E-Commerce Kundensupport",
                    description: "24/7 Kundenbetreuung für Bestellungen und Retouren",
                    duration: "1:32 Min", 
                    category: "E-Commerce",
                    color: "bg-blue-50 border-blue-200",
                    audioSrc: "/demos/ecommerce-demo.mp3"
                  },
                  {
                    title: "Lead Qualifizierung",
                    description: "Intelligente Vorqualifizierung von Interessenten",
                    duration: "3:12 Min",
                    category: "Vertrieb",
                    color: "bg-purple-50 border-purple-200", 
                    audioSrc: "/demos/lead-demo.mp3"
                  },
                  {
                    title: "Restaurant Reservierung",
                    description: "Tischreservierungen mit Sonderwünschen und Bestätigungen",
                    duration: "2:18 Min",
                    category: "Gastronomie",
                    color: "bg-orange-50 border-orange-200",
                    audioSrc: "/demos/restaurant-demo.mp3"
                  },
                  {
                    title: "Immobilien Beratung",
                    description: "Erstberatung und Terminvereinbarung für Immobilienbesichtigungen",
                    duration: "4:05 Min",
                    category: "Immobilien",
                    color: "bg-yellow-50 border-yellow-200",
                    audioSrc: "/demos/immobilien-demo.mp3"
                  },
                  {
                    title: "IT-Support Helpdesk",
                    description: "Technischer Support mit Problemdiagnose und Lösungsvorschlägen",
                    duration: "3:42 Min",
                    category: "IT-Services",
                    color: "bg-indigo-50 border-indigo-200",
                    audioSrc: "/demos/it-support-demo.mp3"
                  }
                ].map((demo, index) => (
                  <div key={index} className={`${demo.color} border rounded-2xl p-8 hover:shadow-lg transition-all duration-300 anthropic-fade`}>
                    <div className="mb-6">
                      <span className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold mb-4">
                        {demo.category}
                      </span>
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        {demo.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                        {demo.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-6">
                        <span>Dauer: {demo.duration}</span>
                        <span>🎧 Deutsch</span>
                      </div>
                    </div>
                    
                    {/* Audio Player */}
                    <div className="bg-white/50 rounded-lg p-4 border border-white/60">
                      <audio 
                        controls 
                        className="w-full h-8"
                        preload="none"
                      >
                        <source src={demo.audioSrc} type="audio/mpeg" />
                        Ihr Browser unterstützt das Audio-Element nicht.
                      </audio>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>🎯 Conversion Rate: 85%+</span>
                        <span>⚡ Antwortzeit: &lt; 0.5s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center mt-16">
                <div className="bg-card border border-border rounded-2xl p-8 max-w-2xl mx-auto">
                  <h3 className="text-2xl font-semibold text-foreground mb-4">
                    Bereit für Ihre eigene Voice AI?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Lassen Sie uns gemeinsam Ihren individuellen Use Case entwickeln und testen Sie unsere Voice AI kostenfrei.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      href="/login"
                      className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-3 rounded-lg transition-colors font-semibold"
                    >
                      Kostenlos testen
                    </Link>
                    <a
                      href="https://calendly.com/lbirgf/30-minuten_meeting"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-border text-foreground px-8 py-3 rounded-lg hover:bg-muted transition-colors font-semibold"
                    >
                      Demo-Termin buchen
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-normal text-foreground mb-6 tracking-tight">
                  Transparente Preise
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Wählen Sie den Plan, der zu Ihrem Unternehmen passt. Alle Pläne beinhalten kostenlose Einrichtung und Migration.
                </p>
              </div>

              {/* Pricing Grid */}
              <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 mb-12 max-w-5xl mx-auto">
                {plans.map((plan, index) => (
                  <div
                    key={index}
                    className={`flex flex-col items-center rounded-2xl px-8 py-12 ${plan.color} ${plan.popular ? 'border-2 border-accent' : ''}`}
                  >
                    <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                    <div className="flex items-end justify-center mb-2">
                      <span className="text-3xl font-normal text-foreground">€{plan.price}</span>
                      <span className="text-muted-foreground text-base ml-1">/{plan.period}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-6">zzgl. MwSt.</div>
                    <ul className="space-y-3 mb-8 w-full">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-base text-muted-foreground">
                          <Check className="w-4 h-4 text-accent mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link 
                      href="/login"
                      className={`w-full font-semibold rounded-lg px-6 py-3 text-center ${plan.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'} transition-colors`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                ))}
              </div>

              {/* FAQ Section */}
              <div className="rounded-2xl bg-[#F5F3EE] p-8 mt-8 max-w-3xl mx-auto">
                <div className="text-center space-y-6">
                  <h3 className="text-2xl font-medium text-foreground">
                    Haben Sie Fragen zu den Preisen?
                  </h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Unser Team berät Sie gerne bei der Auswahl des richtigen Plans. 
                    Alle Pläne können jederzeit angepasst oder erweitert werden.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="https://calendly.com/lbirgf/30-minuten_meeting"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-medium text-base flex items-center justify-center transition-colors"
                      style={{ minWidth: '220px' }}
                    >
                      Kostenlose Beratung buchen
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
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