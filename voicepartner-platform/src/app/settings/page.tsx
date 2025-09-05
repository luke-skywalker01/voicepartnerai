'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Key,
  Settings,
  Mic,
  MessageSquare,
  Calendar,
  Phone,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Copy,
  Trash2
} from 'lucide-react'

interface Provider {
  id: string
  name: string
  category: 'tts' | 'stt' | 'llm' | 'calendar' | 'telephony'
  icon: string
  description: string
  website: string
  keyFormat: string
  testEndpoint?: string
  requiredFields: Array<{
    key: string
    label: string
    type: 'text' | 'password' | 'url'
    placeholder: string
    required: boolean
  }>
}

const PROVIDERS: Provider[] = [
  // Text-to-Speech Providers
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    category: 'tts',
    icon: '🎤',
    description: 'Hochwertige AI-Stimmen mit emotionaler Intelligenz',
    website: 'https://elevenlabs.io',
    keyFormat: 'sk-...',
    testEndpoint: 'https://api.elevenlabs.io/v1/voices',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...', required: true }
    ]
  },
  {
    id: 'azure_speech',
    name: 'Azure Speech Services',
    category: 'tts',
    icon: '🔷',
    description: 'Microsoft Azure Speech-to-Text und Text-to-Speech',
    website: 'https://azure.microsoft.com/en-us/services/cognitive-services/speech-services/',
    keyFormat: 'subscription key',
    requiredFields: [
      { key: 'subscriptionKey', label: 'Subscription Key', type: 'password', placeholder: 'Your subscription key', required: true },
      { key: 'region', label: 'Region', type: 'text', placeholder: 'westeurope', required: true }
    ]
  },
  {
    id: 'google_speech',
    name: 'Google Cloud Speech',
    category: 'tts',
    icon: '🟡',
    description: 'Google Cloud Text-to-Speech und Speech-to-Text',
    website: 'https://cloud.google.com/speech-to-text',
    keyFormat: 'JSON key file',
    requiredFields: [
      { key: 'projectId', label: 'Project ID', type: 'text', placeholder: 'your-project-id', required: true },
      { key: 'credentials', label: 'Service Account JSON', type: 'password', placeholder: '{"type": "service_account"...}', required: true }
    ]
  },
  {
    id: 'aws_polly',
    name: 'AWS Polly',
    category: 'tts',
    icon: '🟠',
    description: 'Amazon Polly Text-to-Speech Service',
    website: 'https://aws.amazon.com/polly/',
    keyFormat: 'AWS credentials',
    requiredFields: [
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text', placeholder: 'AKIA...', required: true },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', placeholder: 'secret key', required: true },
      { key: 'region', label: 'Region', type: 'text', placeholder: 'us-east-1', required: true }
    ]
  },

  // Large Language Models
  {
    id: 'openai',
    name: 'OpenAI',
    category: 'llm',
    icon: '🤖',
    description: 'GPT-4, GPT-3.5 und Whisper von OpenAI',
    website: 'https://openai.com',
    keyFormat: 'sk-...',
    testEndpoint: 'https://api.openai.com/v1/models',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...', required: true },
      { key: 'organization', label: 'Organization ID (Optional)', type: 'text', placeholder: 'org-...', required: false }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    category: 'llm',
    icon: '🧠',
    description: 'Claude 3.5 Sonnet und andere Claude Modelle',
    website: 'https://anthropic.com',
    keyFormat: 'sk-ant-...',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...', required: true }
    ]
  },
  {
    id: 'azure_openai',
    name: 'Azure OpenAI',
    category: 'llm',
    icon: '🔷',
    description: 'OpenAI Modelle über Microsoft Azure',
    website: 'https://azure.microsoft.com/en-us/products/cognitive-services/openai-service',
    keyFormat: 'azure key',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'your azure key', required: true },
      { key: 'endpoint', label: 'Endpoint URL', type: 'url', placeholder: 'https://your-resource.openai.azure.com/', required: true },
      { key: 'deploymentName', label: 'Deployment Name', type: 'text', placeholder: 'gpt-4', required: true }
    ]
  },

  // Calendar Integration
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    category: 'calendar',
    icon: '📅',
    description: 'Google Calendar für Terminmanagement',
    website: 'https://developers.google.com/calendar',
    keyFormat: 'OAuth 2.0',
    requiredFields: [
      { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'your-client-id.googleusercontent.com', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'GOCSPX-...', required: true },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password', placeholder: '1//...', required: true }
    ]
  },
  {
    id: 'outlook_calendar',
    name: 'Microsoft Outlook',
    category: 'calendar',
    icon: '📆',
    description: 'Microsoft Outlook/Office 365 Calendar',
    website: 'https://docs.microsoft.com/en-us/graph/',
    keyFormat: 'Microsoft Graph',
    requiredFields: [
      { key: 'clientId', label: 'Application ID', type: 'text', placeholder: 'app-id', required: true },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'client-secret', required: true },
      { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'tenant-id', required: true }
    ]
  },

  // Telephony
  {
    id: 'twilio',
    name: 'Twilio',
    category: 'telephony',
    icon: '📞',
    description: 'Twilio Voice und SMS Services',
    website: 'https://twilio.com',
    keyFormat: 'Account SID + Auth Token',
    requiredFields: [
      { key: 'accountSid', label: 'Account SID', type: 'text', placeholder: 'AC...', required: true },
      { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: 'auth token', required: true },
      { key: 'phoneNumber', label: 'Phone Number (Optional)', type: 'text', placeholder: '+1234567890', required: false }
    ]
  },
  {
    id: 'vonage',
    name: 'Vonage (Nexmo)',
    category: 'telephony',
    icon: '☎️',
    description: 'Vonage Voice API für Telefonie',
    website: 'https://vonage.com',
    keyFormat: 'API Key + Secret',
    requiredFields: [
      { key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'vonage api key', required: true },
      { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'vonage api secret', required: true },
      { key: 'applicationId', label: 'Application ID', type: 'text', placeholder: 'app-id', required: true }
    ]
  }
]

const CATEGORIES = [
  { id: 'tts', name: 'Text-to-Speech & STT', icon: Mic, color: 'bg-blue-100 text-blue-800' },
  { id: 'llm', name: 'Large Language Models', icon: MessageSquare, color: 'bg-green-100 text-green-800' },
  { id: 'calendar', name: 'Calendar Integration', icon: Calendar, color: 'bg-purple-100 text-purple-800' },
  { id: 'telephony', name: 'Telephony Services', icon: Phone, color: 'bg-orange-100 text-orange-800' }
]

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('tts')
  const [providers, setProviders] = useState<Record<string, any>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({})

  useEffect(() => {
    // Load saved provider settings from localStorage
    const savedProviders = localStorage.getItem('voicepartner_providers')
    if (savedProviders) {
      try {
        setProviders(JSON.parse(savedProviders))
      } catch (error) {
        console.error('Failed to load provider settings:', error)
      }
    }
  }, [])

  const saveProviders = (updatedProviders: Record<string, any>) => {
    setProviders(updatedProviders)
    localStorage.setItem('voicepartner_providers', JSON.stringify(updatedProviders))
  }

  const updateProviderField = (providerId: string, field: string, value: string) => {
    const updatedProviders = {
      ...providers,
      [providerId]: {
        ...providers[providerId],
        [field]: value
      }
    }
    saveProviders(updatedProviders)
  }

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const testProvider = async (providerId: string) => {
    const provider = PROVIDERS.find(p => p.id === providerId)
    if (!provider || !provider.testEndpoint) return

    setTestingProvider(providerId)
    setTestResults(prev => ({ ...prev, [providerId]: null }))

    try {
      const providerConfig = providers[providerId]
      if (!providerConfig) {
        throw new Error('Provider not configured')
      }

      // Simple test based on provider type
      let testPassed = false

      if (provider.id === 'elevenlabs') {
        const response = await fetch(provider.testEndpoint, {
          headers: {
            'xi-api-key': providerConfig.apiKey
          }
        })
        testPassed = response.ok
      } else if (provider.id === 'openai') {
        const response = await fetch(provider.testEndpoint, {
          headers: {
            'Authorization': `Bearer ${providerConfig.apiKey}`
          }
        })
        testPassed = response.ok
      }

      setTestResults(prev => ({ ...prev, [providerId]: testPassed ? 'success' : 'error' }))
    } catch (error) {
      console.error('Provider test failed:', error)
      setTestResults(prev => ({ ...prev, [providerId]: 'error' }))
    } finally {
      setTestingProvider(null)
    }
  }

  const removeProvider = (providerId: string) => {
    const updatedProviders = { ...providers }
    delete updatedProviders[providerId]
    saveProviders(updatedProviders)
    setTestResults(prev => {
      const updated = { ...prev }
      delete updated[providerId]
      return updated
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('In Zwischenablage kopiert!')
  }

  const exportSettings = () => {
    const settings = {
      providers,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voicepartner-settings-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredProviders = PROVIDERS.filter(p => p.category === activeCategory)
  const configuredCount = filteredProviders.filter(p => providers[p.id]).length

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
              <h1 className="text-2xl font-bold text-foreground flex items-center">
                <Settings className="h-6 w-6 mr-3" />
                Provider Settings
              </h1>
              <p className="text-muted-foreground">
                Konfigurieren Sie Ihre API-Provider für Voice AI Services
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={exportSettings}
              className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-muted flex items-center"
            >
              <Copy className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-4">Provider Kategorien</h3>
              <div className="space-y-2">
                {CATEGORIES.map((category) => {
                  const providersInCategory = PROVIDERS.filter(p => p.category === category.id)
                  const configuredInCategory = providersInCategory.filter(p => providers[p.id]).length
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        activeCategory === category.id
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <category.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{category.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {configuredInCategory}/{providersInCategory.length} konfiguriert
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">💡 Hinweis</h4>
                <p className="text-xs text-muted-foreground">
                  Konfigurieren Sie mindestens einen Provider pro Kategorie für optimale Funktionalität.
                </p>
              </div>
            </div>
          </div>

          {/* Provider Configuration */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-lg">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {CATEGORIES.find(c => c.id === activeCategory)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {configuredCount} von {filteredProviders.length} Providern konfiguriert
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {filteredProviders.map((provider) => {
                  const isConfigured = !!providers[provider.id]
                  const testResult = testResults[provider.id]
                  
                  return (
                    <div
                      key={provider.id}
                      className={`border rounded-lg p-6 ${
                        isConfigured ? 'border-green-200 bg-green-50/50' : 'border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{provider.icon}</div>
                          <div>
                            <h4 className="font-semibold flex items-center space-x-2">
                              <span>{provider.name}</span>
                              {isConfigured && (
                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  Konfiguriert
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground">{provider.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <a
                                href={provider.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:text-primary/80 flex items-center"
                              >
                                Dokumentation <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                              <span className="text-xs text-muted-foreground">
                                Format: {provider.keyFormat}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {provider.testEndpoint && isConfigured && (
                            <button
                              onClick={() => testProvider(provider.id)}
                              disabled={testingProvider === provider.id}
                              className="px-3 py-1 text-xs border border-border rounded hover:bg-muted"
                            >
                              {testingProvider === provider.id ? 'Teste...' : 'Test'}
                            </button>
                          )}
                          
                          {testResult === 'success' && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                          {testResult === 'error' && (
                            <X className="h-4 w-4 text-red-600" />
                          )}

                          {isConfigured && (
                            <button
                              onClick={() => removeProvider(provider.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {provider.requiredFields.map((field) => {
                          const fieldKey = `${provider.id}_${field.key}`
                          const value = providers[provider.id]?.[field.key] || ''
                          
                          return (
                            <div key={field.key}>
                              <label className="block text-sm font-medium mb-2">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <div className="relative">
                                <input
                                  type={field.type === 'password' && !showSecrets[fieldKey] ? 'password' : 'text'}
                                  value={value}
                                  onChange={(e) => updateProviderField(provider.id, field.key, e.target.value)}
                                  placeholder={field.placeholder}
                                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm pr-20"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                  {field.type === 'password' && (
                                    <button
                                      type="button"
                                      onClick={() => toggleSecret(fieldKey)}
                                      className="p-1 hover:bg-muted rounded"
                                    >
                                      {showSecrets[fieldKey] ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                  )}
                                  {value && (
                                    <button
                                      type="button"
                                      onClick={() => copyToClipboard(value)}
                                      className="p-1 hover:bg-muted rounded"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {!isConfigured && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center space-x-2 text-yellow-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">
                              Dieser Provider ist noch nicht konfiguriert. Füllen Sie die erforderlichen Felder aus.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}