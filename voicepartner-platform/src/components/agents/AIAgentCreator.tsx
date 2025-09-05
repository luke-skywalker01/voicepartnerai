'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { 
  Bot,
  Sparkles,
  MessageSquare,
  Brain,
  Mic,
  Volume2,
  Settings,
  CheckCircle,
  Clock,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Wand2,
  Target,
  Users,
  Phone,
  Mail,
  Calendar,
  ShoppingCart,
  HelpCircle,
  Briefcase,
  Heart,
  BookOpen,
  Zap,
  Star
} from 'lucide-react'
import { VapiAssistant, VapiPresets } from '../../lib/vapi-service'

interface AgentTemplate {
  id: string
  name: string
  description: string
  icon: React.ElementType
  category: string
  useCase: string
  questions: string[]
  capabilities: string[]
  examples: string[]
}

const agentTemplates: AgentTemplate[] = [
  {
    id: 'customer-support',
    name: 'Customer Support Agent',
    description: 'Hilft Kunden bei Fragen, Problemen und Beschwerden',
    icon: HelpCircle,
    category: 'Support',
    useCase: 'Kundensupport und Problemlösung',
    questions: [
      'Welche Art von Produkten oder Dienstleistungen unterstützt der Agent?',
      'Welche häufigen Kundenprobleme soll der Agent lösen können?',
      'Soll der Agent Tickets erstellen oder an Menschen weiterleiten können?',
      'Welche Informationen hat der Agent über Ihre Produkte/Services?'
    ],
    capabilities: ['FAQ beantworten', 'Tickets erstellen', 'Probleme diagnostizieren', 'Weiterleitung an Support'],
    examples: [
      'Kunde: "Mein Produkt funktioniert nicht" → Agent diagnostiziert Problem',
      'Kunde: "Wie kann ich mein Konto löschen?" → Agent erklärt Schritte',
      'Kunde: "Ich bin unzufrieden" → Agent leitet an Manager weiter'
    ]
  },
  {
    id: 'appointment-booking',
    name: 'Terminbuchungs-Agent',
    description: 'Verwaltet Termine und Buchungen automatisch',
    icon: Calendar,
    category: 'Terminplanung',
    useCase: 'Automatische Terminverwaltung',
    questions: [
      'Welche Art von Terminen sollen gebucht werden?',
      'Wie lange dauern die Termine normalerweise?',
      'Welche Zeiten sind verfügbar (Öffnungszeiten)?',
      'Welche Informationen werden vom Kunden benötigt?'
    ],
    capabilities: ['Termine prüfen', 'Kalender verwalten', 'Bestätigungen senden', 'Erinnerungen versenden'],
    examples: [
      'Kunde: "Ich brauche einen Termin" → Agent prüft Verfügbarkeit',
      'Kunde: "Morgen um 14 Uhr?" → Agent bestätigt oder schlägt Alternative vor',
      'System sendet automatisch Bestätigung und Erinnerung'
    ]
  },
  {
    id: 'sales-qualification',
    name: 'Sales Qualification Agent',
    description: 'Qualifiziert Leads und sammelt Kundeninformationen',
    icon: Target,
    category: 'Vertrieb',
    useCase: 'Lead-Qualifizierung und Vertrieb',
    questions: [
      'Welche Qualifikationskriterien sind wichtig (Budget, Timeline, etc.)?',
      'Welche Produkte oder Services werden verkauft?',
      'Ab welchem Punkt soll an einen Verkäufer weitergeleitet werden?',
      'Welche Kundeninformationen sind kritisch?'
    ],
    capabilities: ['Leads bewerten', 'Informationen sammeln', 'Interesse messen', 'Verkäufer kontaktieren'],
    examples: [
      'Agent: "Was ist Ihr Budget für diese Lösung?"',
      'Agent: "Wann möchten Sie das umsetzen?"',
      'Agent qualifiziert Lead und leitet an Verkaufsteam weiter'
    ]
  },
  {
    id: 'restaurant-reservation',
    name: 'Restaurant Reservierungs-Agent',
    description: 'Nimmt Tischreservierungen entgegen',
    icon: Users,
    category: 'Gastronomie',
    useCase: 'Tischreservierungen verwalten',
    questions: [
      'Wie viele Tische/Plätze sind verfügbar?',
      'Welche Öffnungszeiten hat das Restaurant?',
      'Gibt es besondere Regelungen (Mindestaufenthalt, etc.)?',
      'Welche Sonderausstattung ist verfügbar (Kinderstühle, etc.)?'
    ],
    capabilities: ['Tische prüfen', 'Reservierungen verwalten', 'Sonderwünsche notieren', 'Bestätigungen senden'],
    examples: [
      'Kunde: "Tisch für 4 Personen, heute Abend"',
      'Agent: "Um welche Uhrzeit? Wir haben noch 19:00 und 21:30 frei"',
      'Agent erstellt Reservierung und sendet Bestätigung'
    ]
  },
  {
    id: 'healthcare-triage',
    name: 'Medizinische Erstberatung',
    description: 'Führt medizinische Erstberatung durch',
    icon: Heart,
    category: 'Gesundheit',
    useCase: 'Medizinische Triageund Terminvergabe',
    questions: [
      'Welche Art von medizinischer Einrichtung (Praxis, Klinik, etc.)?',
      'Welche Fachrichtungen sind verfügbar?',
      'Welche Notfallkriterien gibt es?',
      'Welche Informationen dürfen medizinisch erfragt werden?'
    ],
    capabilities: ['Symptome erfragen', 'Dringlichkeit bewerten', 'Termine vergeben', 'Notfälle erkennen'],
    examples: [
      'Patient: "Ich habe Kopfschmerzen" → Agent erfragt Details',
      'Bei Notfallsymptomen → Sofortige Weiterleitung',
      'Normaler Fall → Terminvereinbarung mit passendem Arzt'
    ]
  },
  {
    id: 'education-tutor',
    name: 'Lern-Assistent',
    description: 'Hilft beim Lernen und beantwortet Fragen',
    icon: BookOpen,
    category: 'Bildung',
    useCase: 'Lernunterstützung und Nachhilfe',
    questions: [
      'Welches Fachgebiet oder Thema soll unterrichtet werden?',
      'Für welche Altersgruppe/Niveau ist der Agent gedacht?',
      'Welche Lernmethoden sollen verwendet werden?',
      'Gibt es spezielle Curricula oder Lehrpläne zu folgen?'
    ],
    capabilities: ['Fragen beantworten', 'Lernpläne erstellen', 'Übungen geben', 'Fortschritt verfolgen'],
    examples: [
      'Schüler: "Kannst du mir Mathe erklären?" → Agent passt sich dem Niveau an',
      'Agent erstellt personalisierte Übungen',
      'Agent verfolgt Lernfortschritt und motiviert'
    ]
  }
]

interface ConversationStep {
  id: string
  type: 'question' | 'info' | 'choice' | 'input' | 'result'
  title: string
  content: string
  options?: string[]
  inputType?: 'text' | 'textarea' | 'select'
  inputOptions?: string[]
  required?: boolean
}

export default function AIAgentCreator() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAgent, setGeneratedAgent] = useState<Partial<VapiAssistant> | null>(null)
  const [conversationSteps, setConversationSteps] = useState<ConversationStep[]>([])

  // Initialize conversation steps based on selected template
  useEffect(() => {
    if (selectedTemplate) {
      const steps: ConversationStep[] = [
        {
          id: 'welcome',
          type: 'info',
          title: `${selectedTemplate.name} wird erstellt`,
          content: `Perfekt! Ich helfe dir dabei, einen ${selectedTemplate.name} zu erstellen. Ich stelle dir ein paar Fragen, um den Agent perfekt auf deine Bedürfnisse anzupassen.`
        },
        ...selectedTemplate.questions.map((question, index) => ({
          id: `question_${index}`,
          type: 'input' as const,
          title: `Frage ${index + 1} von ${selectedTemplate.questions.length}`,
          content: question,
          inputType: 'textarea' as const,
          required: true
        })),
        {
          id: 'customization',
          type: 'choice',
          title: 'Erweiterte Anpassungen',
          content: 'Möchtest du zusätzliche Fähigkeiten für deinen Agent konfigurieren?',
          options: ['Ja, ich möchte erweiterte Einstellungen', 'Nein, erstelle den Agent mit Standard-Einstellungen']
        },
        {
          id: 'voice_selection',
          type: 'choice',
          title: 'Stimme auswählen',
          content: 'Welche Art von Stimme soll dein Agent haben?',
          options: ['Freundlich und professionell', 'Warm und empathisch', 'Sachlich und kompetent', 'Energisch und motivierend']
        },
        {
          id: 'language_style',
          type: 'choice',
          title: 'Kommunikationsstil',
          content: 'Wie soll dein Agent mit Kunden kommunizieren?',
          options: ['Formal und höflich', 'Freundlich und locker', 'Direkt und effizient', 'Hilfsbereit und geduldig']
        }
      ]
      setConversationSteps(steps)
    }
  }, [selectedTemplate])

  const currentStepData = conversationSteps[currentStep]

  const handleAnswer = (answer: string) => {
    if (currentStepData) {
      setAnswers(prev => ({
        ...prev,
        [currentStepData.id]: answer
      }))
    }
  }

  const nextStep = () => {
    if (currentStep < conversationSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      generateAgent()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const generateAgent = async () => {
    if (!selectedTemplate) return

    setIsGenerating(true)
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Generate agent configuration based on answers
    const systemMessage = generateSystemMessage(selectedTemplate, answers)
    const firstMessage = generateFirstMessage(selectedTemplate, answers)
    
    const agent: Partial<VapiAssistant> = {
      name: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'de',
        smartFormat: true
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        systemMessage,
        temperature: 0.7,
        maxTokens: 300
      },
      voice: {
        provider: 'elevenlabs',
        voiceId: getVoiceId(answers.voice_selection || ''),
        stability: 0.75,
        similarityBoost: 0.75
      },
      firstMessage,
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 600
    }

    setGeneratedAgent(agent)
    setIsGenerating(false)
  }

  const generateSystemMessage = (template: AgentTemplate, answers: Record<string, string>): string => {
    const baseMessage = `Du bist ein ${template.name} für ein deutsches Unternehmen. `
    
    let contextualMessage = ''
    template.questions.forEach((question, index) => {
      const answer = answers[`question_${index}`]
      if (answer) {
        contextualMessage += `${question} - ${answer}\n`
      }
    })

    const styleMessage = getStyleMessage(answers.language_style || '')
    
    return `${baseMessage}

Deine Aufgabe: ${template.useCase}

Kontext und Anweisungen:
${contextualMessage}

${styleMessage}

Fähigkeiten: ${template.capabilities.join(', ')}

Verhalte dich immer professionell, hilfsbereit und authentisch deutsch. Verwende eine natürliche, gesprochene Sprache.`
  }

  const generateFirstMessage = (template: AgentTemplate, answers: Record<string, string>): string => {
    const greetings = {
      'customer-support': 'Hallo! Ich bin Ihr persönlicher Support-Assistent. Wie kann ich Ihnen heute helfen?',
      'appointment-booking': 'Guten Tag! Ich helfe Ihnen gerne bei der Terminbuchung. Für wann möchten Sie einen Termin vereinbaren?',
      'sales-qualification': 'Hallo! Schön, dass Sie sich für unser Angebot interessieren. Darf ich Ihnen ein paar Fragen stellen, um Ihnen bestmöglich zu helfen?',
      'restaurant-reservation': 'Guten Tag! Ich nehme gerne Ihre Tischreservierung entgegen. Für wie viele Personen und wann möchten Sie reservieren?',
      'healthcare-triage': 'Guten Tag! Ich bin hier, um Ihnen bei der Terminvereinbarung zu helfen. Was führt Sie zu uns?',
      'education-tutor': 'Hallo! Ich bin dein Lern-Assistent. Bei welchem Thema kann ich dir heute helfen?'
    }
    
    return greetings[template.id as keyof typeof greetings] || 'Hallo! Wie kann ich Ihnen heute helfen?'
  }

  const getStyleMessage = (style: string): string => {
    const styles = {
      'Formal und höflich': 'Verwende immer die Höflichkeitsform "Sie" und bleibe professionell.',
      'Freundlich und locker': 'Sei freundlich und verwende gerne "Du", aber bleibe respektvoll.',
      'Direkt und effizient': 'Sei direkt und komme schnell zum Punkt, aber bleibe höflich.',
      'Hilfsbereit und geduldig': 'Nimm dir Zeit für Erklärungen und sei sehr geduldig mit Fragen.'
    }
    return styles[style as keyof typeof styles] || 'Sei freundlich und professionell.'
  }

  const getVoiceId = (voiceSelection: string): string => {
    const voices = {
      'Freundlich und professionell': 'ErXwobaYiN019PkySvjV',
      'Warm und empathisch': 'EXAVITQu4vr4xnSDxMaL',
      'Sachlich und kompetent': 'VR6AewLTigWG4xSOukaG',
      'Energisch und motivierend': 'pNInz6obpgDQGcFmaJgB'
    }
    return voices[voiceSelection as keyof typeof voices] || 'ErXwobaYiN019PkySvjV'
  }

  const resetCreator = () => {
    setCurrentStep(0)
    setSelectedTemplate(null)
    setAnswers({})
    setGeneratedAgent(null)
    setConversationSteps([])
  }

  const saveAgent = () => {
    if (generatedAgent) {
      // Here you would typically save to your backend/database
      console.log('Saving agent:', generatedAgent)
      
      // For demo, just show success and close
      alert('Agent wurde erfolgreich erstellt!')
      setIsOpen(false)
      resetCreator()
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
        size="lg"
      >
        <Wand2 className="mr-2 h-5 w-5" />
        AI Agent erstellen
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Sparkles className="mr-2 h-6 w-6 text-blue-600" />
              AI Agent Creator
            </DialogTitle>
            <DialogDescription>
              Erstelle in wenigen Minuten einen maßgeschneiderten Voice AI Agent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Template Selection */}
            {!selectedTemplate && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Welchen Art von Agent möchtest du erstellen?
                  </h3>
                  <p className="text-gray-600">
                    Wähle eine Vorlage aus oder beschreibe, was dein Agent können soll
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agentTemplates.map((template) => (
                    <Card 
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <template.icon className="h-8 w-8 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-3">
                          {template.description}
                        </p>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Fähigkeiten:</div>
                            <div className="flex flex-wrap gap-1">
                              {template.capabilities.slice(0, 3).map((capability) => (
                                <Badge key={capability} variant="secondary" className="text-xs">
                                  {capability}
                                </Badge>
                              ))}
                              {template.capabilities.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{template.capabilities.length - 3} mehr
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Flow */}
            {selectedTemplate && !isGenerating && !generatedAgent && currentStepData && (
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / conversationSteps.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {currentStep + 1} / {conversationSteps.length}
                  </span>
                </div>

                {/* Current Step */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700">{currentStepData.content}</p>

                    {currentStepData.type === 'input' && (
                      <div>
                        {currentStepData.inputType === 'textarea' ? (
                          <Textarea
                            value={answers[currentStepData.id] || ''}
                            onChange={(e) => handleAnswer(e.target.value)}
                            placeholder="Ihre Antwort..."
                            rows={4}
                          />
                        ) : (
                          <Input
                            value={answers[currentStepData.id] || ''}
                            onChange={(e) => handleAnswer(e.target.value)}
                            placeholder="Ihre Antwort..."
                          />
                        )}
                      </div>
                    )}

                    {currentStepData.type === 'choice' && currentStepData.options && (
                      <div className="space-y-2">
                        {currentStepData.options.map((option) => (
                          <Button
                            key={option}
                            variant={answers[currentStepData.id] === option ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => handleAnswer(option)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={resetCreator}
                    >
                      Neu starten
                    </Button>
                    <Button
                      onClick={nextStep}
                      disabled={currentStepData.required && !answers[currentStepData.id]}
                    >
                      {currentStep === conversationSteps.length - 1 ? (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Agent erstellen
                        </>
                      ) : (
                        <>
                          Weiter
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Generation in Progress */}
            {isGenerating && (
              <div className="text-center py-12">
                <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Dein Agent wird erstellt...
                </h3>
                <p className="text-gray-600 mb-4">
                  Die KI konfiguriert deinen Agent basierend auf deinen Antworten
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div>✓ Gesprächslogik wird generiert</div>
                  <div>✓ Stimme wird angepasst</div>
                  <div>⏳ Finale Konfiguration...</div>
                </div>
              </div>
            )}

            {/* Generated Agent Preview */}
            {generatedAgent && !isGenerating && (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Agent erfolgreich erstellt!
                  </h3>
                  <p className="text-gray-600">
                    Dein maßgeschneiderter Voice AI Agent ist bereit
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bot className="mr-2 h-5 w-5" />
                      {generatedAgent.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Erste Nachricht:</Label>
                      <p className="text-sm text-gray-700 italic p-3 bg-gray-50 rounded-lg mt-1">
                        "{generatedAgent.firstMessage}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Sprache zu Text:</Label>
                        <p className="text-sm text-gray-600">{generatedAgent.transcriber?.provider}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Text zu Sprache:</Label>
                        <p className="text-sm text-gray-600">{generatedAgent.voice?.provider}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">KI Modell:</Label>
                        <p className="text-sm text-gray-600">{generatedAgent.model?.model}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Max. Gesprächsdauer:</Label>
                        <p className="text-sm text-gray-600">{generatedAgent.maxDurationSeconds}s</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">System-Anweisungen:</Label>
                      <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg mt-1 max-h-32 overflow-y-auto">
                        {generatedAgent.model?.systemMessage}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={resetCreator}
                  >
                    Neuen Agent erstellen
                  </Button>
                  <div className="flex space-x-2">
                    <Button variant="outline">
                      Vorschau testen
                    </Button>
                    <Button onClick={saveAgent}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Agent speichern
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}