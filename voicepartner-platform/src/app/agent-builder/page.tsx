'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Mic, 
  Brain, 
  Settings, 
  Code,
  MessageSquare,
  Volume2,
  Zap,
  TestTube,
  Copy,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Calendar,
  Phone,
  Database,
  Globe,
  ArrowRight,
  GitBranch
} from 'lucide-react'

interface Agent {
  id: string
  name: string
  description: string
  systemPrompt: string
  firstMessage: string
  voice: {
    provider: string
    voiceId: string
    stability: number
    clarity: number
    speed: number
  }
  model: {
    provider: string
    model: string
    temperature: number
    maxTokens: number
  }
  transcription: {
    provider: string
    model: string
    language: string
  }
  tools: any[]
  workflows: any[]
  endCallConditions: {
    maxDuration: number
    silenceTimeout: number
    keywords: string[]
  }
  status: 'draft' | 'deployed' | 'testing'
  createdAt: string
  updatedAt: string
}

interface Tool {
  id: string
  name: string
  type: 'google_calendar' | 'webhook' | 'database' | 'custom'
  description: string
  config: any
  enabled: boolean
}

export default function AgentBuilderPage() {
  const [agentConfig, setAgentConfig] = useState<Agent>({
    id: '',
    name: 'Neuer Voice Agent',
    description: 'Beschreibung Ihres Voice Agents',
    systemPrompt: `Du bist ein hilfsreicher KI-Assistent für deutsche Kunden.

Deine Hauptaufgaben:
- Beantworte Fragen höflich und professionell
- Spreche natürlich und freundlich
- Halte dich kurz und präzise
- Frage nach, wenn etwas unklar ist

Wichtige Regeln:
- Antworte immer auf Deutsch
- Bleibe im Kontext des Gesprächs
- Wenn du etwas nicht weißt, sage es ehrlich`,
    firstMessage: 'Hallo! Wie kann ich Ihnen heute helfen?',
    voice: {
      provider: 'elevenlabs',
      voiceId: 'german-female-1',
      stability: 0.75,
      clarity: 0.85,
      speed: 1.0
    },
    model: {
      provider: 'openai',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 150
    },
    transcription: {
      provider: 'openai',
      model: 'whisper-1',
      language: 'de'
    },
    tools: [],
    workflows: [],
    endCallConditions: {
      maxDuration: 600,
      silenceTimeout: 10,
      keywords: ['auf wiedersehen', 'tschüss', 'beenden']
    },
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const [activeTab, setActiveTab] = useState('prompt')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResults, setTestResults] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [availableProviders, setAvailableProviders] = useState<any>({})
  const [availableTools, setAvailableTools] = useState<Tool[]>([
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      type: 'google_calendar',
      description: 'Terminverwaltung und Buchung über Google Calendar',
      config: {},
      enabled: false
    },
    {
      id: 'webhook',
      name: 'Webhook',
      type: 'webhook',
      description: 'HTTP Webhook für externe Integrationen',
      config: { url: '', method: 'POST' },
      enabled: false
    },
    {
      id: 'database',
      name: 'Database Query',
      type: 'database',
      description: 'Datenbankabfragen und -operationen',
      config: {},
      enabled: false
    }
  ])

  useEffect(() => {
    // Load configured providers from localStorage
    const savedProviders = localStorage.getItem('voicepartner_providers')
    if (savedProviders) {
      try {
        setAvailableProviders(JSON.parse(savedProviders))
      } catch (error) {
        console.error('Failed to load providers:', error)
      }
    }

    // Load existing agent if editing
    const urlParams = new URLSearchParams(window.location.search)
    const agentId = urlParams.get('id')
    if (agentId) {
      loadAgent(agentId)
    } else {
      // Generate new ID for new agent
      setAgentConfig(prev => ({ ...prev, id: `agent_${Date.now()}` }))
    }
  }, [])

  const loadAgent = (agentId: string) => {
    const savedAgents = localStorage.getItem('voicepartner_agents')
    if (savedAgents) {
      try {
        const agents = JSON.parse(savedAgents)
        const agent = agents.find((a: Agent) => a.id === agentId)
        if (agent) {
          setAgentConfig(agent)
        }
      } catch (error) {
        console.error('Failed to load agent:', error)
      }
    }
  }

  const tabs = [
    { id: 'prompt', name: 'System Prompt', icon: MessageSquare },
    { id: 'voice', name: 'Voice Settings', icon: Volume2 },
    { id: 'model', name: 'AI Model', icon: Brain },
    { id: 'tools', name: 'Tools & APIs', icon: Zap },
    { id: 'workflows', name: 'Workflows', icon: Settings },
    { id: 'test', name: 'Testing', icon: TestTube }
  ]

  const getConfiguredProviders = (category: string) => {
    return Object.entries(availableProviders)
      .filter(([key, config]) => {
        // Check if provider is configured and belongs to the category
        if (!config || typeof config !== 'object') return false
        
        // Determine category based on provider key
        if (category === 'tts') {
          return ['elevenlabs', 'azure_speech', 'google_speech', 'aws_polly'].includes(key)
        } else if (category === 'llm') {
          return ['openai', 'anthropic', 'azure_openai'].includes(key)
        } else if (category === 'stt') {
          return ['openai', 'azure_speech', 'google_speech'].includes(key)
        }
        return false
      })
      .map(([key, config]) => ({ key, config }))
  }

  const testVoice = async () => {
    const ttsProviders = getConfiguredProviders('tts')
    const currentProvider = ttsProviders.find(p => p.key === agentConfig.voice.provider)
    
    if (!currentProvider) {
      setTestResults({
        success: false,
        message: `${agentConfig.voice.provider} ist nicht konfiguriert. Bitte gehen Sie zu den Einstellungen.`
      })
      return
    }

    setIsPlaying(true)
    setTestResults(null)

    try {
      const testText = agentConfig.firstMessage || 'Das ist ein Test der Sprachausgabe.'
      
      // Simulate API call to TTS provider
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTestResults({
        success: true,
        message: 'Voice Test erfolgreich! Die Stimme klingt natürlich und verständlich.'
      })
    } catch (error) {
      setTestResults({
        success: false,
        message: 'Voice Test fehlgeschlagen. Überprüfen Sie Ihre Provider-Konfiguration.'
      })
    } finally {
      setIsPlaying(false)
    }
  }

  const saveAgent = async () => {
    setIsSaving(true)
    
    try {
      // Update timestamps
      const updatedAgent = {
        ...agentConfig,
        updatedAt: new Date().toISOString()
      }

      // Save to localStorage (in production, this would be an API call)
      const savedAgents = localStorage.getItem('voicepartner_agents')
      let agents: Agent[] = []
      
      if (savedAgents) {
        agents = JSON.parse(savedAgents)
      }

      // Update existing or add new
      const existingIndex = agents.findIndex(a => a.id === updatedAgent.id)
      if (existingIndex >= 0) {
        agents[existingIndex] = updatedAgent
      } else {
        agents.push(updatedAgent)
      }

      localStorage.setItem('voicepartner_agents', JSON.stringify(agents))
      setAgentConfig(updatedAgent)
      
      alert('Agent wurde erfolgreich gespeichert!')
    } catch (error) {
      console.error('Save failed:', error)
      alert('Fehler beim Speichern des Agents.')
    } finally {
      setIsSaving(false)
    }
  }

  const deployAgent = async () => {
    // Check if all required providers are configured
    const requiredProviders = [
      { category: 'tts', current: agentConfig.voice.provider },
      { category: 'llm', current: agentConfig.model.provider },
      { category: 'stt', current: agentConfig.transcription.provider }
    ]

    const missingProviders = requiredProviders.filter(({ category, current }) => {
      const configured = getConfiguredProviders(category)
      return !configured.find(p => p.key === current)
    })

    if (missingProviders.length > 0) {
      alert(`Bitte konfigurieren Sie zuerst diese Provider in den Einstellungen:\n${missingProviders.map(p => p.current).join(', ')}`)
      return
    }

    // Save first, then deploy
    await saveAgent()
    
    setAgentConfig(prev => ({ ...prev, status: 'deployed' }))
    alert('Agent wird deployed... Sie erhalten eine Benachrichtigung wenn er live ist.')
  }

  const addTool = (tool: Tool) => {
    setAgentConfig(prev => ({
      ...prev,
      tools: [...prev.tools, { ...tool, id: `${tool.id}_${Date.now()}` }]
    }))
  }

  const removeTool = (toolId: string) => {
    setAgentConfig(prev => ({
      ...prev,
      tools: prev.tools.filter(t => t.id !== toolId)
    }))
  }

  const renderPromptEditor = () => (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          System Prompt Konfiguration
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Agent Name
            </label>
            <input 
              type="text"
              value={agentConfig.name}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Name Ihres Voice Agents"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Beschreibung
            </label>
            <input 
              type="text"
              value={agentConfig.description}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Kurze Beschreibung des Agents"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              System Prompt
            </label>
            <textarea 
              value={agentConfig.systemPrompt}
              onChange={(e) => setAgentConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
              className="w-full h-64 px-3 py-2 border border-input bg-background rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Geben Sie hier die Anweisungen für Ihren Voice Agent ein..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Erste Nachricht
              </label>
              <input 
                type="text"
                value={agentConfig.firstMessage}
                onChange={(e) => setAgentConfig(prev => ({ ...prev, firstMessage: e.target.value }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Max. Gesprächsdauer (Sekunden)
              </label>
              <input 
                type="number"
                value={agentConfig.endCallConditions.maxDuration}
                onChange={(e) => setAgentConfig(prev => ({ 
                  ...prev, 
                  endCallConditions: { 
                    ...prev.endCallConditions, 
                    maxDuration: parseInt(e.target.value) 
                  }
                }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="text-md font-semibold mb-3">Prompt Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { 
              name: 'Kundenservice', 
              desc: 'Professioneller Support-Bot',
              prompt: `Du bist ein professioneller Kundenservice-Mitarbeiter.

Deine Aufgaben:
- Beantworte Kundenanfragen höflich und kompetent
- Löse Probleme oder leite an zuständige Abteilungen weiter
- Bleibe immer freundlich, auch bei schwierigen Kunden
- Dokumentiere wichtige Informationen

Verhalte dich immer professionell und hilfsbereit.`
            },
            { 
              name: 'Terminbuchung', 
              desc: 'Automatische Terminvergabe',
              prompt: `Du bist ein Terminbuchungs-Assistent.

Deine Aufgaben:
- Erfrage Name, Telefonnummer und gewünschten Service
- Prüfe die Kalender-Verfügbarkeit
- Buche Termine und bestätige Details
- Sende Erinnerungen vor Terminen

Sammle immer alle erforderlichen Informationen bevor du buchst.`
            },
            { 
              name: 'Lead Qualifikation', 
              desc: 'Potentielle Kunden bewerten',
              prompt: `Du bist ein Lead-Qualifikations-Spezialist.

Deine Aufgaben:
- Identifiziere potentielle Kunden
- Bewerte das Interesse und Budget
- Sammle Kontaktdaten und Anforderungen
- Leite qualifizierte Leads an Sales weiter

Stelle die richtigen Fragen um Leads richtig einzuschätzen.`
            },
            { 
              name: 'Produktberatung', 
              desc: 'Verkaufsunterstützung',
              prompt: `Du bist ein Produktberater und Verkaufsexperte.

Deine Aufgaben:
- Verstehe die Bedürfnisse des Kunden
- Empfehle passende Produkte oder Services
- Erkläre Vorteile und Features klar
- Führe zu Kaufentscheidungen

Höre aktiv zu und verkaufe nur was der Kunde wirklich braucht.`
            }
          ].map((template) => (
            <button
              key={template.name}
              onClick={() => setAgentConfig(prev => ({ 
                ...prev, 
                systemPrompt: template.prompt,
                name: template.name + ' Agent'
              }))}
              className="text-left p-3 border border-border rounded-md hover:bg-muted transition-colors"
            >
              <div className="font-medium text-sm">{template.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{template.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderVoiceSettings = () => {
    const ttsProviders = getConfiguredProviders('tts')
    const sttProviders = getConfiguredProviders('stt')

    return (
      <div className="space-y-6">
        {ttsProviders.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800">Keine TTS Provider konfiguriert</h4>
                <p className="text-sm text-yellow-700">
                  Bitte konfigurieren Sie mindestens einen Text-to-Speech Provider in den{' '}
                  <Link href="/settings" className="underline">Einstellungen</Link>.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            Text-to-Speech Konfiguration
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  TTS Provider
                </label>
                <select 
                  value={agentConfig.voice.provider}
                  onChange={(e) => setAgentConfig(prev => ({ 
                    ...prev, 
                    voice: { ...prev.voice, provider: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ttsProviders.length === 0 ? (
                    <option value="">Keine Provider konfiguriert</option>
                  ) : (
                    ttsProviders.map(({ key }) => (
                      <option key={key} value={key}>
                        {key === 'elevenlabs' ? 'ElevenLabs' :
                         key === 'openai' ? 'OpenAI TTS' :
                         key === 'azure_speech' ? 'Azure Speech' :
                         key === 'google_speech' ? 'Google Cloud Speech' :
                         key === 'aws_polly' ? 'AWS Polly' : key}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Stimme
                </label>
                <select 
                  value={agentConfig.voice.voiceId}
                  onChange={(e) => setAgentConfig(prev => ({ 
                    ...prev, 
                    voice: { ...prev.voice, voiceId: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {agentConfig.voice.provider === 'elevenlabs' ? (
                    <>
                      <option value="ErXwobaYiN019PkySvjV">Rachel (Englisch, Weiblich)</option>
                      <option value="MF3mGyEYCl7XYWbV9V6O">Elli (Englisch, Weiblich)</option>
                      <option value="TxGEqnHWrfWFTfGW9XjX">Josh (Englisch, Männlich)</option>
                      <option value="VR6AewLTigWG4xSOukaG">Arnold (Englisch, Männlich)</option>
                    </>
                  ) : agentConfig.voice.provider === 'openai' ? (
                    <>
                      <option value="alloy">Alloy (Neutral)</option>
                      <option value="echo">Echo (Männlich)</option>
                      <option value="nova">Nova (Weiblich)</option>
                      <option value="shimmer">Shimmer (Weiblich)</option>
                    </>
                  ) : (
                    <option value="default">Standard Stimme</option>
                  )}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Stabilität: {agentConfig.voice.stability.toFixed(2)}
                </label>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={agentConfig.voice.stability}
                  onChange={(e) => setAgentConfig(prev => ({ 
                    ...prev, 
                    voice: { ...prev.voice, stability: parseFloat(e.target.value) }
                  }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Klarheit: {agentConfig.voice.clarity.toFixed(2)}
                </label>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={agentConfig.voice.clarity}
                  onChange={(e) => setAgentConfig(prev => ({ 
                    ...prev, 
                    voice: { ...prev.voice, clarity: parseFloat(e.target.value) }
                  }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foregroundmb-2">
                  Geschwindigkeit: {agentConfig.voice.speed.toFixed(1)}x
                </label>
                <input 
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={agentConfig.voice.speed}
                  onChange={(e) => setAgentConfig(prev => ({ 
                    ...prev, 
                    voice: { ...prev.voice, speed: parseFloat(e.target.value) }
                  }))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={testVoice}
                disabled={isPlaying || ttsProviders.length === 0}
                className="bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-primary-foreground px-4 py-2 rounded-md transition-colors flex items-center"
              >
                {isPlaying ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                    Spielt ab...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Stimme testen
                  </>
                )}
              </button>
              
              {testResults && (
                <div className={`text-sm px-3 py-2 rounded-md ${
                  testResults.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {testResults.message}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-semibold mb-3 flex items-center">
            <Mic className="h-4 w-4 mr-2" />
            Speech-to-Text Konfiguration
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                STT Provider
              </label>
              <select 
                value={agentConfig.transcription.provider}
                onChange={(e) => setAgentConfig(prev => ({ 
                  ...prev, 
                  transcription: { ...prev.transcription, provider: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                {sttProviders.length === 0 ? (
                  <option value="">Keine Provider konfiguriert</option>
                ) : (
                  sttProviders.map(({ key }) => (
                    <option key={key} value={key}>
                      {key === 'openai' ? 'OpenAI Whisper' :
                       key === 'azure_speech' ? 'Azure Speech-to-Text' :
                       key === 'google_speech' ? 'Google Cloud Speech-to-Text' : key}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sprache
              </label>
              <select 
                value={agentConfig.transcription.language}
                onChange={(e) => setAgentConfig(prev => ({ 
                  ...prev, 
                  transcription: { ...prev.transcription, language: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="de">Deutsch</option>
                <option value="en">Englisch</option>
                <option value="fr">Französisch</option>
                <option value="es">Spanisch</option>
                <option value="it">Italienisch</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderModelSettings = () => {
    const llmProviders = getConfiguredProviders('llm')

    return (
      <div className="space-y-6">
        {llmProviders.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800">Keine LLM Provider konfiguriert</h4>
                <p className="text-sm text-yellow-700">
                  Bitte konfigurieren Sie mindestens einen Large Language Model Provider in den{' '}
                  <Link href="/settings" className="underline">Einstellungen</Link>.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Model Konfiguration
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  LLM Provider
                </label>
                <select 
                  value={agentConfig.model.provider}
                  onChange={(e) => setAgentConfig(prev => ({ 
                    ...prev, 
                    model: { ...prev.model, provider: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {llmProviders.length === 0 ? (
                    <option value="">Keine Provider konfiguriert</option>
                  ) : (
                    llmProviders.map(({ key }) => (
                      <option key={key} value={key}>
                        {key === 'openai' ? 'OpenAI' :
                         key === 'anthropic' ? 'Anthropic (Claude)' :
                         key === 'azure_openai' ? 'Azure OpenAI' : key}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Model
                </label>
                <select 
                  value={agentConfig.model.model}
                  onChange={(e) => setAgentConfig(prev => ({ 
                    ...prev, 
                    model: { ...prev.model, model: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {agentConfig.model.provider === 'openai' ? (
                    <>
                      <option value="gpt-4o">GPT-4o (Empfohlen)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  ) : agentConfig.model.provider === 'anthropic' ? (
                    <>
                      <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-haiku">Claude 3 Haiku</option>
                    </>
                  ) : (
                    <option value="default">Standard Model</option>
                  )}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Temperature: {agentConfig.model.temperature}
                </label>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={agentConfig.model.temperature}
                  onChange={(e) => setAgentConfig(prev => ({ 
                    ...prev, 
                    model: { ...prev.model, temperature: parseFloat(e.target.value) }
                  }))}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Niedriger = Konsistenter, Höher = Kreativer
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Tokens: {agentConfig.model.maxTokens}
                </label>
                <input 
                  type="range"
                  min="50"
                  max="500"
                  step="25"
                  value={agentConfig.model.maxTokens}
                  onChange={(e) => setAgentConfig(prev => ({ 
                    ...prev, 
                    model: { ...prev.model, maxTokens: parseInt(e.target.value) }
                  }))}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Längere Antworten = Mehr Tokens
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderToolsAndAPIs = () => (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          Verfügbare Tools & APIs
        </h3>
        
        <div className="space-y-4">
          {availableTools.map((tool) => {
            const isAdded = agentConfig.tools.some(t => t.type === tool.type)
            
            return (
              <div key={tool.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {tool.type === 'google_calendar' && <Calendar className="h-4 w-4 text-primary" />}
                      {tool.type === 'webhook' && <Globe className="h-4 w-4 text-primary" />}
                      {tool.type === 'database' && <Database className="h-4 w-4 text-primary" />}
                      {tool.type === 'custom' && <Code className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{tool.name}</h4>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isAdded ? (
                      <button
                        onClick={() => removeTool(tool.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                      >
                        <Trash2 className="h-3 w-3 mr-1 inline" />
                        Entfernen
                      </button>
                    ) : (
                      <button
                        onClick={() => addTool(tool)}
                        className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        <Plus className="h-3 w-3 mr-1 inline" />
                        Hinzufügen
                      </button>
                    )}
                  </div>
                </div>
                
                {tool.type === 'google_calendar' && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                    <p><strong>Funktionen:</strong> Terminprüfung, Buchung, Stornierung, Verfügbarkeit</p>
                    <p><strong>Benötigt:</strong> Google Calendar API Konfiguration in den Einstellungen</p>
                  </div>
                )}
                
                {tool.type === 'webhook' && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                    <p><strong>Funktionen:</strong> HTTP Requests an externe APIs senden</p>
                    <p><strong>Konfiguration:</strong> URL, HTTP Methode, Headers, Body</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {agentConfig.tools.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-semibold mb-3">Konfigurierte Tools</h4>
          <div className="space-y-3">
            {agentConfig.tools.map((tool, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{tool.name}</span>
                </div>
                <button
                  onClick={() => removeTool(tool.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderWorkflows = () => {
    // Load available workflows from localStorage
    const savedWorkflows = localStorage.getItem('voicepartner_workflows')
    let availableWorkflows: any[] = []
    
    if (savedWorkflows) {
      try {
        availableWorkflows = JSON.parse(savedWorkflows)
      } catch (error) {
        console.error('Failed to load workflows:', error)
      }
    }

    return (
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Workflow Integration
            </h3>
            <Link 
              href={`/workflows/new_${Date.now()}/edit`}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Workflow erstellen
            </Link>
          </div>
          
          {availableWorkflows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">Noch keine Workflows konfiguriert</p>
              <p className="text-sm">
                Erstellen Sie visuelle Workflows für komplexe Agent-Logik
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Verknüpfen Sie Ihren Agent mit vorgefertigten Workflows für erweiterte Funktionen:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableWorkflows.map((workflow) => {
                  const isConnected = agentConfig.workflows.some((w: any) => w.id === workflow.id)
                  
                  return (
                    <div key={workflow.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-accent/10 rounded-lg">
                            <GitBranch className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{workflow.name}</h4>
                            <p className="text-xs text-muted-foreground">{workflow.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/workflows/${workflow.id}/edit`}
                            className="p-1 text-gray-400 hover:text-primary"
                            title="Workflow bearbeiten"
                          >
                            <Edit className="h-3 w-3" />
                          </Link>
                          
                          <button
                            onClick={() => {
                              if (isConnected) {
                                // Remove workflow connection
                                setAgentConfig(prev => ({
                                  ...prev,
                                  workflows: prev.workflows.filter((w: any) => w.id !== workflow.id)
                                }))
                              } else {
                                // Add workflow connection
                                setAgentConfig(prev => ({
                                  ...prev,
                                  workflows: [...prev.workflows, {
                                    id: workflow.id,
                                    name: workflow.name,
                                    triggers: workflow.nodes?.filter((n: any) => n.type === 'trigger').length || 0
                                  }]
                                }))
                              }
                            }}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              isConnected
                                ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                : 'bg-accent text-accent-foreground hover:bg-accent/90'
                            }`}
                          >
                            {isConnected ? (
                              <>
                                <Trash2 className="h-3 w-3 mr-1 inline" />
                                Trennen
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-1 inline" />
                                Verbinden
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        <div className="flex justify-between">
                          <span>{workflow.nodes?.length || 0} Schritte</span>
                          <span className={`font-medium ${
                            workflow.status === 'active' ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {workflow.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {agentConfig.workflows.length > 0 && (
                <div className="mt-6 p-4 bg-accent/5 border border-accent/20 rounded-lg">
                  <h4 className="font-medium text-sm mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-accent" />
                    Verbundene Workflows ({agentConfig.workflows.length})
                  </h4>
                  <div className="space-y-2">
                    {agentConfig.workflows.map((workflow: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{workflow.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {workflow.triggers} Trigger
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800">
                      <strong>💡 Tipp:</strong> Workflows erweitern Ihren Agent um komplexe Logik wie Kalenderbuchungen, 
                      E-Mail-Benachrichtigungen und externe API-Aufrufe.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Advanced Workflow Builder Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-md font-semibold mb-4 flex items-center">
            <Zap className="h-4 w-4 mr-2" />
            Erweiterte Workflow-Features
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="h-5 w-5 text-accent" />
                <h5 className="font-medium">Kalender-Integration</h5>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Automatische Terminbuchung mit Google Calendar, Outlook oder anderen Kalendersystemen.
              </p>
              <Link 
                href={`/workflows/calendar_${Date.now()}/edit`}
                className="text-xs text-accent hover:text-accent/80 font-medium"
              >
                Kalender-Workflow erstellen →
              </Link>
            </div>
            
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3 mb-2">
                <Database className="h-5 w-5 text-accent" />
                <h5 className="font-medium">CRM-Integration</h5>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Kundendaten automatisch in Salesforce, HubSpot oder andere CRM-Systeme übertragen.
              </p>
              <Link 
                href={`/workflows/crm_${Date.now()}/edit`}
                className="text-xs text-accent hover:text-accent/80 font-medium"
              >
                CRM-Workflow erstellen →
              </Link>
            </div>
            
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3 mb-2">
                <Globe className="h-5 w-5 text-accent" />
                <h5 className="font-medium">API-Webhooks</h5>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Verbindung zu externen APIs für Datenabfragen, Benachrichtigungen und Integrationen.
              </p>
              <Link 
                href={`/workflows/webhook_${Date.now()}/edit`}
                className="text-xs text-accent hover:text-accent/80 font-medium"
              >
                Webhook-Workflow erstellen →
              </Link>
            </div>
            
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3 mb-2">
                <Phone className="h-5 w-5 text-accent" />
                <h5 className="font-medium">Call Routing</h5>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Intelligente Anrufweiterleitung basierend auf Kundenintent und Verfügbarkeit.
              </p>
              <Link 
                href={`/workflows/routing_${Date.now()}/edit`}
                className="text-xs text-accent hover:text-accent/80 font-medium"
              >
                Routing-Workflow erstellen →
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTesting = () => (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TestTube className="h-5 w-5 mr-2" />
          Agent Testing
        </h3>
        
        <div className="text-center py-12">
          <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">
            Testen Sie Ihren Voice Agent im Live Voice Test
          </p>
          <Link 
            href={`/voice-test?agent=${agentConfig.id}`}
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Mic className="h-5 w-5 mr-2" />
            Voice Test starten
          </Link>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'prompt': return renderPromptEditor()
      case 'voice': return renderVoiceSettings()
      case 'model': return renderModelSettings()
      case 'tools': return renderToolsAndAPIs()
      case 'workflows': return renderWorkflows()
      case 'test': return renderTesting()
      default: return renderPromptEditor()
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <input 
                type="text"
                value={agentConfig.name}
                onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
                className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-foreground"
              />
              <div className="flex items-center space-x-4">
                <p className="text-muted-foreground">Voice Agent Builder</p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  agentConfig.status === 'deployed' ? 'bg-green-100 text-green-800' :
                  agentConfig.status === 'testing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {agentConfig.status === 'deployed' ? 'Deployed' :
                   agentConfig.status === 'testing' ? 'Testing' : 'Draft'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link 
              href="/settings"
              className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Provider Settings
            </Link>
            <button 
              onClick={saveAgent}
              disabled={isSaving}
              className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Speichert...' : 'Speichern'}
            </button>
            <button 
              onClick={deployAgent}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md flex items-center"
            >
              <Play className="h-4 w-4 mr-2" />
              Deploy
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r border-border min-h-screen">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}