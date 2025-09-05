import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, User, Share2 } from 'lucide-react'

export default function VoiceAIGesundheitswesenPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-background via-background to-secondary/10 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Link href="/insights" className="inline-flex items-center text-accent hover:text-accent/80 mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zu Insights
            </Link>
            
            <div className="mb-6">
              <span className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium mb-4">
                Use Cases
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-normal text-foreground mb-6 tracking-tight leading-tight">
              Voice AI im Gesundheitswesen
            </h1>
            
            <div className="flex items-center space-x-6 text-muted-foreground text-sm mb-8">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Prof. Michael Schmidt</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>10. Dezember 2024</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>6 min Lesezeit</span>
              </div>
              <button className="flex items-center space-x-2 hover:text-accent transition-colors">
                <Share2 className="w-4 h-4" />
                <span>Teilen</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-12">
            <Image
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1200&q=80"
              alt="Voice AI im Gesundheitswesen"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <div className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Das Gesundheitswesen steht vor revolutionären Veränderungen durch Voice AI-Technologien. 
              Von der Patientenbetreuung bis zur Verwaltung – intelligente Sprachassistenten transformieren 
              medizinische Prozesse und verbessern die Effizienz nachhaltig.
            </div>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
              Praktische Anwendungen in der Medizin
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Voice AI-Systeme finden bereits heute in verschiedenen Bereichen des Gesundheitswesens 
              erfolgreiche Anwendung. Die Technologie ermöglicht es medizinischem Personal, 
              sich auf das Wesentliche zu konzentrieren: die Patientenversorgung.
            </p>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">
              1. Terminverwaltung und Patientenkommunikation
            </h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Automatisierte Terminbuchung und -erinnerungen reduzieren No-Shows um bis zu 75%. 
              Patienten können Termine natürlich per Sprache vereinbaren, während das System 
              gleichzeitig Verfügbarkeiten prüft und Kalender synchronisiert.
            </p>

            <div className="bg-accent/5 border-l-4 border-accent p-6 my-8 rounded-r-lg">
              <p className="text-foreground italic">
                "Voice AI hat unsere Terminverwaltung revolutioniert. Wir konnten die 
                Wartezeiten für Termine um 40% reduzieren und gleichzeitig die 
                Patientenzufriedenheit erheblich steigern."
              </p>
              <div className="mt-4 text-sm text-muted-foreground">
                Dr. med. Sarah Hoffmann, Praxisleiterin
              </div>
            </div>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">
              2. Medizinische Dokumentation
            </h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Sprachgesteuerte Dokumentationssysteme ermöglichen es Ärzten, Befunde und 
              Behandlungsnotizen direkt während der Patientenkonsultation zu erstellen. 
              Dies spart Zeit und verbessert die Datenqualität erheblich.
            </p>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">
              3. Symptomabfrage und Triaging
            </h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Intelligente Sprachbots können erste Symptomabfragen durchführen und 
              Patienten entsprechend ihrer Dringlichkeit einordnen. Dies entlastet 
              Notaufnahmen und sorgt für effizientere Patientenverteilung.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
              Erfolgsgeschichten aus der Praxis
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-3">Klinikum München</h4>
                <p className="text-muted-foreground text-sm mb-2">
                  40% Reduktion der Verwaltungszeit durch Voice AI-Dokumentation
                </p>
                <p className="text-muted-foreground text-sm">
                  "Unsere Ärzte können sich wieder vollständig auf die Patienten konzentrieren."
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h4 className="font-semibold text-foreground mb-3">Hausarztpraxis Hamburg</h4>
                <p className="text-muted-foreground text-sm mb-2">
                  75% weniger No-Shows durch automatisierte Erinnerungen
                </p>
                <p className="text-muted-foreground text-sm">
                  "Die Patienten schätzen die einfache und natürliche Kommunikation."
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
              Technische Voraussetzungen
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Die Implementierung von Voice AI im Gesundheitswesen erfordert besondere 
              Aufmerksamkeit für Datenschutz und Sicherheit:
            </p>

            <ul className="list-disc pl-6 text-muted-foreground mb-6 space-y-2">
              <li>DSGVO-konforme Datenverarbeitung und -speicherung</li>
              <li>End-to-End-Verschlüsselung aller Sprachdaten</li>
              <li>Integration in bestehende Praxisverwaltungssysteme</li>
              <li>Mehrsprachige Unterstützung für internationale Patienten</li>
              <li>Offline-Funktionalität für kritische Anwendungen</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">
              Zukunftsperspektiven
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Die Entwicklung geht in Richtung noch intelligenterer Systeme, die 
              medizinische Entscheidungen unterstützen können:
            </p>

            <ul className="list-disc pl-6 text-muted-foreground mb-8 space-y-2">
              <li><strong>Diagnostische Unterstützung:</strong> KI-gestützte Symptomanalyse</li>
              <li><strong>Medikationsmanagement:</strong> Automatische Überwachung von Wechselwirkungen</li>
              <li><strong>Patientenmonitoring:</strong> Kontinuierliche Gesundheitsüberwachung zu Hause</li>
              <li><strong>Therapeutische Assistenz:</strong> Sprachgesteuerte Rehabilitationsprogramme</li>
            </ul>

            <div className="bg-gradient-to-r from-accent/10 to-primary/5 rounded-lg p-8 mt-12">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Fazit
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Voice AI im Gesundheitswesen ist mehr als nur ein technologischer Fortschritt – 
                es ist ein Werkzeug zur Humanisierung der Medizin. Durch die Automatisierung 
                administrativer Aufgaben können sich medizinische Fachkräfte wieder vollständig 
                auf ihre Kernkompetenz konzentrieren: die bestmögliche Patientenversorgung.
              </p>
            </div>
          </div>

          {/* Author Bio */}
          <div className="mt-16 bg-card border border-border rounded-lg p-8">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-2">Prof. Michael Schmidt</h4>
                <p className="text-muted-foreground mb-3">
                  Prof. Schmidt leitet die Abteilung für Digitale Medizin an der Charité Berlin 
                  und forscht seit über 15 Jahren im Bereich Medical AI. Er berät Kliniken 
                  und Praxen bei der Digitalisierung ihrer Prozesse.
                </p>
                <div className="flex space-x-4 text-sm">
                  <Link href="#" className="text-accent hover:text-accent/80">LinkedIn</Link>
                  <Link href="#" className="text-accent hover:text-accent/80">ResearchGate</Link>
                  <Link href="#" className="text-accent hover:text-accent/80">Charité</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          <div className="mt-16">
            <h3 className="text-2xl font-semibold text-foreground mb-8">Verwandte Artikel</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/blog/zukunft-sprachinteraktion" className="group">
                <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-32 relative">
                    <Image
                      src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80"
                      alt="Die Zukunft der Sprachinteraktion"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-foreground group-hover:text-accent transition-colors">
                      Die Zukunft der Sprachinteraktion
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Wie Voice AI die Art verändert, wie wir mit Technologie interagieren
                    </p>
                  </div>
                </div>
              </Link>
              
              <Link href="/blog/latenz-optimierung-voice-ai" className="group">
                <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-32 relative">
                    <Image
                      src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=600&q=80"
                      alt="Latenz-Optimierung"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-foreground group-hover:text-accent transition-colors">
                      Latenz-Optimierung in Voice AI
                    </h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Technische Insights zur Performance-Verbesserung
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}