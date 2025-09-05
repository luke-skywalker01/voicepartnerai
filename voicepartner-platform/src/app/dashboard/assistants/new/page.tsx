'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bot, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewAssistantPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    firstMessage: 'Hallo! Wie kann ich Ihnen heute helfen?',
    language: 'de-DE',
    voice: {
      provider: 'ElevenLabs',
      voiceId: 'german-female-professional',
      speed: 1.0,
      pitch: 1.0,
      stability: 0.75
    },
    model: {
      provider: 'OpenAI',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 1000
    },
    systemPrompt: 'Du bist ein hilfsfreundlicher Assistent. Antworte immer höflich und professionell auf Deutsch.',
    fallbackLanguage: 'en-US',
    voiceSettings: {
      interruptionSensitivity: 'medium',
      silenceTimeout: 3000,
      responseDelay: 500
    },
    capabilities: {
      bookAppointments: false,
      accessCalendar: false,
      sendEmails: false,
      transferCalls: false,
      accessCRM: false
    }
  })

  // Language configurations with voice mappings
  const languageConfig = {
    'de-DE': {
      name: 'Deutsch',
      flag: '🇩🇪',
      voices: {
        'german-female-professional': 'Anna (Weiblich, Professionell)',
        'german-male-warm': 'Thomas (Männlich, Warm)',
        'german-female-friendly': 'Sarah (Weiblich, Freundlich)',
        'german-male-authority': 'Michael (Männlich, Autoritär)'
      },
      defaultGreeting: 'Hallo! Wie kann ich Ihnen heute helfen?',
      systemPrompt: 'Du bist ein hilfsfreundlicher Assistent. Antworte immer höflich und professionell auf Deutsch.'
    },
    'en-US': {
      name: 'English (US)',
      flag: '🇺🇸',
      voices: {
        'english-female-professional': 'Rachel (Female, Professional)',
        'english-male-warm': 'Adam (Male, Warm)',
        'english-female-friendly': 'Emily (Female, Friendly)',
        'english-male-authority': 'Brian (Male, Authority)'
      },
      defaultGreeting: 'Hello! How can I help you today?',
      systemPrompt: 'You are a helpful assistant. Always respond politely and professionally in English.'
    },
    'fr-FR': {
      name: 'Français',
      flag: '🇫🇷',
      voices: {
        'french-female-professional': 'Camille (Féminin, Professionnel)',
        'french-male-warm': 'Pierre (Masculin, Chaleureux)',
        'french-female-friendly': 'Marie (Féminin, Amical)',
        'french-male-authority': 'Jean (Masculin, Autoritaire)'
      },
      defaultGreeting: 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
      systemPrompt: 'Tu es un assistant serviable. Réponds toujours poliment et professionnellement en français.'
    },
    'es-ES': {
      name: 'Español',
      flag: '🇪🇸',
      voices: {
        'spanish-female-professional': 'Carmen (Femenino, Profesional)',
        'spanish-male-warm': 'Diego (Masculino, Cálido)',
        'spanish-female-friendly': 'Sofia (Femenino, Amigable)',
        'spanish-male-authority': 'Carlos (Masculino, Autoritario)'
      },
      defaultGreeting: '¡Hola! ¿Cómo puedo ayudarle hoy?',
      systemPrompt: 'Eres un asistente útil. Responde siempre de manera educada y profesional en español.'
    },
    'it-IT': {
      name: 'Italiano',
      flag: '🇮🇹',
      voices: {
        'italian-female-professional': 'Giulia (Femminile, Professionale)',
        'italian-male-warm': 'Marco (Maschile, Caloroso)',
        'italian-female-friendly': 'Francesca (Femminile, Amichevole)',
        'italian-male-authority': 'Antonio (Maschile, Autorevole)'
      },
      defaultGreeting: 'Ciao! Come posso aiutarla oggi?',
      systemPrompt: 'Sei un assistente utile. Rispondi sempre in modo educato e professionale in italiano.'
    }
  }
  const [saving, setSaving] = useState(false)

  // Handle language change and update dependent fields
  const handleLanguageChange = (newLanguage: string) => {
    const config = languageConfig[newLanguage as keyof typeof languageConfig]
    if (config) {
      setFormData(prev => ({
        ...prev,
        language: newLanguage,
        firstMessage: config.defaultGreeting,
        systemPrompt: config.systemPrompt,
        voice: {
          ...prev.voice,
          voiceId: Object.keys(config.voices)[0] // Select first voice for new language
        }
      }))
    }
  }

  // Test voice function
  const testVoice = async () => {
    const utterance = new SpeechSynthesisUtterance(formData.firstMessage)
    utterance.lang = formData.language
    utterance.rate = formData.voice.speed
    utterance.pitch = formData.voice.pitch
    speechSynthesis.speak(utterance)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const newAssistant = {
        id: `assistant_${Date.now()}`,
        ...formData,
        type: 'advanced_multilingual',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          languageConfig: languageConfig[formData.language as keyof typeof languageConfig],
          version: '2.0'
        }
      }

      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem('voicepartner_agents')
        const assistants = existing ? JSON.parse(existing) : []
        assistants.push(newAssistant)
        localStorage.setItem('voicepartner_agents', JSON.stringify(assistants))
      }

      router.push('/dashboard/assistants')
    } catch (error) {
      console.error('Failed to save assistant:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/assistants"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Neuer Assistant</h1>
          <p className="text-muted-foreground">Erstellen Sie einen neuen Voice AI Assistant</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            Grundinformationen
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="z.B. Kundenservice Assistant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Erste Nachricht</label>
              <input
                type="text"
                value={formData.firstMessage}
                onChange={(e) => setFormData({...formData, firstMessage: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Begrüßung des Assistants"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Beschreibung *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              placeholder="Beschreiben Sie die Funktion und den Zweck des Assistants"
            />
          </div>
        </div>

        {/* Language & Voice Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sprache & Voice Einstellungen</h2>
          
          {/* Language Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Hauptsprache</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(languageConfig).map(([code, config]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleLanguageChange(code)}
                  className={`p-3 border rounded-lg transition-all hover:shadow-md ${
                    formData.language === code
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{config.flag}</div>
                  <div className="text-sm font-medium">{config.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Voice Provider</label>
              <select
                value={formData.voice.provider}
                onChange={(e) => setFormData({
                  ...formData, 
                  voice: {...formData.voice, provider: e.target.value}
                })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ElevenLabs">ElevenLabs (Premium)</option>
                <option value="OpenAI">OpenAI TTS</option>
                <option value="Cartesia">Cartesia Sonic</option>
                <option value="Google">Google Cloud TTS</option>
                <option value="Azure">Azure Cognitive Services</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Voice</label>
              <div className="flex space-x-2">
                <select
                  value={formData.voice.voiceId}
                  onChange={(e) => setFormData({
                    ...formData, 
                    voice: {...formData.voice, voiceId: e.target.value}
                  })}
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.entries(languageConfig[formData.language as keyof typeof languageConfig]?.voices || {}).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={testVoice}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors"
                  title="Voice testen"
                >
                  🔊
                </button>
              </div>
            </div>
          </div>

          {/* Voice Fine-tuning */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Geschwindigkeit ({formData.voice.speed}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={formData.voice.speed}
                onChange={(e) => setFormData({
                  ...formData,
                  voice: {...formData.voice, speed: parseFloat(e.target.value)}
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Langsam</span>
                <span>Normal</span>
                <span>Schnell</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tonhöhe ({formData.voice.pitch}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={formData.voice.pitch}
                onChange={(e) => setFormData({
                  ...formData,
                  voice: {...formData.voice, pitch: parseFloat(e.target.value)}
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Tief</span>
                <span>Normal</span>
                <span>Hoch</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Stabilität ({Math.round(formData.voice.stability * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={formData.voice.stability}
                onChange={(e) => setFormData({
                  ...formData,
                  voice: {...formData.voice, stability: parseFloat(e.target.value)}
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Variabel</span>
                <span>Stabil</span>
              </div>
            </div>
          </div>

          {/* Fallback Language */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Fallback-Sprache</label>
            <select
              value={formData.fallbackLanguage}
              onChange={(e) => setFormData({...formData, fallbackLanguage: e.target.value})}
              className="w-full md:w-1/2 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {Object.entries(languageConfig).map(([code, config]) => (
                <option key={code} value={code}>
                  {config.flag} {config.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Verwendet wenn die Hauptsprache nicht erkannt wird
            </p>
          </div>
        </div>

        {/* AI Model Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">KI Model Einstellungen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Model Provider</label>
              <select
                value={formData.model.provider}
                onChange={(e) => setFormData({
                  ...formData, 
                  model: {...formData.model, provider: e.target.value}
                })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="OpenAI">OpenAI (GPT-4o, GPT-3.5)</option>
                <option value="Anthropic">Anthropic (Claude)</option>
                <option value="Google">Google (Gemini)</option>
                <option value="Groq">Groq (Ultra-Fast)</option>
                <option value="Perplexity">Perplexity</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <select
                value={formData.model.model}
                onChange={(e) => setFormData({
                  ...formData, 
                  model: {...formData.model, model: e.target.value}
                })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="gpt-4o">GPT-4o (Empfohlen)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Schneller)</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Günstig)</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
          </div>

          {/* Model Parameters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Kreativität ({formData.model.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.model.temperature}
                onChange={(e) => setFormData({
                  ...formData,
                  model: {...formData.model, temperature: parseFloat(e.target.value)}
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Präzise</span>
                <span>Ausgewogen</span>
                <span>Kreativ</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Max Tokens ({formData.model.maxTokens})
              </label>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={formData.model.maxTokens}
                onChange={(e) => setFormData({
                  ...formData,
                  model: {...formData.model, maxTokens: parseInt(e.target.value)}
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Kurz</span>
                <span>Mittel</span>
                <span>Lang</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">System Prompt</label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData({...formData, systemPrompt: e.target.value})}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={4}
              placeholder="Definieren Sie das Verhalten und die Persönlichkeit des Assistants"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Automatisch an die gewählte Sprache angepasst
            </p>
          </div>
        </div>

        {/* Advanced Voice Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Erweiterte Voice Einstellungen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Unterbrechungssensitivität</label>
              <select
                value={formData.voiceSettings.interruptionSensitivity}
                onChange={(e) => setFormData({
                  ...formData,
                  voiceSettings: {...formData.voiceSettings, interruptionSensitivity: e.target.value}
                })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="low">Niedrig - Wenig Unterbrechungen</option>
                <option value="medium">Mittel - Ausgewogen</option>
                <option value="high">Hoch - Reagiert schnell</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Stille Timeout ({formData.voiceSettings.silenceTimeout}ms)
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={formData.voiceSettings.silenceTimeout}
                onChange={(e) => setFormData({
                  ...formData,
                  voiceSettings: {...formData.voiceSettings, silenceTimeout: parseInt(e.target.value)}
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1s</span>
                <span>5s</span>
                <span>10s</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Antwort Verzögerung ({formData.voiceSettings.responseDelay}ms)
              </label>
              <input
                type="range"
                min="0"
                max="2000"
                step="100"
                value={formData.voiceSettings.responseDelay}
                onChange={(e) => setFormData({
                  ...formData,
                  voiceSettings: {...formData.voiceSettings, responseDelay: parseInt(e.target.value)}
                })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Sofort</span>
                <span>1s</span>
                <span>2s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Funktionen & Integrationen</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Wählen Sie, welche Funktionen Ihr Assistant verwenden kann
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries({
              bookAppointments: {
                label: 'Termine buchen',
                description: 'Kalendermanagement und Terminbuchung',
                icon: '📅'
              },
              accessCalendar: {
                label: 'Kalender zugreifen',
                description: 'Termine anzeigen und verwalten',
                icon: '🗓️'
              },
              sendEmails: {
                label: 'E-Mails senden',
                description: 'Automatische E-Mail-Kommunikation',
                icon: '📧'
              },
              transferCalls: {
                label: 'Anrufe weiterleiten',
                description: 'An menschliche Agenten weiterleiten',
                icon: '📞'
              },
              accessCRM: {
                label: 'CRM zugreifen',
                description: 'Kundendaten lesen und schreiben',
                icon: '👥'
              }
            }).map(([key, capability]) => (
              <div key={key} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                <div className="text-2xl">{capability.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium cursor-pointer">
                      {capability.label}
                    </label>
                    <input
                      type="checkbox"
                      checked={formData.capabilities[key as keyof typeof formData.capabilities]}
                      onChange={(e) => setFormData({
                        ...formData,
                        capabilities: {
                          ...formData.capabilities,
                          [key]: e.target.checked
                        }
                      })}
                      className="rounded border-border"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {capability.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/assistants"
            className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Abbrechen
          </Link>
          
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Speichern...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Assistant erstellen
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}