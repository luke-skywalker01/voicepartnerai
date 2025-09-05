import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Mail } from 'lucide-react'

export default function ImpressumPage() {
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
            
            <h1 className="text-4xl md:text-5xl font-normal text-foreground mb-6 tracking-tight leading-tight">
              Impressum
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Rechtliche Informationen und Kontaktdaten gemäß § 5 TMG
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            {/* Company Information */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Angaben gemäß § 5 TMG
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <MapPin className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Firmenanschrift</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        VoicePartnerAI GmbH<br />
                        Musterstraße 123<br />
                        1010 Wien<br />
                        Österreich
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Phone className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Telefon</h3>
                      <p className="text-muted-foreground">+43 (0) 1 234 56 78</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Mail className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">E-Mail</h3>
                      <p className="text-muted-foreground">info@voicepartnerai.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Legal Representatives */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Vertretungsberechtigte Geschäftsführer
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <p className="text-muted-foreground leading-relaxed">
                  Dr. Alexander Müller<br />
                  Sarah Schmidt
                </p>
              </div>
            </section>

            {/* Registration */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Registereintrag
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-foreground">Registergericht:</span>
                    <span className="text-muted-foreground ml-2">Handelsgericht Wien</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Registernummer:</span>
                    <span className="text-muted-foreground ml-2">FN 123456a</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Tax Information */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Umsatzsteuer-Identifikationsnummer
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <p className="text-muted-foreground">
                  Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                  <span className="font-medium">ATU12345678</span>
                </p>
              </div>
            </section>

            {/* Responsible for Content */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <p className="text-muted-foreground leading-relaxed">
                  Dr. Alexander Müller<br />
                  VoicePartnerAI GmbH<br />
                  Musterstraße 123<br />
                  1010 Wien<br />
                  Österreich
                </p>
              </div>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Haftungsausschluss
              </h2>
              
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">Haftung für Inhalte</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf 
                    diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG 
                    sind wir als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte 
                    oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu 
                    forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">Haftung für Links</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte 
                    wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch 
                    keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der 
                    jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">Urheberrecht</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten 
                    unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, 
                    Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes 
                    bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                  </p>
                </div>
              </div>
            </section>

            {/* Online Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                Online-Streitbeilegung
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <p className="text-muted-foreground leading-relaxed">
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:<br />
                  <Link href="https://ec.europa.eu/consumers/odr/" className="text-accent hover:text-accent/80">
                    https://ec.europa.eu/consumers/odr/
                  </Link>
                  <br /><br />
                  Unsere E-Mail-Adresse finden Sie oben im Impressum. Wir sind nicht bereit oder 
                  verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle 
                  teilzunehmen.
                </p>
              </div>
            </section>

            {/* Back to Top */}
            <div className="text-center pt-8">
              <Link 
                href="#top"
                className="inline-flex items-center text-accent hover:text-accent/80 font-medium transition-colors"
              >
                Nach oben
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}