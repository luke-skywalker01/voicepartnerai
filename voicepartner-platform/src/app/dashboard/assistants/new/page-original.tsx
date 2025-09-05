'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Bot, 
  Zap,
  Sparkles, 
  Play,
  Save,
  Wand2,
  Calendar,
  ShoppingCart,
  Headphones,
  Building,
  ArrowRight,
  CheckCircle,
  Settings,
  Mic,
  Volume2
} from 'lucide-react'
import Link from 'next/link'
import { getSmartDefaults, USE_CASE_TEMPLATES, optimizePromptForGerman } from '@/lib/smart-defaults'
import SuccessModal from '@/components/ui/SuccessModal'

type AssistantType = 'easy' | 'advanced'

interface AssistantConfig {
  name: string
  description: string
  systemPrompt: string
  firstMessage: string
  endCallMessage: string
  voice: {
    provider: string
    voiceId: string
    language: string
  }
  model: {
    provider: string
    model: string
    temperature: number
  }
  maxDuration: number
  type: AssistantType
  template?: string
}

export default function NewAssistantPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [assistantType, setAssistantType] = useState<AssistantType>('easy')
  const [userPrompt, setUserPrompt] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [step, setStep] = useState(1) // 1: Choose type, 2: Describe assistant, 3: Customize, 4: Review
  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  
  // Check for instant demo mode
  useEffect(() => {
    const isInstant = searchParams.get('instant') === 'true'
    if (isInstant) {
      const demoPrompt = localStorage.getItem('instant_demo_prompt')
      if (demoPrompt) {
        setUserPrompt(demoPrompt)
        setAssistantType('easy')
        setSelectedTemplate('customer-service')
        
        // Auto-generate the assistant
        setTimeout(() => {
          const template = easyTemplates.find(t => t.id === 'customer-service')
          if (template) {
            const assistant = generateEasyAssistant(template, demoPrompt)
            setAssistantConfig(assistant)
            setStep(4) // Jump to review step
          }
        }, 1000)
        
        localStorage.removeItem('instant_demo_prompt')
      }
    }
  }, [searchParams])

  // Predefined templates for easy assistants
  const easyTemplates = [
    {
      id: 'customer-service',
      name: 'Kundenservice',
      icon: Headphones,
      description: 'Beantwortet Kundenfragen und löst Probleme',
      prompt: 'Du bist ein professioneller Kundenservice-Mitarbeiter. Sei hilfsbereit, höflich und lösungsorientiert.'
    },
    {
      id: 'appointment-booking',
      name: 'Terminbuchung',
      icon: Calendar,
      description: 'Vereinbart Termine und verwaltet Kalender',
      prompt: 'Du hilfst bei der Terminbuchung. Erfrage verfügbare Zeiten und bestätige Termine professionell.'
    },
    {
      id: 'sales-assistant',
      name: 'Verkaufsassistent',
      icon: ShoppingCart,
      description: 'Berät Kunden und unterstützt beim Verkauf',
      prompt: 'Du bist ein Verkaufsberater. Verstehe Kundenbedürfnisse und empfehle passende Produkte.'
    },
    {
      id: 'reception',
      name: 'Empfang',
      icon: Building,
      description: 'Begrüßt Anrufer und leitet sie weiter',
      prompt: 'Du bist eine freundliche Empfangskraft. Begrüße Anrufer herzlich und leite sie an die richtige Abteilung weiter.'
    }
  ]

  const generateEasyAssistant = (template: any, userDescription: string): AssistantConfig => {
    const smartDefaults = getSmartDefaults(userDescription, template.industry)
    const useCaseTemplate = USE_CASE_TEMPLATES[template.id as keyof typeof USE_CASE_TEMPLATES]
    
    const basePrompt = useCaseTemplate?.systemPrompt || template.prompt
    const enhancedPrompt = optimizePromptForGerman(
      `${basePrompt}\n\nSpezieller Kontext: ${userDescription}`,
      template.id
    )
    
    return {
      name: `${template.name} Assistant`,
      description: userDescription || template.description,
      systemPrompt: enhancedPrompt,
      firstMessage: useCaseTemplate?.firstMessage || `Hallo! Ich bin Ihr ${template.name} Assistant. Wie kann ich Ihnen heute helfen?`,
      endCallMessage: useCaseTemplate?.endMessage || 'Vielen Dank für das Gespräch. Auf Wiederhören!',
      voice: smartDefaults.voice,
      model: smartDefaults.model,
      maxDuration: smartDefaults.conversation.maxDuration,
      type: 'easy',
      template: template.id
    }
  }

  const generateAdvancedAssistant = (userDescription: string): AssistantConfig => {
    return {
      name: 'Fortgeschrittener Assistant',
      description: userDescription,
      systemPrompt: `Du bist ein fortgeschrittener AI-Assistant mit erweiterten Funktionen.

Kontext: ${userDescription}

Du hast Zugang zu verschiedenen Tools und Integrationen:
- Google Calendar für Terminverwaltung
- CRM-System für Kundendaten
- E-Mail Integration
- Wissensbank Zugriff

Nutze diese Tools intelligent und frage nach, wenn du zusätzliche Informationen benötigst.
Antworte professionell und hilfsbereit auf Deutsch.`,
      firstMessage: 'Hallo! Ich bin Ihr fortgeschrittener AI-Assistant mit erweiterten Funktionen. Wie kann ich Ihnen heute helfen?',
      endCallMessage: 'Vielen Dank für das Gespräch. Falls Sie weitere Fragen haben, bin ich jederzeit für Sie da. Auf Wiederhören!',
      voice: {
        provider: 'ElevenLabs',
        voiceId: 'Rachel',
        language: 'de-DE'
      },
      model: {
        provider: 'OpenAI',
        model: 'gpt-4o',
        temperature: 0.7
      },
      maxDuration: 1800,
      type: 'advanced'
    }
  }

  const handleNext = () => {
    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      // Generate assistant based on type and user input
      if (assistantType === 'easy' && selectedTemplate) {
        const template = easyTemplates.find(t => t.id === selectedTemplate)
        if (template) {
          const assistant = generateEasyAssistant(template, userPrompt)
          setAssistantConfig(assistant)
        }
      } else if (assistantType === 'advanced') {
        const assistant = generateAdvancedAssistant(userPrompt)
        setAssistantConfig(assistant)
      }
      setStep(3) // Go to customization step
    } else if (step === 3) {
      setStep(4) // Go to review step
    }
  }

  const handleSave = async () => {
    if (!assistantConfig) return
    
    setIsLoading(true)
    
    try {
      // Save assistant to localStorage for demo
      const assistants = JSON.parse(localStorage.getItem('voicepartner_agents') || '[]')
      const newAssistant = {
        id: `agent_${Date.now()}`,
        ...assistantConfig,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      assistants.push(newAssistant)
      localStorage.setItem('voicepartner_agents', JSON.stringify(assistants))
      
      setShowSuccessModal(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error saving assistant:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const voiceOptions = [
    { id: 'Rachel', name: 'Rachel (Weiblich, Professionell)', provider: 'ElevenLabs' },
    { id: 'Paul', name: 'Paul (Männlich, Freundlich)', provider: 'ElevenLabs' },
    { id: 'Sarah', name: 'Sarah (Weiblich, Warm)', provider: 'ElevenLabs' },
    { id: 'Daniel', name: 'Daniel (Männlich, Autoritativ)', provider: 'ElevenLabs' }
  ]

  const modelOptions = [
    { id: 'gpt-4o', name: 'GPT-4o (Empfohlen)', provider: 'OpenAI', description: 'Neuestes und leistungsstärkstes Modell' },
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Bewährtes Premium-Modell' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Schnell und kosteneffizient' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Neuer Assistant</h1>
                <p className="text-sm text-muted-foreground">Erstellen Sie Ihren personalisierten Voice AI Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">Schritt {step} von 4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 py-6">
        {[
          { num: 1, label: 'Typ wählen' },
          { num: 2, label: 'Beschreiben' },
          { num: 3, label: 'Anpassen' },
          { num: 4, label: 'Erstellen' }
        ].map((stepInfo, index) => (
          <div key={stepInfo.num} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              stepInfo.num === step 
                ? 'bg-primary text-primary-foreground' 
                : stepInfo.num < step 
                ? 'bg-green-500 text-white' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {stepInfo.num < step ? <CheckCircle className="h-4 w-4" /> : stepInfo.num}
            </div>
            <span className="ml-2 text-sm font-medium">{stepInfo.label}</span>
            {index < 3 && <ArrowRight className="h-4 w-4 ml-6 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        {/* Step 1: Choose Assistant Type */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Welchen Typ von Assistant möchten Sie erstellen?</h2>
              <p className="text-muted-foreground">Wählen Sie zwischen einem einfachen Agent oder einem erweiterten Agent mit Integrationen.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Easy Assistant */}
              <div 
                onClick={() => setAssistantType('easy')}
                className={`cursor-pointer border-2 rounded-lg p-6 transition-all hover:shadow-lg ${
                  assistantType === 'easy' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-lg mb-4 mx-auto">
                  <Zap className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">Easy Agent</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Perfekt für Standard-Anwendungsfälle. Wird automatisch mit bewährten Einstellungen konfiguriert.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Vorgefertigte Templates</li>
                  <li>• Optimierte Prompts</li>
                  <li>• Deutsche Stimmen</li>
                  <li>• Sofort einsatzbereit</li>
                </ul>
              </div>

              {/* Advanced Assistant */}
              <div 
                onClick={() => setAssistantType('advanced')}
                className={`cursor-pointer border-2 rounded-lg p-6 transition-all hover:shadow-lg ${
                  assistantType === 'advanced' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-lg mb-4 mx-auto">
                  <Settings className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">Fortgeschrittener Agent</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Für komplexe Anwendungsfälle mit erweiterten Funktionen und Integrationen.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Tool-Integrationen</li>
                  <li>• Erweiterte Workflows</li>
                  <li>• API-Anbindungen</li>
                  <li>• Vollständig anpassbar</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md transition-colors flex items-center"
              >
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Describe Assistant */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Beschreiben Sie Ihren Assistant</h2>
              <p className="text-muted-foreground">
                {assistantType === 'easy' 
                  ? 'Wählen Sie ein Template und beschreiben Sie Ihren spezifischen Anwendungsfall.'
                  : 'Beschreiben Sie detailliert, was Ihr Assistant können soll.'
                }
              </p>
            </div>

            {assistantType === 'easy' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Template auswählen</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {easyTemplates.map((template) => {
                      const Icon = template.icon
                      return (
                        <div
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`cursor-pointer border rounded-lg p-4 transition-all hover:shadow-md ${
                            selectedTemplate === template.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                {assistantType === 'easy' ? 'Spezifischer Anwendungsfall' : 'Assistant-Beschreibung'}
              </label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder={
                  assistantType === 'easy' 
                    ? 'z.B. Kundenservice für meinen Online-Shop für Sportartikel mit Fokus auf Retouren und Produktberatung...'
                    : 'Beschreiben Sie detailliert die Aufgaben und Funktionen Ihres Assistants...'
                }
                className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Je detaillierter Ihre Beschreibung, desto besser kann der Assistant konfiguriert werden.
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="border border-border hover:bg-muted px-6 py-2 rounded-md transition-colors flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </button>
              <button
                onClick={handleNext}
                disabled={!userPrompt.trim() || (assistantType === 'easy' && !selectedTemplate)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-md transition-colors flex items-center"
              >
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Customize Assistant */}
        {step === 3 && assistantConfig && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Assistant anpassen</h2>
              <p className="text-muted-foreground">Passen Sie Ihren Assistant nach Ihren Wünschen an.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Settings */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={assistantConfig.name}
                    onChange={(e) => setAssistantConfig({...assistantConfig, name: e.target.value})}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Beschreibung</label>
                  <textarea
                    value={assistantConfig.description}
                    onChange={(e) => setAssistantConfig({...assistantConfig, description: e.target.value})}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Erste Nachricht</label>
                  <textarea
                    value={assistantConfig.firstMessage}
                    onChange={(e) => setAssistantConfig({...assistantConfig, firstMessage: e.target.value})}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    rows={3}
                    placeholder="Die erste Nachricht, die der Assistant sagt..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Stimme</label>
                  <select
                    value={assistantConfig.voice.voiceId}
                    onChange={(e) => {
                      const selectedVoice = voiceOptions.find(v => v.id === e.target.value)
                      if (selectedVoice) {
                        setAssistantConfig({
                          ...assistantConfig,
                          voice: {
                            ...assistantConfig.voice,
                            voiceId: selectedVoice.id,
                            provider: selectedVoice.provider
                          }
                        })
                      }
                    }}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {voiceOptions.map(voice => (
                      <option key={voice.id} value={voice.id}>{voice.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">KI-Modell</label>
                  <select
                    value={assistantConfig.model.model}
                    onChange={(e) => {
                      const selectedModel = modelOptions.find(m => m.id === e.target.value)
                      if (selectedModel) {
                        setAssistantConfig({
                          ...assistantConfig,
                          model: {
                            ...assistantConfig.model,
                            model: selectedModel.id,
                            provider: selectedModel.provider
                          }
                        })
                      }
                    }}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    {modelOptions.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {modelOptions.find(m => m.id === assistantConfig.model.model)?.description}
                  </p>
                </div>
              </div>

              {/* Right Column - Advanced Settings */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">System Prompt</label>
                  <textarea
                    value={assistantConfig.systemPrompt}
                    onChange={(e) => setAssistantConfig({...assistantConfig, systemPrompt: e.target.value})}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    rows={8}
                    placeholder="Definieren Sie das Verhalten und die Persönlichkeit des Assistants..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Abschlussnachricht</label>
                  <textarea
                    value={assistantConfig.endCallMessage}
                    onChange={(e) => setAssistantConfig({...assistantConfig, endCallMessage: e.target.value})}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    rows={2}
                    placeholder="Die Nachricht am Ende des Gesprächs..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Temperatur ({assistantConfig.model.temperature})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={assistantConfig.model.temperature}
                    onChange={(e) => setAssistantConfig({
                      ...assistantConfig,
                      model: {
                        ...assistantConfig.model,
                        temperature: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Konservativ (0.0)</span>
                    <span>Kreativ (1.0)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max. Gesprächsdauer (Sekunden)
                  </label>
                  <input
                    type="number"
                    value={assistantConfig.maxDuration}
                    onChange={(e) => setAssistantConfig({...assistantConfig, maxDuration: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    min="60"
                    max="3600"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.floor(assistantConfig.maxDuration / 60)} Minuten
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="border border-border hover:bg-muted px-6 py-2 rounded-md transition-colors flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </button>
              <button
                onClick={handleNext}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md transition-colors flex items-center"
              >
                Zur Vorschau
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review and Create */}
        {step === 4 && assistantConfig && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Assistant erstellen</h2>
              <p className="text-muted-foreground">Überprüfen Sie Ihre Einstellungen und erstellen Sie den Assistant.</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Grundeinstellungen</h3>
                  <div className="space-y-3 text-sm">
                    <div><strong>Name:</strong> {assistantConfig.name}</div>
                    <div><strong>Typ:</strong> {assistantConfig.type === 'easy' ? 'Easy Agent' : 'Fortgeschrittener Agent'}</div>
                    <div><strong>Stimme:</strong> {voiceOptions.find(v => v.id === assistantConfig.voice.voiceId)?.name}</div>
                    <div><strong>Modell:</strong> {modelOptions.find(m => m.id === assistantConfig.model.model)?.name}</div>
                    <div><strong>Max. Dauer:</strong> {Math.floor(assistantConfig.maxDuration / 60)} Minuten</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Nachrichten</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Erste Nachricht:</strong>
                      <p className="text-muted-foreground mt-1 italic">"{assistantConfig.firstMessage}"</p>
                    </div>
                    <div>
                      <strong>Beschreibung:</strong>
                      <p className="text-muted-foreground mt-1">{assistantConfig.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="border border-border hover:bg-muted px-6 py-2 rounded-md transition-colors flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-8 py-3 rounded-md transition-colors flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Assistant erstellen
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && assistantConfig && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          assistantName={assistantConfig.name}
          assistantType={assistantConfig.type}
        />
      )}
    </div>
  )
}