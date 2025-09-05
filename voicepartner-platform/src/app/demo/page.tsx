import type { Metadata } from 'next'
import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Play, Pause, Volume2, MessageSquare, Phone, User, Bot, Clock, Star, Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Live Demos - VoicePartnerAI',
  description: 'Erleben Sie VoicePartnerAI in Aktion. Sehen Sie verschiedene Voice Agents bei der Arbeit und verstehen Sie, wie sie Ihre Geschäftsprozesse revolutionieren können.',
}

const demoScenarios = [
  {
    id: '1',
    title: 'Terminbuchung Assistant',
    description: 'Automatische Terminvereinbarung für Arztpraxen und Dienstleister',
    category: 'Terminmanagement',
    duration: '2:30',
    thumbnail: '/api/placeholder/400/225',
    conversation: [
      {
        speaker: 'agent',
        text: 'Hallo! Willkommen bei Dr. Müllers Praxis. Ich bin Ihre Terminassistentin. Wie kann ich Ihnen heute helfen?',
        timestamp: '0:00'
      },
      {
        speaker: 'user', 
        text: 'Ich hätte gerne einen Termin für nächste Woche.',
        timestamp: '0:05'
      },
      {
        speaker: 'agent',
        text: 'Gerne! Für welchen Behandlungsgrund benötigen Sie den Termin? Routine-Untersuchung, Nachkontrolle oder haben Sie akute Beschwerden?',
        timestamp: '0:08'
      },
      {
        speaker: 'user',
        text: 'Es ist für eine Routine-Untersuchung.',
        timestamp: '0:15'
      },
      {
        speaker: 'agent',
        text: 'Perfekt. Ich habe folgende Termine verfügbar: Dienstag um 14:30, Mittwoch um 10:15 oder Donnerstag um 16:00. Was passt Ihnen am besten?',
        timestamp: '0:18'
      },
      {
        speaker: 'user',
        text: 'Mittwoch um 10:15 wäre ideal.',
        timestamp: '0:28'
      },
      {
        speaker: 'agent',
        text: 'Ausgezeichnet! Ich reserviere Ihnen den Termin am Mittwoch, 15. Januar um 10:15 Uhr. Können Sie mir noch Ihren Namen und Ihre Telefonnummer geben?',
        timestamp: '0:30'
      }
    ]
  },
  {
    id: '2', 
    title: 'Kundenservice Bot',
    description: 'Professionelle Kundenbetreuung mit sofortiger Problemlösung',
    category: 'Customer Support',
    duration: '3:15',
    thumbnail: '/api/placeholder/400/225',
    conversation: [
      {
        speaker: 'agent',
        text: 'Hallo und vielen Dank für Ihren Anruf bei TechSolutions! Mein Name ist Sarah, wie kann ich Ihnen heute behilflich sein?',
        timestamp: '0:00'
      },
      {
        speaker: 'user',
        text: 'Hallo, ich habe ein Problem mit meiner Software. Sie startet nicht mehr.',
        timestamp: '0:06'
      },
      {
        speaker: 'agent', 
        text: 'Das tut mir leid zu hören. Ich helfe Ihnen gerne dabei, das Problem zu lösen. Können Sie mir sagen, welche Fehlermeldung angezeigt wird, wenn Sie versuchen die Software zu starten?',
        timestamp: '0:10'
      },
      {
        speaker: 'user',
        text: 'Es kommt eine Meldung "Lizenz nicht gefunden" oder so ähnlich.',
        timestamp: '0:18'
      },
      {
        speaker: 'agent',
        text: 'Verstehe. Das ist ein bekanntes Problem, das wir schnell lösen können. Können Sie mir bitte Ihre Lizenznummer durchgeben? Sie finden sie in der E-Mail, die Sie nach dem Kauf erhalten haben.',
        timestamp: '0:22'
      }
    ]
  },
  {
    id: '3',
    title: 'Sales Qualifier',
    description: 'Intelligente Qualifizierung von Verkaufschancen und Lead-Generation',
    category: 'Vertrieb',
    duration: '4:45',
    thumbnail: '/api/placeholder/400/225',
    conversation: [
      {
        speaker: 'agent',
        text: 'Guten Tag! Ich bin Alex von VoicePartnerAI. Vielen Dank für Ihr Interesse an unseren Voice AI Lösungen. Darf ich fragen, wie Sie auf uns aufmerksam geworden sind?',
        timestamp: '0:00'
      },
      {
        speaker: 'user',
        text: 'Über LinkedIn. Wir suchen nach Möglichkeiten, unseren Kundenservice zu automatisieren.',
        timestamp: '0:08'
      },
      {
        speaker: 'agent',
        text: 'Das ist eine ausgezeichnete Entscheidung! Können Sie mir etwas über Ihr Unternehmen erzählen? Wie viele Kundenanfragen bearbeiten Sie etwa täglich?',
        timestamp: '0:12'
      },
      {
        speaker: 'user',
        text: 'Wir sind ein mittelständisches Unternehmen mit etwa 200 Mitarbeitern. Täglich haben wir circa 300-400 Kundenanrufe.',
        timestamp: '0:20'
      },
      {
        speaker: 'agent',
        text: 'Das ist ein beträchtliches Volumen. Mit unserer Lösung könnten Sie bis zu 70% dieser Anfragen automatisiert bearbeiten. Welche Art von Anfragen erhalten Sie hauptsächlich?',
        timestamp: '0:28'
      }
    ]
  }
]

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Erleben Sie VoicePartnerAI in Aktion
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Sehen Sie, wie unsere intelligenten Voice Agents echte Geschäftsprobleme lösen. 
              Jede Demo zeigt reale Konversationen und deren praktischen Nutzen.
            </p>
          </div>

          {/* Hero Demo Video */}
          <div className="bg-card border border-border rounded-2xl p-8 mb-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-accent/10 to-primary/10 rounded-lg overflow-hidden relative group cursor-pointer border border-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-accent-foreground ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3">
                      <p className="font-medium">Live Demo: Vollständiger Workflow</p>
                      <p className="text-sm text-muted-foreground">Von der Begrüßung bis zum Abschluss</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold">
                  Sehen Sie den kompletten Prozess
                </h2>
                <p className="text-lg text-muted-foreground">
                  Diese 5-minütige Demo zeigt Ihnen, wie ein Voice Agent einen kompletten Kundeninteraktion 
                  von A bis Z durchführt - natürlich, effizient und mit perfekten Ergebnissen.
                </p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    5:30 Min
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Echte Konversation
                  </div>
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    Live System
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Scenarios Grid */}
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {demoScenarios.map((demo) => (
              <div key={demo.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-accent/5 to-primary/5 relative group cursor-pointer">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-accent/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 text-accent-foreground ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium">
                    {demo.duration}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-accent bg-accent/10 rounded-full px-3 py-1">
                      {demo.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{demo.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{demo.description}</p>
                  
                  {/* Conversation Preview */}
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Gesprächsauszug:</p>
                    <div className="space-y-1">
                      <div className="flex items-start space-x-2 text-xs">
                        <Bot className="w-3 h-3 text-accent mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">{demo.conversation[0].text.substring(0, 60)}...</p>
                      </div>
                      <div className="flex items-start space-x-2 text-xs">
                        <User className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground">{demo.conversation[1].text}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Demo abspielen
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Conversation Examples */}
          <div className="bg-card border border-border rounded-2xl p-8 mb-16">
            <h2 className="text-2xl font-semibold mb-8 text-center">Detaillierte Gesprächsverläufe</h2>
            
            {demoScenarios.map((demo, index) => (
              <div key={demo.id} className={`${index !== 0 ? 'mt-12 pt-8 border-t border-border' : ''}`}>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">{demo.title}</h3>
                  <p className="text-muted-foreground">{demo.description}</p>
                </div>
                
                <div className="space-y-4">
                  {demo.conversation.map((message, msgIndex) => (
                    <div key={msgIndex} className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-2xl flex items-start space-x-3 ${message.speaker === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.speaker === 'agent' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                        }`}>
                          {message.speaker === 'agent' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className={`rounded-lg px-4 py-3 ${
                          message.speaker === 'agent' 
                            ? 'bg-accent/5 border border-accent/20' 
                            : 'bg-primary/5 border border-primary/20'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              {message.speaker === 'agent' ? 'Voice Agent' : 'Kunde'}
                            </span>
                            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                          </div>
                          <p className="text-sm">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-br from-accent/5 to-primary/5 rounded-2xl p-12">
            <h2 className="text-3xl font-semibold mb-4">
              Bereit für Ihren eigenen Voice Agent?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Starten Sie noch heute und erleben Sie, wie Voice AI Ihr Unternehmen transformiert. 
              Keine Programmierung erforderlich - in wenigen Minuten einsatzbereit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-accent hover:bg-accent/90">
                  <Zap className="w-5 h-5 mr-2" />
                  Kostenlos starten
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Persönliche Demo buchen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}