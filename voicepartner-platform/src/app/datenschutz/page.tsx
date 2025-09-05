import Link from 'next/link'
import { ArrowLeft, Shield, Database, Users, Lock } from 'lucide-react'

export default function DatenschutzPage() {
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
              Datenschutzerklärung
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Informationen zur Erhebung, Verarbeitung und Nutzung Ihrer personenbezogenen Daten
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
                  <Shield className="w-8 h-8 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      Datenschutz ist uns wichtig
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten 
                      Ihre Daten daher ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TKG 2003). 
                      In diesen Datenschutzinformationen informieren wir Sie über die wichtigsten Aspekte der 
                      Datenverarbeitung im Rahmen unserer Website und Services.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Controller */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                1. Verantwortlicher
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Verantwortlicher im Sinne der DSGVO ist:
                </p>
                <div className="bg-muted/20 rounded p-4">
                  <p className="text-foreground font-medium">
                    VoicePartnerAI GmbH<br />
                    Musterstraße 123<br />
                    1010 Wien<br />
                    Österreich<br />
                    <br />
                    E-Mail: datenschutz@voicepartnerai.com<br />
                    Telefon: +43 (0) 1 234 56 78
                  </p>
                </div>
              </div>
            </section>

            {/* Data Processing */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                2. Erhebung und Speicherung personenbezogener Daten
              </h2>
              
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-8">
                  <div className="flex items-start space-x-4">
                    <Database className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-4">Website-Besuch</h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Beim Aufrufen unserer Website werden durch den auf Ihrem Endgerät zum Einsatz 
                        kommenden Browser automatisch Informationen an den Server unserer Website gesendet:
                      </p>
                      <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                        <li>IP-Adresse des anfragenden Rechners</li>
                        <li>Datum und Uhrzeit des Zugriffs</li>
                        <li>Name und URL der abgerufenen Datei</li>
                        <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
                        <li>Verwendeter Browser und ggf. das Betriebssystem</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-8">
                  <div className="flex items-start space-x-4">
                    <Users className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-4">Registrierung und Nutzung</h3>
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        Bei der Registrierung für unseren Service erfassen wir folgende Daten:
                      </p>
                      <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                        <li>Name und Vorname</li>
                        <li>E-Mail-Adresse</li>
                        <li>Unternehmensinformationen (falls zutreffend)</li>
                        <li>Gewählter Tarif und Nutzungsdaten</li>
                        <li>Sprachdaten (nur zur Verarbeitung, nicht zur Speicherung)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Voice Data */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                3. Verarbeitung von Sprachdaten
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="flex items-start space-x-4">
                  <Lock className="w-6 h-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Besondere Schutzmaßnahmen</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Sprachdaten werden bei VoicePartnerAI mit höchsten Sicherheitsstandards behandelt:
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                      <li><strong>Keine permanente Speicherung:</strong> Sprachdaten werden nur temporär zur Verarbeitung gehalten</li>
                      <li><strong>End-to-End-Verschlüsselung:</strong> Alle Übertragungen sind verschlüsselt</li>
                      <li><strong>On-Premise-Option:</strong> Für besonders sensible Anwendungen</li>
                      <li><strong>Automatische Löschung:</strong> Temporäre Daten werden nach max. 24 Stunden gelöscht</li>
                      <li><strong>DSGVO-Compliance:</strong> Vollständige Konformität mit europäischen Datenschutzbestimmungen</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Legal Basis */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                4. Rechtsgrundlage der Verarbeitung
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</h4>
                    <p className="text-muted-foreground">
                      Soweit wir für Verarbeitungsvorgänge personenbezogener Daten eine Einwilligung einholen.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</h4>
                    <p className="text-muted-foreground">
                      Verarbeitung zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse)</h4>
                    <p className="text-muted-foreground">
                      Verarbeitung zur Wahrung berechtigter Interessen, soweit nicht die Interessen der betroffenen Person überwiegen.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                5. Weitergabe von Daten
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Eine Übermittlung Ihrer persönlichen Daten an Dritte zu anderen als den im Folgenden 
                  aufgeführten Zwecken findet nicht statt. Wir geben Ihre persönlichen Daten nur an 
                  Dritte weiter, wenn:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Sie ausdrücklich eingewilligt haben</li>
                  <li>Die Weitergabe zur Abwicklung eines Vertragsverhältnisses erforderlich ist</li>
                  <li>Eine gesetzliche Verpflichtung besteht</li>
                  <li>Auftragsverarbeiter eingesetzt werden (mit entsprechenden Verträgen nach Art. 28 DSGVO)</li>
                </ul>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                6. Ihre Rechte
              </h2>
              
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h4 className="font-semibold text-foreground mb-2">Auskunftsrecht (Art. 15 DSGVO)</h4>
                  <p className="text-muted-foreground text-sm">
                    Sie haben das Recht, Auskunft über die von uns gespeicherten personenbezogenen Daten zu erhalten.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h4 className="font-semibold text-foreground mb-2">Berichtigungsrecht (Art. 16 DSGVO)</h4>
                  <p className="text-muted-foreground text-sm">
                    Sie haben das Recht, unrichtige Daten berichtigen zu lassen.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h4 className="font-semibold text-foreground mb-2">Löschungsrecht (Art. 17 DSGVO)</h4>
                  <p className="text-muted-foreground text-sm">
                    Sie haben das Recht auf Löschung Ihrer gespeicherten Daten.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h4 className="font-semibold text-foreground mb-2">Widerspruchsrecht (Art. 21 DSGVO)</h4>
                  <p className="text-muted-foreground text-sm">
                    Sie haben das Recht, der Verarbeitung Ihrer Daten zu widersprechen.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-lg p-6">
                  <h4 className="font-semibold text-foreground mb-2">Datenübertragbarkeit (Art. 20 DSGVO)</h4>
                  <p className="text-muted-foreground text-sm">
                    Sie haben das Recht, Ihre Daten in einem strukturierten, gängigen Format zu erhalten.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                7. Cookies und Tracking
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Unsere Website verwendet Cookies, um die Nutzerfreundlichkeit zu verbessern. 
                  Ein Cookie ist eine kleine Textdatei, die von Ihrem Browser auf Ihrem Endgerät gespeichert wird.
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-foreground">Technisch notwendige Cookies</h4>
                    <p className="text-muted-foreground text-sm">
                      Diese Cookies sind für die Grundfunktionen der Website erforderlich.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Analyse-Cookies</h4>
                    <p className="text-muted-foreground text-sm">
                      Helfen uns, die Website-Nutzung zu analysieren (nur mit Ihrer Einwilligung).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                8. Kontakt
              </h2>
              
              <div className="bg-card border border-border rounded-lg p-8">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte wenden Sie sich bitte an:
                </p>
                <div className="bg-muted/20 rounded p-4">
                  <p className="text-foreground">
                    <strong>Datenschutzbeauftragter</strong><br />
                    VoicePartnerAI GmbH<br />
                    E-Mail: datenschutz@voicepartnerai.com<br />
                    Telefon: +43 (0) 1 234 56 78
                  </p>
                </div>
                <p className="text-muted-foreground text-sm mt-4">
                  Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über 
                  unsere Verarbeitung personenbezogener Daten zu beschweren.
                </p>
              </div>
            </section>

            {/* Last Updated */}
            <section>
              <div className="bg-muted/10 rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  Diese Datenschutzerklärung wurde zuletzt am <strong>1. Dezember 2024</strong> aktualisiert.
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