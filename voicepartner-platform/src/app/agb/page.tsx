import Link from 'next/link'
import { ArrowLeft, FileText, AlertCircle, CheckCircle } from 'lucide-react'

export default function AGBPage() {
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
              Allgemeine Geschäftsbedingungen
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Nutzungsbedingungen für VoicePartnerAI Services
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            {/* Introduction */}
            <section>
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-8">
                <div className="flex items-start space-x-4">
                  <FileText className="w-8 h-8 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      Geltungsbereich
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen 
                      der VoicePartnerAI GmbH und ihren Kunden über die Nutzung der VoicePartnerAI 
                      Plattform und damit verbundener Services. Mit der Registrierung oder Nutzung 
                      unserer Services erkennen Sie diese AGB als verbindlich an.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Company Info */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                1. Vertragspartner
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Vertragspartner ist:
                </p>
                <div className="bg-muted/20 rounded p-4">
                  <p className="text-foreground font-medium">
                    VoicePartnerAI GmbH<br />
                    Musterstraße 123<br />
                    10115 Berlin<br />
                    Deutschland<br />
                    <br />
                    Registergericht: Amtsgericht Berlin-Charlottenburg<br />
                    Registernummer: HRB 123456 B<br />
                    USt-IdNr.: DE123456789
                  </p>
                </div>
              </div>
            </section>

            {/* Services */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                2. Leistungen
              </h2>
              
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">2.1 VoicePartnerAI Plattform</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    VoicePartnerAI stellt eine cloudbasierte Plattform zur Verfügung, die es Kunden ermöglicht, 
                    KI-gestützte Sprachassistenten zu erstellen, zu konfigurieren und zu betreiben. Die Plattform 
                    umfasst:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Spracherkennung und -verarbeitung</li>
                    <li>Natürliche Sprachverständnis-Engine</li>
                    <li>Dialog-Management-System</li>
                    <li>Text-zu-Sprache-Synthese</li>
                    <li>Analytics und Reporting-Tools</li>
                    <li>API-Zugang und Integrationen</li>
                  </ul>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">2.2 Verfügbarkeit</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Wir streben eine Verfügbarkeit von 99,9% an. Geplante Wartungsarbeiten werden mindestens 
                    48 Stunden im Voraus angekündigt. Die Verfügbarkeit wird auf monatlicher Basis gemessen, 
                    ausgenommen sind Force Majeure-Ereignisse und geplante Wartungsarbeiten.
                  </p>
                </div>
              </div>
            </section>

            {/* Registration & Usage */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                3. Registrierung und Nutzung
              </h2>
              
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">3.1 Registrierung</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Zur Nutzung der VoicePartnerAI Plattform ist eine Registrierung erforderlich. Bei der 
                    Registrierung sind vollständige und korrekte Angaben zu machen. Der Kunde ist verpflichtet, 
                    seine Daten aktuell zu halten.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">3.2 Nutzungsrechte</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Der Kunde erhält ein nicht-exklusives, nicht-übertragbares Nutzungsrecht an der Plattform 
                    für die Dauer des Vertragsverhältnisses. Die Nutzung ist auf die vertraglich vereinbarten 
                    Zwecke beschränkt.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">3.3 Verbotene Nutzung</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Folgende Nutzungen sind untersagt:
                  </p>
                  <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                    <li>Rechtswidrige, beleidigende oder diskriminierende Inhalte</li>
                    <li>Verletzung von Urheberrechten oder anderen Schutzrechten</li>
                    <li>Reverse Engineering oder Dekompilierung</li>
                    <li>Überlastung der Systeme durch missbräuchliche Nutzung</li>
                    <li>Umgehung von Sicherheitsmaßnahmen</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Pricing & Payment */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                4. Preise und Zahlung
              </h2>
              
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">4.1 Preise</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Es gelten die zum Zeitpunkt der Bestellung auf der Website angegebenen Preise. 
                    Alle Preise verstehen sich zzgl. der gesetzlichen Mehrwertsteuer. Preisänderungen 
                    werden mit einer Frist von 30 Tagen angekündigt.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">4.2 Zahlung</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Die Zahlung erfolgt monatlich im Voraus per Lastschrift oder Kreditkarte. 
                    Bei Zahlungsverzug können wir nach Mahnung den Zugang zur Plattform sperren.
                  </p>
                  <div className="bg-accent/5 rounded p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground text-sm">
                        Bei Zahlungsverzug von mehr als 14 Tagen behalten wir uns vor, 
                        den Vertrag außerordentlich zu kündigen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Data & Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                5. Datenschutz und Datensicherheit
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">DSGVO-Compliance</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Die Verarbeitung personenbezogener Daten erfolgt in Übereinstimmung mit der DSGVO. 
                      Sprachdaten werden ausschließlich zur Serviceerbringung verarbeitet und nicht 
                      permanent gespeichert.
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>End-to-End-Verschlüsselung aller Datenübertragungen</li>
                      <li>Automatische Löschung temporärer Sprachdaten nach 24 Stunden</li>
                      <li>ISO 27001 zertifizierte Rechenzentren in Deutschland</li>
                      <li>Regelmäßige Sicherheitsaudits und Penetrationstests</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                6. Haftung
              </h2>
              
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">6.1 Haftungsausschluss</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    VoicePartnerAI haftet nur für Schäden, die auf einer vorsätzlichen oder grob 
                    fahrlässigen Pflichtverletzung beruhen. Die Haftung für leichte Fahrlässigkeit 
                    ist ausgeschlossen, soweit nicht wesentliche Vertragspflichten verletzt werden.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">6.2 Haftungsbegrenzung</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Die Haftung ist der Höhe nach begrenzt auf die Vergütung, die der Kunde in den 
                    letzten 12 Monaten vor dem schädigenden Ereignis gezahlt hat, höchstens jedoch 
                    auf 10.000 Euro pro Schadensfall.
                  </p>
                </div>
              </div>
            </section>

            {/* Contract Duration */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                7. Vertragslaufzeit und Kündigung
              </h2>
              
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">7.1 Laufzeit</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Der Vertrag läuft auf unbestimmte Zeit. Bei jährlicher Zahlung gewähren wir einen 
                    Rabatt von 15% auf die Monatspreise.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">7.2 Kündigung</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Beide Parteien können den Vertrag mit einer Frist von 30 Tagen zum Monatsende 
                    kündigen. Die Kündigung bedarf der Textform (E-Mail ausreichend).
                  </p>
                  <div className="bg-muted/20 rounded p-4">
                    <p className="text-foreground text-sm">
                      <strong>Kündigungsadresse:</strong> kuendigung@voicepartnerai.com
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Final Provisions */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                8. Schlussbestimmungen
              </h2>
              
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">8.1 Änderungen der AGB</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Änderungen dieser AGB werden dem Kunden mindestens 30 Tage vor Inkrafttreten 
                    per E-Mail mitgeteilt. Widerspricht der Kunde nicht innerhalb von 30 Tagen, 
                    gelten die Änderungen als genehmigt.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">8.2 Anwendbares Recht</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand für 
                    alle Streitigkeiten ist Berlin, sofern der Kunde Kaufmann ist.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <h3 className="font-semibold text-foreground mb-4">8.3 Salvatorische Klausel</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit 
                    der übrigen Bestimmungen unberührt. Unwirksame Bestimmungen werden durch 
                    rechtswirksame ersetzt, die dem gewollten Zweck am nächsten kommen.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                9. Kontakt
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Bei Fragen zu diesen AGB wenden Sie sich bitte an:
                </p>
                <div className="bg-muted/20 rounded p-4">
                  <p className="text-foreground">
                    <strong>Kundenservice</strong><br />
                    VoicePartnerAI GmbH<br />
                    E-Mail: support@voicepartnerai.com<br />
                    Telefon: +49 30 12345678<br />
                    Mo-Fr: 9:00-18:00 Uhr
                  </p>
                </div>
              </div>
            </section>

            {/* Last Updated */}
            <section>
              <div className="bg-muted/10 rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  Diese AGB sind gültig ab dem <strong>1. Dezember 2024</strong>. 
                  Version 2.1
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