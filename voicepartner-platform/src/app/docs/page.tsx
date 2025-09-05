import type { Metadata } from 'next'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Book, Code, Settings, Mic } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dokumentation - VoicePartnerAI',
  description: 'Komplette Dokumentation für VoicePartnerAI. API-Referenz, Integration Guides und Best Practices.',
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              VoicePartnerAI Dokumentation
            </h1>
            <p className="text-xl text-muted-foreground">
              Alles was Sie für die Integration und Nutzung von VoicePartnerAI benötigen
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="flex items-center mb-4">
                <Book className="h-6 w-6 text-accent mr-3" />
                <h2 className="text-xl font-semibold">Erste Schritte</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Lernen Sie die Grundlagen von VoicePartnerAI kennen und erstellen Sie Ihren ersten Voice AI Assistenten.
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Konto einrichten</li>
                <li>• Ersten Bot erstellen</li>
                <li>• Sprachmodell konfigurieren</li>
                <li>• Testing & Deployment</li>
              </ul>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="flex items-center mb-4">
                <Code className="h-6 w-6 text-accent mr-3" />
                <h2 className="text-xl font-semibold">API-Referenz</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Vollständige API-Dokumentation für Entwickler mit Code-Beispielen und Implementierungsdetails.
              </p>
              <ul className="space-y-2 text-sm">
                <li>• REST API Endpoints</li>
                <li>• WebSocket Verbindungen</li>
                <li>• Authentifizierung</li>
                <li>• Rate Limiting</li>
              </ul>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="flex items-center mb-4">
                <Settings className="h-6 w-6 text-accent mr-3" />
                <h2 className="text-xl font-semibold">Konfiguration</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Erweiterte Konfigurationsoptionen für professionelle Anwendungsfälle und Enterprise-Setups.
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Webhook Konfiguration</li>
                <li>• Custom Integrationen</li>
                <li>• Sicherheitseinstellungen</li>
                <li>• Monitoring & Logs</li>
              </ul>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="flex items-center mb-4">
                <Mic className="h-6 w-6 text-accent mr-3" />
                <h2 className="text-xl font-semibold">Best Practices</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Bewährte Methoden für optimale Voice AI Performance und Nutzererfahrung.
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Conversation Design</li>
                <li>• Error Handling</li>
                <li>• Performance Optimierung</li>
                <li>• DSGVO Compliance</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 p-6 bg-accent/5 border border-accent/20 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Brauchen Sie Hilfe?</h3>
            <p className="text-muted-foreground mb-4">
              Unser Support-Team hilft Ihnen gerne bei der Integration und bei allen Fragen rund um VoicePartnerAI.
            </p>
            <div className="flex gap-4">
              <a href="mailto:support@voicepartnerai.com" className="text-accent hover:text-accent/80">
                Email Support
              </a>
              <a href="/contact" className="text-accent hover:text-accent/80">
                Kontakt
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}