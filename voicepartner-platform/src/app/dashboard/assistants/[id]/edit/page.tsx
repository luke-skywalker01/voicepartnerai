'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
// import { getSmartDefaults, USE_CASE_TEMPLATES, optimizePromptForGerman } from '@/lib/smart-defaults'
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

export default function EditAssistantPage() {
  const router = useRouter()
  const params = useParams()
  const assistantId = params.id as string
  
  const [isLoading, setIsLoading] = useState(false)
  const [assistantType, setAssistantType] = useState<AssistantType>('easy')
  const [userPrompt, setUserPrompt] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [step, setStep] = useState(3) // Start at customization step since we're editing
  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [originalAssistant, setOriginalAssistant] = useState<any>(null)
  
  // Load existing assistant data
  useEffect(() => {
    const loadAssistant = () => {
      try {
        const assistants = JSON.parse(localStorage.getItem('voicepartner_agents') || '[]')
        const assistant = assistants.find((a: any) => a.id === assistantId)
        
        if (assistant) {
          setOriginalAssistant(assistant)
          setAssistantType(assistant.type || 'easy')
          setSelectedTemplate(assistant.template || '')
          setUserPrompt(assistant.description || '')
          
          // Map assistant data to AssistantConfig format with safe defaults
          const config: AssistantConfig = {
            name: assistant.name || 'Unbenannter Assistant',
            description: assistant.description || '',
            systemPrompt: assistant.systemPrompt || 'Du bist ein hilfsreicher AI-Assistant.',
            firstMessage: assistant.firstMessage || 'Hallo! Wie kann ich Ihnen helfen?',
            endCallMessage: assistant.endCallMessage || 'Vielen Dank für das Gespräch. Auf Wiederhören!',
            voice: {
              provider: assistant.voice?.provider || 'ElevenLabs',
              voiceId: assistant.voice?.voiceId || 'Rachel',
              language: assistant.voice?.language || 'de-DE'
            },
            model: {
              provider: assistant.model?.provider || 'OpenAI',
              model: assistant.model?.model || 'gpt-4o',
              temperature: assistant.model?.temperature ?? 0.7
            },
            maxDuration: assistant.maxDuration || 1800,
            type: (assistant.type as AssistantType) || 'easy',
            template: assistant.template
          }
          
          setAssistantConfig(config)
        } else {
          // Assistant not found, show error or redirect
          console.error('Assistant not found:', assistantId)
          throw new Error(`Assistant mit ID ${assistantId} wurde nicht gefunden`)
        }
      } catch (error) {
        console.error('Error loading assistant:', error)
        // Don't redirect immediately, let error boundary handle it
        throw error
      }
    }
    
    if (assistantId) {
      loadAssistant()
    }
  }, [assistantId, router])

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

  const handleSave = async () => {
    if (!assistantConfig || !originalAssistant) return
    
    setIsLoading(true)
    
    try {
      // Update assistant in localStorage for demo
      const assistants = JSON.parse(localStorage.getItem('voicepartner_agents') || '[]')
      const assistantIndex = assistants.findIndex((a: any) => a.id === assistantId)
      
      if (assistantIndex !== -1) {
        const updatedAssistant = {
          ...originalAssistant,
          ...assistantConfig,
          updatedAt: new Date().toISOString()
        }
        
        assistants[assistantIndex] = updatedAssistant
        localStorage.setItem('voicepartner_agents', JSON.stringify(assistants))
        
        setShowSuccessModal(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        throw new Error('Assistant not found')
      }
    } catch (error) {
      console.error('Error updating assistant:', error)
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

  if (!assistantConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Assistant wird geladen...</p>
        </div>
      </div>
    )
  }

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
                <h1 className="text-2xl font-bold">Assistant bearbeiten</h1>
                <p className="text-sm text-muted-foreground">Passen Sie Ihren Voice AI Assistant an</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground">Bearbeiten</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="max-w-4xl mx-auto px-6 py-8">
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

          <div className="flex justify-between pt-6 border-t border-border">
            <Link 
              href="/dashboard"
              className="border border-border hover:bg-muted px-6 py-2 rounded-md transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Abbrechen
            </Link>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-8 py-3 rounded-md transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"></div>
                  Wird gespeichert...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Änderungen speichern
                </>
              )}
            </button>
          </div>
        </div>
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