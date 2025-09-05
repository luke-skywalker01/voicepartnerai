import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Check, Shield, Star, Briefcase, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Preise - VoicePartnerAI',
  description: 'Transparente Preise für VoicePartnerAI. Wählen Sie den Plan, der zu Ihrem Unternehmen passt.',
}

const pricingPlans = [
  {
    name: "Starter",
    icon: <Shield className="w-8 h-8 text-accent mb-4" />,
    price: "49",
    period: "Monat", 
    color: "bg-card",
    features: [
      "200 Freiminuten inklusive",
      "Deutschland-Server (DSGVO)",
      "Alle Premium-Features",
      "E-Mail Support",
      "Zusätzlich: €0,30/Minute"
    ],
    cta: "Jetzt starten",
    popular: false,
    badge: "Planbare Kosten"
  },
  {
    name: "Business",
    icon: <Star className="w-8 h-8 text-accent mb-4" />,
    price: "149",
    period: "Monat",
    color: "bg-card",
    features: [
      "800 Freiminuten inklusive",
      "Priority Support",
      "Custom Voice Training",
      "Analytics Dashboard",
      "Zusätzlich: €0,25/Minute"
    ],
    cta: "Jetzt starten",
    popular: true,
    badge: "Beliebteste Wahl"
  },
  {
    name: "Enterprise",
    icon: <Briefcase className="w-8 h-8 text-accent mb-4" />,
    price: "399",
    period: "Monat",
    color: "bg-card",
    features: [
      "2.500 Freiminuten inklusive",
      "Dedicated Account Manager",
      "White-Label Option",
      "API-Zugang",
      "Zusätzlich: €0,20/Minute"
    ],
    cta: "Kontakt aufnehmen",
    popular: false,
    badge: "Höchste Margen"
  }
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Transparente Preise
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Wählen Sie den Plan, der zu Ihrem Unternehmen passt. Alle Pläne beinhalten kostenlose Einrichtung und Migration.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`flex flex-col items-center rounded-2xl px-8 py-12 relative ${plan.color} border ${plan.popular ? 'border-accent scale-105' : 'border-border'} transition-all hover:shadow-lg`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className={`px-4 py-1 text-xs font-medium rounded-full ${plan.popular ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                {plan.icon}
                <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-end justify-center mb-2">
                  <span className="text-3xl font-bold text-foreground">€{plan.price}</span>
                  <span className="text-muted-foreground text-base ml-1">/{plan.period}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-6">zzgl. MwSt.</div>
                <ul className="space-y-3 mb-8 w-full">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-base text-muted-foreground">
                      <Check className="w-4 h-4 text-accent mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link 
                  href={plan.cta === "Kontakt aufnehmen" ? "/contact" : "/register"}
                  className={`w-full font-semibold rounded-lg px-6 py-3 text-center block transition-colors ${plan.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="bg-card border border-border rounded-2xl p-8 mt-12">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <Zap className="w-12 h-12 text-accent" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground">
                Haben Sie Fragen zu den Preisen?
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Unser Team berät Sie gerne bei der Auswahl des richtigen Plans. 
                Alle Pläne können jederzeit angepasst oder erweitert werden.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-3 rounded-lg font-medium text-base flex items-center justify-center transition-colors"
                >
                  Kostenlose Beratung buchen
                </Link>
                <Link
                  href="/register"
                  className="border border-border hover:bg-muted px-8 py-3 rounded-lg font-medium text-base flex items-center justify-center transition-colors"
                >
                  Jetzt testen
                </Link>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">DSGVO-konform</h4>
              <p className="text-sm text-muted-foreground">
                Alle Daten werden auf deutschen Servern verarbeitet
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Sofort einsatzbereit</h4>
              <p className="text-sm text-muted-foreground">
                In wenigen Minuten konfiguriert und produktiv
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Premium Support</h4>
              <p className="text-sm text-muted-foreground">
                Deutschsprachiger Support von echten Experten
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}