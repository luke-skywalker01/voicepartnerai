import type { Metadata } from 'next'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Kontakt - VoicePartnerAI',
  description: 'Kontaktieren Sie unser Team für eine persönliche Beratung zu VoicePartnerAI. Wir helfen Ihnen gerne weiter.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Kontaktieren Sie uns
            </h1>
            <p className="text-xl text-muted-foreground">
              Wir sind hier, um Ihnen zu helfen. Lassen Sie uns über Ihr Voice AI Projekt sprechen.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Sprechen Sie mit unserem Team
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-1">E-Mail</h3>
                    <p className="text-muted-foreground">
                      <a href="mailto:hello@voicepartnerai.com" className="hover:text-accent transition-colors">
                        hello@voicepartnerai.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-1">Telefon</h3>
                    <p className="text-muted-foreground">
                      <a href="tel:+4930123456789" className="hover:text-accent transition-colors">
                        +49 30 123 456 789
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-1">Adresse</h3>
                    <p className="text-muted-foreground">
                      VoicePartnerAI GmbH<br />
                      Musterstraße 123<br />
                      10115 Berlin, Deutschland
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-1">Öffnungszeiten</h3>
                    <p className="text-muted-foreground">
                      Montag - Freitag: 9:00 - 18:00<br />
                      Support: 24/7 verfügbar
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Senden Sie uns eine Nachricht
              </h2>
              
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Vorname *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                      placeholder="Max"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nachname *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                      placeholder="Mustermann"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="max@unternehmen.de"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Unternehmen
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="Ihr Unternehmen"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nachricht *
                  </label>
                  <textarea
                    rows={5}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-accent transition-colors resize-none"
                    placeholder="Wie können wir Ihnen helfen?"
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Nachricht senden
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}